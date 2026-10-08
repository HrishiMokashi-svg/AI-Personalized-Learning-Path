"""Google AI Studio (Gemini) API calls: text generation + embeddings."""
import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "text-embedding-004")
BASE = "https://generativelanguage.googleapis.com/v1beta"


def _headers():
    if not API_KEY or API_KEY.startswith("PASTE_"):
        raise RuntimeError("GOOGLE_API_KEY is not set in backend/.env")
    return {"Content-Type": "application/json", "x-goog-api-key": API_KEY}


def generate_text(prompt: str, system: str | None = None,
                  json_mode: bool = False, temperature: float = 0.7) -> str:
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"
    r = requests.post(f"{BASE}/models/{MODEL}:generateContent",
                      headers=_headers(), json=body, timeout=90)
    if r.status_code != 200:
        raise RuntimeError(f"Gemini error {r.status_code}: {r.text[:300]}")
    data = r.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise RuntimeError(f"Unexpected Gemini response: {str(data)[:300]}")


def generate_json(prompt: str, system: str | None = None) -> dict:
    text = generate_text(prompt, system=system, json_mode=True, temperature=0.5)
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(text)


def embed_text(text: str) -> list[float]:
    body = {"model": f"models/{EMBED_MODEL}", "content": {"parts": [{"text": text[:8000]}]}}
    r = requests.post(f"{BASE}/models/{EMBED_MODEL}:embedContent",
                      headers=_headers(), json=body, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Embedding error {r.status_code}: {r.text[:300]}")
    return r.json()["embedding"]["values"]
