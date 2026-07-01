/**
 * MyCodeXvantaOS — Service Category Model
 * The "AWS Console sidebar" classification.
 */

export interface ServiceCategoryDefinition {
  id: string;
  displayName: string;
  displayNameZh: string;
  description: string;
  icon: string;
  sortOrder: number;
  services: CategoryServiceRef[];
}

export interface CategoryServiceRef {
  id: string;
  phase: "mvp" | "post-mvp" | "deprecated" | "planned";
  description: string;
}

/** MVP service → category mapping */
export const MVP_SERVICE_CATEGORIES: Record<string, string> = {
  identity: "security",
  workspace: "workspace",
  "knowledge-store": "knowledge",
  "knowledge-search": "knowledge",
  "agent-chat": "agent",
  "model-byok": "model",
  "audit-log": "security",
  "usage-meter": "security",
};
