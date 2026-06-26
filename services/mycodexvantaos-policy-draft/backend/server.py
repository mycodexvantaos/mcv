import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from ai_client import stream_document_generation
from doc_filter import get_filter_config
from file_store import (
    delete_document,
    get_document,
    get_txt_path,
    list_documents,
    save_document,
)
from models import GenerateRequest
from prompts import SYSTEM_PROMPT, build_prompt

PLAIN_ENGLISH_PROMPT = """Read the following legal document and produce a JSON array explaining each section in plain, simple English that anyone can understand.

For each <h2> section in the document, create an object with:
- "title": the section title exactly as written
- "summary": a 1-2 sentence plain English explanation of what this section means for the user. Use everyday language. Avoid legal jargon. Write as if explaining to a friend.
- "key_point": one key takeaway the user should remember

Output ONLY a valid JSON array, like:
[
  {"title": "1. Introduction and Scope", "summary": "This section says who the company is and that this policy applies to you when you use their website or app.", "key_point": "By using the service, you agree to this policy."},
  ...
]

Do NOT include any text before or after the JSON array. No markdown, no code fences.

Here is the legal document:
"""

app = FastAPI(title="MyCodeXvantaOS PolicyDraft API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_DIR = Path(__file__).resolve().parent.parent


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Filters ─────────────────────────────────────────────────────────────────

@app.get("/api/filters/{doc_type}")
async def filters(doc_type: str):
    return get_filter_config(doc_type)


# ── Generate (SSE Streaming) ────────────────────────────────────────────────

def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences if the AI accidentally wraps output."""
    text = re.sub(r"^```html?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text


def _html_to_plain_text(html: str) -> str:
    """Simple HTML to plain text conversion."""
    import re as _re

    text = html
    text = _re.sub(r"<h1[^>]*>(.*?)</h1>", r"\1\n" + "=" * 40 + "\n", text)
    text = _re.sub(r"<h2[^>]*>(.*?)</h2>", r"\n\1\n" + "-" * 30 + "\n", text)
    text = _re.sub(r'<div class="doc-meta">(.*?)</div>', r"\1\n\n", text)
    text = _re.sub(r"<strong>(.*?)</strong>", r"\1", text)
    text = _re.sub(r"<li>(.*?)</li>", r"  • \1\n", text)
    text = _re.sub(r"<br\s*/?>", "\n", text)
    text = _re.sub(r"<p>(.*?)</p>", r"\1\n\n", text, flags=_re.DOTALL)
    text = _re.sub(r"<[^>]+>", "", text)
    text = _re.sub(r"&bull;", "•", text)
    text = _re.sub(r"&mdash;", "—", text)
    text = _re.sub(r"&amp;", "&", text)
    text = _re.sub(r"&lt;", "<", text)
    text = _re.sub(r"&gt;", ">", text)
    text = _re.sub(r"&quot;", '"', text)
    text = _re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@app.post("/api/generate")
async def generate_document(request: GenerateRequest):
    doc_id = str(uuid.uuid4())
    user_prompt = build_prompt(request)

    async def event_generator():
        accumulated_html = ""
        plain_english_json = ""

        yield {
            "event": "status",
            "data": json.dumps({"step": "Connecting to AI engine..."}),
        }

        yield {
            "event": "status",
            "data": json.dumps({"step": "Analyzing requirements and regulations..."}),
        }

        yield {
            "event": "status",
            "data": json.dumps({"step": "Generating document with AI..."}),
        }

        try:
            async for chunk in stream_document_generation(SYSTEM_PROMPT, user_prompt):
                accumulated_html += chunk
                yield {
                    "event": "chunk",
                    "data": json.dumps({"content": chunk}),
                }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"AI generation failed: {e}"}),
            }
            return

        yield {
            "event": "status",
            "data": json.dumps({"step": "Writing plain English summaries..."}),
        }

        # Generate plain English explanations
        plain_english_json = ""
        try:
            explain_prompt = PLAIN_ENGLISH_PROMPT + "\n\n" + accumulated_html
            async for chunk in stream_document_generation(
                "You are a legal document simplifier. Output ONLY valid JSON, nothing else.",
                explain_prompt,
            ):
                plain_english_json += chunk

            plain_english_json = _strip_code_fences(plain_english_json.strip())
            # Validate and compact to single line
            parsed = json.loads(plain_english_json)
            yield {
                "event": "explanations",
                "data": json.dumps(parsed),
            }
        except Exception:
            # Non-critical — if explanations fail, continue without them
            pass

        yield {
            "event": "status",
            "data": json.dumps({"step": "Saving document..."}),
        }

        # Clean up output
        accumulated_html = _strip_code_fences(accumulated_html)
        plain_text = _html_to_plain_text(accumulated_html)

        word_count = len(plain_text.split())
        section_count = accumulated_html.lower().count("<h2")

        meta = {
            "id": doc_id,
            "docType": request.docType,
            "docTypeName": request.docTypeName,
            "companyName": request.companyName,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "wordCount": word_count,
            "sectionCount": section_count,
            "filename": f"{request.companyName.replace(' ', '-')}-{request.docTypeName.replace(' ', '-')}.txt",
            "formData": request.model_dump(),
        }

        try:
            save_document(doc_id, accumulated_html, plain_text, meta, plain_english_json)
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"Failed to save document: {e}"}),
            }
            return

        yield {"event": "metadata", "data": json.dumps(meta)}
        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())


# ── Documents Library ───────────────────────────────────────────────────────

@app.get("/api/documents")
async def list_docs():
    return list_documents()


@app.get("/api/documents/{doc_id}")
async def get_doc(doc_id: str):
    result = get_document(doc_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Document not found")
    html_content, plain_text, meta, explanations = result
    return {"html": html_content, "text": plain_text, "meta": meta, "explanations": explanations}


@app.get("/api/documents/{doc_id}/download")
async def download_doc(doc_id: str):
    result = get_document(doc_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Document not found")
    html_content, _, meta, _ = result

    # Generate PDF from HTML using WeasyPrint
    from weasyprint import HTML as WeasyHTML

    styled_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #222; max-width: 700px; margin: 0 auto; padding: 40px 20px; }}
h1 {{ font-size: 22pt; color: #111; margin-bottom: 4px; }}
h2 {{ font-size: 14pt; color: #1a365d; margin-top: 24px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }}
p {{ margin-bottom: 10px; }}
ul {{ margin: 8px 0 12px 20px; }}
li {{ margin-bottom: 4px; }}
strong {{ color: #111; }}
.doc-meta {{ font-size: 10pt; color: #666; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #ccc; }}
</style></head><body>{html_content}</body></html>"""

    pdf_bytes = WeasyHTML(string=styled_html).write_pdf()

    pdf_filename = meta.get("filename", f"{doc_id}.txt").replace(".txt", ".pdf")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'},
    )


