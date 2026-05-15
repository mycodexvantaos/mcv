#!/bin/bash
# Sec.11 - Resource Kind Contracts (16 YAML files)
set -e
BASE="/workspace/mycodexvantaos"
CREATED=0
SKIPPED=0

write() {
    local path="$1"
    local full="$BASE/$path"
    if [ -f "$full" ]; then
        SKIPPED=$((SKIPPED + 1))
        return
    fi
    mkdir -p "$(dirname "$full")"
    cat > "$full"
    CREATED=$((CREATED + 1))
    echo "  ✅ $path"
}

KINDS="tenant user workspace document document-chunk knowledge-collection retrieval-receipt answer-trace memory-item memory-candidate memory-conflict dream-run dream-action audit-event usage-event model-provider"

DISPLAY_NAMES="Tenant User Workspace Document DocumentChunk KnowledgeCollection RetrievalReceipt AnswerTrace MemoryItem MemoryCandidate MemoryConflict DreamRun DreamAction AuditEvent UsageEvent ModelProvider"

DESCS="Platform\ tenant\ for\ multi-tenancy Platform\ user\ /\ identity\ subject Isolated\ workspace\ for\ teams Uploaded\ document\ in\ knowledge\ store Chunked\ segment\ of\ a\ document Named\ collection\ for\ knowledge\ artifacts Receipt\ for\ knowledge\ retrieval\ operations Trace\ of\ evidence\ for\ AI-generated\ answers Core\ memory\ unit\ in\ the\ memory\ system Candidate\ memory\ pending\ promotion\ or\ rejection Detected\ conflict\ between\ memory\ items A\ dream\ processing\ execution Suggested\ action\ from\ dream\ processing Immutable\ audit\ event Usage\ metering\ event BYOK\ model\ provider\ endpoint"

kinds_array=($KINDS)
display_array=($DISPLAY_NAMES)
descs_array=($DESCS)

for i in "${!kinds_array[@]}"; do
    kind="${kinds_array[$i]}"
    display="${display_array[$i]}"
    desc="${descs_array[$i]}"
    
    write "contracts/resource-kinds/${kind}.yaml" << ENDOFFILE
kind: ${kind}
api_version: mycodexvantaos.io/v1
metadata_schema:
  id:
    type: string
    required: true
  urn:
    type: string
    required: true
  labels:
    type: object
    additionalProperties:
      type: string
  annotations:
    type: object
    additionalProperties:
      type: string
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
spec_schema: {}
status_schema: {}
lifecycle:
  - creating
  - active
  - updating
  - degraded
  - suspended
  - deleting
  - deleted
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: delete
    roles: [workspace-owner, platform-admin]
audit_events:
  - ${kind}.created
  - ${kind}.updated
  - ${kind}.deleted
ENDOFFILE
done

echo "✅ Sec.11 - All 16 resource kind contracts (Created=$CREATED, Skipped=$SKIPPED)"
