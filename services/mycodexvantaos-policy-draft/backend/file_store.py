import json
import os
import re
from pathlib import Path

STORE_DIR = Path(__file__).resolve().parent.parent / "generated_documents"
STORE_DIR.mkdir(exist_ok=True)

# Validate document IDs to prevent path traversal
_VALID_ID = re.compile(r"^[a-f0-9\-]{36}$")


def _validate_id(doc_id: str) -> bool:
    return bool(_VALID_ID.match(doc_id))


def save_document(doc_id: str, html_content: str, plain_text: str, meta: dict, explanations: str = "") -> str:
    if not _validate_id(doc_id):
        raise ValueError("Invalid document ID")
    html_path = STORE_DIR / f"{doc_id}.html"
    txt_path = STORE_DIR / f"{doc_id}.txt"
    meta_path = STORE_DIR / f"{doc_id}.json"
    explain_path = STORE_DIR / f"{doc_id}.explain.json"

    html_path.write_text(html_content, encoding="utf-8")
    txt_path.write_text(plain_text, encoding="utf-8")
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    if explanations:
        explain_path.write_text(explanations, encoding="utf-8")
    return doc_id


def list_documents() -> list[dict]:
    docs = []
    for meta_file in STORE_DIR.glob("*.json"):
        if meta_file.name.endswith(".explain.json"):
            continue
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            docs.append(meta)
        except (json.JSONDecodeError, OSError):
            continue
    docs.sort(key=lambda d: d.get("createdAt", ""), reverse=True)
    return docs


def get_document(doc_id: str) -> tuple[str, str, dict, str] | None:
    if not _validate_id(doc_id):
        return None
    html_path = STORE_DIR / f"{doc_id}.html"
    txt_path = STORE_DIR / f"{doc_id}.txt"
    meta_path = STORE_DIR / f"{doc_id}.json"
    explain_path = STORE_DIR / f"{doc_id}.explain.json"

    if not meta_path.exists():
        return None

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    html_content = html_path.read_text(encoding="utf-8") if html_path.exists() else ""
    plain_text = txt_path.read_text(encoding="utf-8") if txt_path.exists() else ""
    explanations = explain_path.read_text(encoding="utf-8") if explain_path.exists() else "[]"
    return html_content, plain_text, meta, explanations


def delete_document(doc_id: str) -> bool:
    if not _validate_id(doc_id):
        return False
    deleted = False
    for ext in (".html", ".txt", ".json", ".explain.json"):
        path = STORE_DIR / f"{doc_id}{ext}"
        if path.exists():
            path.unlink()
            deleted = True
    return deleted


def get_txt_path(doc_id: str) -> Path | None:
    if not _validate_id(doc_id):
        return None
    path = STORE_DIR / f"{doc_id}.txt"
    return path if path.exists() else None
