# Contributing to MCV Auditor

## Development Setup

```bash
pip install -r requirements.txt
pytest
```

## Adding Probes

Add new probes to `probes/catalog.py`.
Each probe must have a unique probe_id, phase, threat_vector, and severity.

## Code Standards

- Machine Identity: mycodexvantaos
- Canonical URL: https://mycodexvantaos.com
- No forbidden vendor URLs in any code or documentation
