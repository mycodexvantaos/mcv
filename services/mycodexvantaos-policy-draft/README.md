# MyCodeXvantaOS PolicyDraft

AI-powered legal policy document generator integrated into the MyCodeXvantaOS platform.

## Overview

MyCodeXvantaOS PolicyDraft generates professional, legally-sound documents formatted in clean HTML with plain-English explanations. It supports privacy policies, terms of service, cookie policies, disclaimers, refund policies, and EULAs.

## Architecture

```
mycodexvantaos-policy-draft/
├── backend/
│   ├── server.py          # FastAPI application (uvicorn on port 3001)
│   ├── ai_client.py       # Claude Code CLI streaming integration
│   ├── models.py          # Pydantic request/response models
│   ├── prompts.py         # System prompts & per-doc-type prompt builders
│   ├── doc_filter.py      # Filter configuration per document type
│   └── file_store.py      # Local file-based document storage
├── scripts/
│   ├── install.sh         # Install system & Python dependencies
│   ├── start.sh           # Start via supervisord with credential injection
│   └── mcxos-policy-draft.conf  # Supervisor config template
├── index.html             # Web UI — AI Legal Document Generator
├── policydraft.html       # Document viewer / export page
├── cover_policydraft.png  # Cover image
├── mycodexvantaos-module.yaml  # Module manifest
└── README.md              # This file
```

## API Endpoints

| Endpoint                           | Method | Description                       |
| ---------------------------------- | ------ | --------------------------------- |
| `/api/health`                      | GET    | Health check                      |
| `/api/filters/{doc_type}`          | GET    | Filter config for document type   |
| `/api/generate`                    | POST   | Generate document (SSE streaming) |
| `/api/documents`                   | GET    | List generated documents          |
| `/api/documents/{doc_id}`          | GET    | Get document by ID                |
| `/api/documents/{doc_id}/download` | GET    | Download as PDF                   |
| `/api/documents/{doc_id}`          | DELETE | Delete document                   |
| `/api/export-pdf`                  | POST   | Export HTML as PDF                |

## Supported Document Types

- `privacy` — Privacy Policy
- `terms` — Terms of Service
- `cookie` — Cookie Policy
- `disclaimer` — Disclaimer
- `refund` — Refund Policy
- `eula` — End User License Agreement

## Quick Start

```bash
cd services/mycodexvantaos-policy-draft
./scripts/install.sh
./scripts/start.sh
# Backend running on http://localhost:3001
```

## Dependencies

- Python 3.11+
- FastAPI + uvicorn + sse-starlette + pydantic
- WeasyPrint (for PDF export)
- Claude Code CLI (for AI document generation)

## Integration

This service is part of the MyCodeXvantaOS platform. It consumes the `cap.llm.invoke` capability from the adapters layer and provides `cap.legal.generate`, `cap.legal.explain`, and `cap.legal.export-pdf` capabilities.
