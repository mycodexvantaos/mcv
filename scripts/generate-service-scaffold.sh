#!/usr/bin/env bash
# scripts/generate-service-scaffold.sh
# Generate a complete service scaffold from a service-id.
# Based on naming-spec-v1.md Sec.5.1, Sec.6.1, Sec.6.2, Sec.6.3, Sec.7.1, Sec.7.3
#
# Creates:
#   services/<service-id>/
#   modules/<service-id>/module-manifest.yaml
#   modules/<service-id>/capabilities.yaml
#   packages/<package-short-id>/package.json
#   packages/<package-short-id>/src/index.ts
#   infra/kubernetes/base/<service-id>/deployment.yaml
#   infra/kubernetes/base/<service-id>/service.yaml
#   infra/kubernetes/base/<service-id>/configmap.yaml
#
# Usage:
#   ./scripts/generate-service-scaffold.sh <service-id> [--capabilities=cap1,cap2] [--dry-run]
#
# Example:
#   ./scripts/generate-service-scaffold.sh mycodexvantaos-ai-reasoning --capabilities=llm,embedding

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
SERVICE_ID=""
CAPABILITIES=""
DRY_RUN=0

# Parse arguments
for arg in "$@"; do
  case $arg in
    mycodexvantaos-*)
      SERVICE_ID="${arg}"
      ;;
    --capabilities=*)
      CAPABILITIES="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    --help)
      echo "Usage: ./scripts/generate-service-scaffold.sh <service-id> [--capabilities=cap1,cap2] [--dry-run]"
      echo ""
      echo "  <service-id>              Must match ^mycodexvantaos-[a-z0-9]+(-[a-z0-9]+)+\$"
      echo "  --capabilities=cap1,cap2  Comma-separated list of canonical capability-ids"
      echo "  --dry-run                 Show what would be created without creating files"
      echo ""
      echo "Example:"
      echo "  ./scripts/generate-service-scaffold.sh mycodexvantaos-ai-reasoning --capabilities=llm,embedding"
      exit 0
      ;;
  esac
done

# Validate service-id
if [ -z "${SERVICE_ID}" ]; then
  echo "ERROR: service-id is required. Must start with 'mycodexvantaos-'."
  exit 1
fi

if ! echo "${SERVICE_ID}" | grep -qE '^mycodexvantaos-[a-z0-9]+(-[a-z0-9]+)+$'; then
  echo "ERROR: Invalid service-id '${SERVICE_ID}'."
  echo "  Must match: ^mycodexvantaos-[a-z0-9]+(-[a-z0-9]+)+\$"
  echo "  Must start with: mycodexvantaos-"
  echo "  Must contain at least: domain + capability"
  exit 1
fi

# Derive identifiers
WITHOUT_PREFIX="${SERVICE_ID#mycodexvantaos-}"
DOMAIN="${WITHOUT_PREFIX%%-*}"
PACKAGE_SHORT_ID="${WITHOUT_PREFIX}"
PACKAGE_NAME="@mycodexvantaos/${PACKAGE_SHORT_ID}"
TODAY=$(date -u +%Y-%m-%d)

echo "=== mycodexvantaos service scaffold generator ==="
echo "  service-id       : ${SERVICE_ID}"
echo "  domain           : ${DOMAIN}"
echo "  package-name     : ${PACKAGE_NAME}"
echo "  capabilities     : ${CAPABILITIES:-none}"
echo "  dry-run          : $([ $DRY_RUN -eq 1 ] && echo yes || echo no)"
echo ""

# Helper: create file (respects dry-run)
create_file() {
  local FILE_PATH="$1"
  local CONTENT="$2"
  local FULL_PATH="${REPO_ROOT}/${FILE_PATH}"

  if [ $DRY_RUN -eq 1 ]; then
    echo "  [DRY-RUN] Would create: ${FILE_PATH}"
    return
  fi

  mkdir -p "$(dirname "${FULL_PATH}")"
  if [ -f "${FULL_PATH}" ]; then
    echo "  [SKIP] Already exists: ${FILE_PATH}"
    return
  fi

  printf '%s\n' "${CONTENT}" > "${FULL_PATH}"
  echo "  [CREATE] ${FILE_PATH}"
}

# ─── services/<service-id>/ ───────────────────────────────────────────────────
create_file "services/${SERVICE_ID}/src/index.ts" \
"/**
 * services/${SERVICE_ID}/src/index.ts
 * Entry point for ${SERVICE_ID}
 */
export * from './service';
"

create_file "services/${SERVICE_ID}/src/service.ts" \
"/**
 * services/${SERVICE_ID}/src/service.ts
 */
export class ${SERVICE_ID//-/_}Service {
  constructor() {}
}
"

create_file "services/${SERVICE_ID}/tests/.gitkeep" ""

create_file "services/${SERVICE_ID}/Dockerfile" \
"FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD [\"node\", \"dist/index.js\"]

# OCI image: <registry>/mycodexvantaos/${SERVICE_ID}:<tag>
# Sec.7.3 — image repository name equals service-id
"

