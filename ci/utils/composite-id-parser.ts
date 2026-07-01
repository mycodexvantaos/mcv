/**
 * ci/utils/composite-id-parser.ts
 *
 * Utility to parse composite identifiers using the -- separator.
 * Based on naming-spec-v1.md Section 9, Section 9.1
 */

/**
 * Split a composite id into its semantic segments using -- as the delimiter.
 * Segments may themselves contain single hyphens.
 *
 * Example: "mycodexvantaos-ai-memory--memories--bge-small-384"
 *   → ["mycodexvantaos-ai-memory", "memories", "bge-small-384"]
 */
export function splitCompositeId(compositeId: string): string[] {
  return compositeId.split("--");
}

export interface VectorCollectionParts {
  serviceId: string;
  purpose: string;
  embeddingModelAlias: string;
}

/** Section 9.2 — Parse a vector collection id */
export function parseVectorCollectionId(id: string): VectorCollectionParts {
  const parts = splitCompositeId(id);
  if (parts.length !== 3) {
    throw new Error(
      `Invalid vector-collection id: "${id}". ` +
        `Expected format: <service-id>--<purpose>--<embedding-model-alias> (Section 9.2)`
    );
  }
  return { serviceId: parts[0], purpose: parts[1], embeddingModelAlias: parts[2] };
}

export interface EmbeddingModelAliasParts {
  provider: string;
  modelName: string;
  dimensionStr: string;
  dimension: number;
}

/** Section 9.3 — Parse an embedding model alias */
export function parseEmbeddingModelAlias(alias: string): EmbeddingModelAliasParts {
  const parts = splitCompositeId(alias);
  if (parts.length !== 3 || !parts[2].endsWith("d")) {
    throw new Error(
      `Invalid embedding-model-alias: "${alias}". ` +
        `Expected format: <provider>--<model-name>--<dimension>d (Section 9.3)`
    );
  }
  const dimensionStr = parts[2];
  const dimension = parseInt(dimensionStr.slice(0, -1), 10);
  return { provider: parts[0], modelName: parts[1], dimensionStr, dimension };
}

export interface RetrievalPipelineParts {
  prefix: string; // always "retrieval"
  strategy: string;
  storeType: string;
}

/** Section 9.4 — Parse a retrieval pipeline id */
export function parseRetrievalPipelineId(id: string): RetrievalPipelineParts {
  const parts = splitCompositeId(id);
  if (parts.length !== 3 || parts[0] !== "retrieval") {
    throw new Error(
      `Invalid retrieval-pipeline-id: "${id}". ` +
        `Expected format: retrieval--<strategy>--<store-type> (Section 9.4)`
    );
  }
  return { prefix: parts[0], strategy: parts[1], storeType: parts[2] };
}

export interface GraphNodeIdParts {
  serviceId: string;
  entityType: string;
  naturalKey: string;
}

/** Section 9.6 — Parse a graph node id */
export function parseGraphNodeId(id: string): GraphNodeIdParts {
  const parts = splitCompositeId(id);
  if (parts.length !== 3) {
    throw new Error(
      `Invalid graph-node-id: "${id}". ` +
        `Expected format: <service-id>--<entity-type>--<natural-key> (Section 9.6)`
    );
  }
  return { serviceId: parts[0], entityType: parts[1], naturalKey: parts[2] };
}

export interface TimestampedIdParts {
  prefix: string;
  date: string; // YYYYMMDD
  random: string; // 6 chars
}

/** Section 9.8 — Parse a timestamped auto-generated id */
export function parseTimestampedId(id: string): TimestampedIdParts {
  const parts = splitCompositeId(id);
  if (parts.length !== 3) {
    throw new Error(
      `Invalid timestamped-id: "${id}". ` +
        `Expected format: <prefix>--<YYYYMMDD>--<random6> (Section 9.8)`
    );
  }
  return { prefix: parts[0], date: parts[1], random: parts[2] };
}
