"""Google AI Studio (Gemini) API calls: text generation + embeddings."""
import json
import os
import re

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

BASE = "https://generativelanguage.googleapis.com/v1beta"


def get_api_key() -> str:
    return os.getenv("GOOGLE_API_KEY", "").strip()


def get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()


def get_embed_model() -> str:
    return os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001").strip()


def _headers():
    key = get_api_key()
    if not key or key.startswith("PASTE_"):
        raise RuntimeError("GOOGLE_API_KEY is not configured or contains placeholder text.")
    return {"Content-Type": "application/json", "x-goog-api-key": key}


def generate_text(prompt: str, system: str | None = None,
                  json_mode: bool = False, temperature: float = 0.7) -> str:
    model = get_model()
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"

    r = requests.post(f"{BASE}/models/{model}:generateContent",
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
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: attempt to find outermost JSON object
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise RuntimeError(f"Could not parse JSON from model output: {cleaned[:300]}")


def embed_text(text: str) -> list[float]:
    embed_model = get_embed_model()
    body = {"model": f"models/{embed_model}", "content": {"parts": [{"text": text[:8000]}]}}
    r = requests.post(f"{BASE}/models/{embed_model}:embedContent",
                      headers=_headers(), json=body, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Embedding error {r.status_code}: {r.text[:300]}")
    return r.json()["embedding"]["values"]
