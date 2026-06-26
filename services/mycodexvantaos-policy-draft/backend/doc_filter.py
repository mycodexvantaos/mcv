FILTER_CONFIG = {
    "privacy": {
        "dataTypes": [
            "name", "email", "phone", "address", "usage", "device",
            "location", "cookies", "payment", "health", "biometric", "children",
        ],
        "thirdParties": [
            "analytics", "ads", "payment_proc", "cloud", "email_svc",
            "crm", "social", "cdn", "auth", "ml",
        ],
        "dataPractices": ["retention", "encryption", "selling", "crossBorder"],
        "compliance": ["gdpr", "ccpa", "coppa", "pipeda"],
        "userRights": ["access", "deletion", "optout", "portability", "rectification"],
    },
    "terms": {
        "dataTypes": ["usage", "device", "cookies", "payment"],
        "thirdParties": ["analytics", "payment_proc", "cloud", "auth"],
        "dataPractices": ["retention", "encryption"],
        "compliance": ["gdpr", "ccpa"],
        "userRights": ["access", "deletion", "optout"],
    },
    "cookie": {
        "dataTypes": ["cookies", "usage", "device", "location"],
        "thirdParties": ["analytics", "ads", "social", "cdn"],
        "dataPractices": ["retention", "selling"],
        "compliance": ["gdpr", "ccpa", "pipeda"],
        "userRights": ["access", "optout"],
    },
    "disclaimer": {
        "dataTypes": [],
        "thirdParties": [],
        "dataPractices": [],
        "compliance": ["gdpr", "ccpa", "coppa", "pipeda"],
        "userRights": [],
    },
    "refund": {
        "dataTypes": ["name", "email", "payment", "address"],
        "thirdParties": ["payment_proc", "email_svc", "crm"],
        "dataPractices": ["retention"],
        "compliance": ["ccpa"],
        "userRights": ["access", "deletion"],
    },
    "eula": {
        "dataTypes": ["usage", "device", "location"],
        "thirdParties": ["cloud", "analytics", "auth", "ml"],
        "dataPractices": ["encryption", "crossBorder"],
        "compliance": ["gdpr", "ccpa"],
        "userRights": ["access", "deletion", "portability"],
    },
}


def get_filter_config(doc_type: str) -> dict:
    return FILTER_CONFIG.get(doc_type, FILTER_CONFIG["privacy"])