@app.delete("/api/documents/{doc_id}")
async def delete_doc(doc_id: str):
    if not delete_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted"}


# ── PDF Export ──────────────────────────────────────────────────────────────

PDF_STYLE = """
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #222; max-width: 700px; margin: 0 auto; padding: 40px 20px; }
h1 { font-size: 22pt; color: #111; margin-bottom: 4px; }
h2 { font-size: 14pt; color: #1a365d; margin-top: 24px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
p { margin-bottom: 10px; }
ul { margin: 8px 0 12px 20px; }
li { margin-bottom: 4px; }
strong { color: #111; }
.doc-meta { font-size: 10pt; color: #666; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #ccc; }
"""


def _generate_pdf_bytes(html_content: str) -> bytes:
    from weasyprint import HTML as WeasyHTML

    styled = f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{PDF_STYLE}</style></head><body>{html_content}</body></html>'
    return WeasyHTML(string=styled).write_pdf()


from pydantic import BaseModel as _PydanticBaseModel


class _ExportPdfRequest(_PydanticBaseModel):
    html: str


@app.post("/api/export-pdf")
async def export_pdf(req: _ExportPdfRequest):
    try:
        pdf_bytes = _generate_pdf_bytes(req.html)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="document.pdf"'},
    )


# ── Frontend (MUST be last) ────────────────────────────────────────────────

@app.get("/")
async def serve_index():
    return FileResponse(str(WORKSPACE_DIR / "index.html"))


# Serve only static assets (images, etc.) — not policydraft.html
app.mount("/static", StaticFiles(directory=str(WORKSPACE_DIR)), name="static")


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=3001,
        reload=False,
        log_level="info",
    )
