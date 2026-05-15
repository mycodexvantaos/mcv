# Audit Tools

Tools for querying and analyzing audit logs.

## Usage

```bash
# Query recent audit events
./tools/audit/audit-query.sh --last=24h

# Export audit events
./tools/audit/audit-export.sh --format=json --output=audit.json

# Check audit coverage
./tools/audit/audit-coverage.sh
```
