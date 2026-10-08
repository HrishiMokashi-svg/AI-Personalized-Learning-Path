"""RAG: chunk -> embed -> store in MySQL -> retrieve by cosine similarity."""
import math
import os
import re

from sqlalchemy.orm import Session

import api_calling
from models import KBChunk

KB_DIR = os.path.join(os.path.dirname(__file__), "kb")


def chunk_text(text: str, size: int = 700, overlap: int = 120) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = end - overlap
    return [c for c in chunks if c]


def ingest_kb(db: Session) -> dict:
    """Load every .md/.txt file in kb/ into kb_chunks (skips files already ingested)."""
    added = 0
    embedded = 0
    for fname in sorted(os.listdir(KB_DIR)):
        if not fname.endswith((".md", ".txt")):
            continue
        if db.query(KBChunk).filter(KBChunk.source == fname).first():
            continue
        with open(os.path.join(KB_DIR, fname), encoding="utf-8") as f:
            chunks = chunk_text(f.read())
        for i, ch in enumerate(chunks):
            try:
                vec = api_calling.embed_text(ch)
                embedded += 1
            except Exception:
                vec = None  # keyword fallback will be used
            db.add(KBChunk(source=fname, chunk_index=i, content=ch, embedding=vec))
            added += 1
        db.commit()
    return {"chunks_added": added, "embedded": embedded}


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def _keyword_score(query: str, text: str) -> float:
    q = set(re.findall(r"[a-z0-9+#]+", query.lower()))
    t = set(re.findall(r"[a-z0-9+#]+", text.lower()))
    return len(q & t) / (len(q) or 1)


def retrieve(db: Session, query: str, k: int = 4) -> list[dict]:
    chunks = db.query(KBChunk).all()
    if not chunks:
        return []
    qvec = None
    try:
        qvec = api_calling.embed_text(query)
    except Exception:
        pass
    scored = []
    for c in chunks:
        if qvec and c.embedding:
            s = _cosine(qvec, c.embedding)
        else:
            s = _keyword_score(query, c.content)
        scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"source": c.source, "content": c.content, "score": round(s, 3)}
            for s, c in scored[:k]]
