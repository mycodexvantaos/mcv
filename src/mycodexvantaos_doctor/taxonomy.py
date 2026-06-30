"""Rationale: 以 MyCodexVantaOS 原廠命名規範定義能力分類，避免外部平台語彙污染治理報告。"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class NativeCategory(str, Enum):
    SERVICE = "服務"
    CAPABILITY = "能力"
    PRODUCT = "產品"
    TOOL = "工具"
    ATTRIBUTE = "屬性"
    TAXONOMY = "類別"
    PERSONA = "角色／使用者"
    WORKFLOW = "流程／工作流"
    DATA = "數據／資料"
    SECURITY = "安全／合規"
    EXPERIENCE = "設計／UX"
    INTERFACE = "API／介面"
    GOVERNANCE = "專案／治理"
    QUALITY = "測試／品質"


class NativeModule(str, Enum):
    CLOUD_RUNTIME = "Cloud Runtime"
    ACTION_ROUTER = "Action Router"
    ARTIFACT_FS = "Artifact FS"
    PREVIEW_PIPELINE = "Preview Pipeline"
    RUNTIME_LIFECYCLE_MANAGER = "Runtime Lifecycle Manager"
    MULTI_CHANNEL_AGENT_GATEWAY = "Multi-Channel Agent Gateway"
    AI_SCHEDULER = "AI Scheduler"
    SKILL_PACK = "MyCodexVantaOS Skill Pack"
    BROWSER_AGENT_VM = "Browser-Agent-VM"
    SERVICE_PIPELINE_GENERATOR = "Service-ID Pipeline Generator"
    TOOL_GATEWAY = "Tool Gateway"
    PROMPT_PROFILE = "Prompt Profile"
    TOOL_PREFERENCE = "Tool Preference"
    SKILL_WEIGHTING = "Skill Weighting"
    KNOWLEDGE_NETWORK = "Knowledge Network"
    PERSISTENT_AGENT_RUNTIME = "Persistent Agent Runtime"
    EVENT_TRIGGER_ENGINE = "Event-Driven Trigger Engine"
    PREDICTIVE_TASK_ENGINE = "Predictive Task Engine"
    FORGE_CLI = "Forge-CLI"
    ARTIFACT_DOC_ENGINE = "Artifact-Doc Engine"
    DATASOURCE_FINANCE = "DataSource-Finance"
    GENAI_IMAGE = "GenAI-Image"
    GENAI_VIDEO = "GenAI-Video"
    UI_DESIGN_ASSISTANT = "UI-Design Assistant"
    GOVERNANCE_LEDGER = "Governance Ledger"
    QUALITY_GATE = "Quality Gate"
    POLICY_ENGINE = "Policy Engine"


@dataclass(frozen=True)
class CategoryRule:
    category: NativeCategory
    icon: str
    keywords: tuple[str, ...]
    path_hints: tuple[str, ...]


CATEGORY_RULES: tuple[CategoryRule, ...] = (
    CategoryRule(
        NativeCategory.SERVICE,
        "🧭",
        ("服務", "service", "endpoint", "microservice", "runtime service"),
        ("service", "services"),
    ),
    CategoryRule(
        NativeCategory.CAPABILITY,
        "⚙️",
        ("能力", "capability", "feature", "module", "component"),
        ("capability", "capabilities", "feature", "features", "module", "modules"),
    ),
    CategoryRule(
        NativeCategory.PRODUCT,
        "📦",
        ("產品", "product", "solution", "platform", "suite"),
        ("product", "products", "solution", "solutions"),
    ),
    CategoryRule(
        NativeCategory.TOOL,
        "🔧",
        ("工具", "tool", "utility", "cli", "sdk", "library"),
        ("tool", "tools", "cli", "sdk", "lib", "libs"),
    ),
    CategoryRule(
        NativeCategory.ATTRIBUTE,
        "🏷️",
        ("屬性", "attribute", "property", "metadata", "config", "spec"),
        ("attribute", "attributes", "property", "properties", "metadata", "config", "configs"),
    ),
    CategoryRule(
        NativeCategory.TAXONOMY,
        "📂",
        ("類別", "category", "class", "type", "taxonomy", "domain"),
        ("category", "categories", "taxonomy", "domain", "domains", "type", "types"),
    ),
    CategoryRule(
        NativeCategory.PERSONA,
        "🧑‍💻",
        ("角色", "使用者", "persona", "role", "user", "admin", "permission"),
        ("persona", "personas", "role", "roles", "user", "users", "iam", "rbac"),
    ),
    CategoryRule(
        NativeCategory.WORKFLOW,
        "🔄",
        ("流程", "工作流", "workflow", "pipeline", "process", "flow", "state machine"),
        ("workflow", "workflows", "pipeline", "pipelines", "process", "bpmn"),
    ),
    CategoryRule(
        NativeCategory.DATA,
        "📊",
        ("數據", "資料", "data", "schema", "database", "dataset", "etl", "dictionary"),
        ("data", "database", "databases", "schema", "schemas", "dataset", "datasets", "etl"),
    ),
    CategoryRule(
        NativeCategory.SECURITY,
        "🔒",
        ("安全", "合規", "security", "compliance", "auth", "policy", "threat", "stride"),
        ("security", "compliance", "auth", "policy", "policies", "risk", "threat"),
    ),
    CategoryRule(
        NativeCategory.EXPERIENCE,
        "🎨",
        ("設計", "design", "ui", "ux", "style", "component", "token"),
        ("design", "ui", "ux", "style", "styles", "component", "components", "tokens"),
    ),
    CategoryRule(
        NativeCategory.INTERFACE,
        "🔌",
        ("api", "介面", "interface", "contract", "proto", "endpoint", "openapi", "grpc"),
        ("api", "apis", "interface", "interfaces", "contract", "contracts", "proto", "openapi", "grpc"),
    ),
    CategoryRule(
        NativeCategory.GOVERNANCE,
        "📋",
        ("專案", "治理", "project", "roadmap", "decision", "adr", "meeting", "okr", "plan"),
        ("project", "projects", "governance", "roadmap", "adr", "decision", "decisions", "okr"),
    ),
    CategoryRule(
        NativeCategory.QUALITY,
        "🧪",
        ("測試", "品質", "test", "qa", "quality", "coverage", "spec", "benchmark"),
        ("test", "tests", "qa", "quality", "coverage", "spec", "specs", "benchmark"),
    ),
)


MODULE_KEYWORDS: dict[NativeModule, tuple[str, ...]] = {
    NativeModule.CLOUD_RUNTIME: ("cloud runtime", "持久雲端", "永久 os", "container", "snapshot"),
    NativeModule.ACTION_ROUTER: ("action router", "自然語言終端", "os api", "指令路由"),
    NativeModule.ARTIFACT_FS: ("artifact fs", "檔案系統", "upload", "download", "artifact"),
    NativeModule.PREVIEW_PIPELINE: ("preview pipeline", "預覽", "render", "preview"),
    NativeModule.RUNTIME_LIFECYCLE_MANAGER: ("lifecycle", "生命週期", "重啟", "刪除", "升級"),
    NativeModule.MULTI_CHANNEL_AGENT_GATEWAY: ("multi-channel", "agent gateway", "telegram", "discord", "wechat"),
    NativeModule.AI_SCHEDULER: ("scheduler", "cron", "排程", "定時"),
    NativeModule.SKILL_PACK: ("skill pack", "技能包", "文檔處理", "金融分析"),
    NativeModule.BROWSER_AGENT_VM: ("browser-agent-vm", "browser-vm", "playwright", "瀏覽器自動化"),
    NativeModule.SERVICE_PIPELINE_GENERATOR: ("service-id", "pipeline generator", "任務規劃", "pipeline 生成"),
    NativeModule.TOOL_GATEWAY: ("tool gateway", "工具閘道", "tool invocation"),
    NativeModule.PROMPT_PROFILE: ("prompt profile", "人格", "prompt 範本"),
    NativeModule.TOOL_PREFERENCE: ("tool preference", "工具偏好"),
    NativeModule.SKILL_WEIGHTING: ("skill weighting", "技能權重"),
    NativeModule.KNOWLEDGE_NETWORK: ("knowledge network", "知識網絡", "best-practice", "embedding"),
    NativeModule.PERSISTENT_AGENT_RUNTIME: ("persistent agent", "always-on", "永久在線", "background jobs"),
    NativeModule.EVENT_TRIGGER_ENGINE: ("event-driven", "event trigger", "事件觸發"),
    NativeModule.PREDICTIVE_TASK_ENGINE: ("predictive", "主動式", "預測"),
    NativeModule.FORGE_CLI: ("forge-cli", "cli", "命令列"),
    NativeModule.ARTIFACT_DOC_ENGINE: ("artifact-doc", "docx", "pdf", "pptx", "xlsx"),
    NativeModule.DATASOURCE_FINANCE: ("datasource-finance", "金融", "行情"),
    NativeModule.GENAI_IMAGE: ("genai-image", "圖像生成", "image generation"),
    NativeModule.GENAI_VIDEO: ("genai-video", "影片生成", "video generation"),
    NativeModule.UI_DESIGN_ASSISTANT: ("ui-design", "前端設計", "design assistant"),
    NativeModule.GOVERNANCE_LEDGER: ("governance ledger", "audit trail", "審計", "稽核"),
    NativeModule.QUALITY_GATE: ("quality gate", "品質閘門", "coverage", "測試覆蓋"),
    NativeModule.POLICY_ENGINE: ("policy engine", "政策", "opa", "rego", "合規規則"),
}


BANNED_EXTERNAL_PLATFORM_TERMS: tuple[str, ...] = (
    "MuleRun",
    "Zapier",
    "Coze",
    "Make.com",
    "IFTTT",
    "n8n",
)


NATIVE_REPLACEMENTS: dict[str, str] = {
    "MuleRun": "MyCodexVantaOS Cloud Runtime",
    "Zapier": "傳統規則式自動化平台",
    "Coze": "傳統 Agent 編排平台",
    "Make.com": "傳統流程自動化平台",
    "IFTTT": "傳統觸發式自動化工具",
    "n8n": "傳統節點式工作流工具",
}