create_file "services/${SERVICE_ID}/.env.example" \
"# Environment variables for ${SERVICE_ID}
# All variables MUST use MYCODEXVANTAOS_ prefix (Sec.7.2)
MYCODEXVANTAOS_$(echo "${SERVICE_ID//-/_}" | tr '[:lower:]' '[:upper:]')_PORT=3000
MYCODEXVANTAOS_$(echo "${SERVICE_ID//-/_}" | tr '[:lower:]' '[:upper:]')_LOG_LEVEL=info
MYCODEXVANTAOS_DATABASE_URL=postgres://localhost:5432/${SERVICE_ID//-/_}
"

# ─── modules/<service-id>/ ────────────────────────────────────────────────────
# Build capabilities list for YAML
CAP_YAML=""
if [ -n "${CAPABILITIES}" ]; then
  IFS=',' read -ra CAPS <<< "${CAPABILITIES}"
  for CAP in "${CAPS[@]}"; do
    CAP_YAML="${CAP_YAML}    - ${CAP}"$'\n'
  done
else
  CAP_YAML="    [] # Add canonical capability-ids from Sec.5.5"
fi

create_file "modules/${SERVICE_ID}/module-manifest.yaml" \
"# modules/${SERVICE_ID}/module-manifest.yaml
# Based on naming-spec-v1.md Sec.6.3, schemas/service-manifest.schema.json

apiVersion: mycodexvantaos.org/v1
kind: Module
metadata:
  name: ${SERVICE_ID}
  # Sec.6.4 — metadata.name MUST equal the service-id exactly
  labels:
    mycodexvantaos.org/domain: ${DOMAIN}
    mycodexvantaos.org/managed-by: naming-spec-v1

spec:
  domain: ${DOMAIN}
  capabilities:
$([ -n "${CAP_YAML}" ] && echo "${CAP_YAML}" || echo "    []")
  providers: {}
  lifecycle:
    stage: experimental
    since: \"\"
  urn: \"urn:mycodexvantaos:manifest:service:${SERVICE_ID}\"
  packageName: \"${PACKAGE_NAME}\"
  description: \"TODO: describe ${SERVICE_ID}\"
"

create_file "modules/${SERVICE_ID}/capabilities.yaml" \
"# modules/${SERVICE_ID}/capabilities.yaml
# Declared capability dependencies for ${SERVICE_ID}
# Based on naming-spec-v1.md Sec.5.5

capabilities:
$([ -n "${CAP_YAML}" ] && echo "${CAP_YAML}" || echo "  [] # Add canonical capability-ids")
"

# ─── packages/<package-short-id>/ ────────────────────────────────────────────
create_file "packages/${PACKAGE_SHORT_ID}/package.json" \
"{
  \"name\": \"${PACKAGE_NAME}\",
  \"version\": \"0.0.1\",
  \"description\": \"${SERVICE_ID} package\",
  \"main\": \"dist/index.js\",
  \"types\": \"dist/index.d.ts\",
  \"scripts\": {
    \"build\": \"tsc\",
    \"test\": \"jest\"
  }
}
"

create_file "packages/${PACKAGE_SHORT_ID}/src/index.ts" \
"/**
 * packages/${PACKAGE_SHORT_ID}/src/index.ts
 * Package: ${PACKAGE_NAME}
 */
export {};
"

# ─── infra/kubernetes/base/<service-id>/ ─────────────────────────────────────
create_file "infra/kubernetes/base/${SERVICE_ID}/deployment.yaml" \
"# infra/kubernetes/base/${SERVICE_ID}/deployment.yaml
# Sec.5.4, Sec.6.4 — metadata.name MUST equal the service-id
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_ID}
  # namespace is NOT set here — set by Kustomize overlay (Sec.12.1)
  labels:
    app.kubernetes.io/name: ${SERVICE_ID}
    app.kubernetes.io/managed-by: mycodexvantaos
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: ${SERVICE_ID}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${SERVICE_ID}
    spec:
      containers:
        - name: ${SERVICE_ID}
          image: ghcr.io/mycodexvantaos/${SERVICE_ID}:latest
          # Production MUST use digest pinning (Sec.7.3):
          # image: ghcr.io/mycodexvantaos/${SERVICE_ID}@sha256:<digest>
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: ${SERVICE_ID}
"

create_file "infra/kubernetes/base/${SERVICE_ID}/service.yaml" \
"# infra/kubernetes/base/${SERVICE_ID}/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ${SERVICE_ID}
  labels:
    app.kubernetes.io/name: ${SERVICE_ID}
spec:
  selector:
    app.kubernetes.io/name: ${SERVICE_ID}
  ports:
    - port: 80
      targetPort: 3000
"

create_file "infra/kubernetes/base/${SERVICE_ID}/configmap.yaml" \
"# infra/kubernetes/base/${SERVICE_ID}/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${SERVICE_ID}
  labels:
    app.kubernetes.io/name: ${SERVICE_ID}
data:
  MYCODEXVANTAOS_$(echo "${SERVICE_ID//-/_}" | tr '[:lower:]' '[:upper:]')_LOG_LEVEL: info
"

echo ""
echo "=== Scaffold complete ==="
echo "  Next steps:"
echo "  1. Fill in spec.description in modules/${SERVICE_ID}/module-manifest.yaml"
echo "  2. Add capabilities to modules/${SERVICE_ID}/capabilities.yaml"
echo "  3. Implement src/service.ts in services/${SERVICE_ID}/"
echo "  4. Set lifecycle.stage from 'experimental' to 'alpha' when ready"
echo "  5. Run: ./scripts/validate-all.sh to verify naming compliance"
