from models import GenerateRequest

SYSTEM_PROMPT = """You are a specialized legal document generator for MyCodeXvantaOS PolicyDraft.
You produce professional, legally-sound documents formatted in clean HTML.

STRICT RULES:
1. Output ONLY the document HTML content. No markdown, no code fences, no preamble, no explanations.
2. Use ONLY these HTML tags: <h1> for the document title, <h2> for numbered section headers, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis.
3. Each section MUST have a numbered header: <h2>1. Section Title</h2>
4. Right after <h1>, include a metadata div: <div class="doc-meta"><strong>COMPANY</strong> &bull; WEBSITE &bull; Last Updated: DATE</div>
5. Be thorough, specific, and legally precise. Use the company details provided.
6. Reference actual regulation names and articles (e.g., "Article 17 of GDPR") when compliance flags are set.
7. Write in formal, professional legal English.
8. Do NOT include any CSS, <style> tags, or JavaScript.
9. Do NOT wrap output in ```html``` code blocks.
10. Generate at least 8 substantive sections for comprehensive coverage.
11. Today's date for the "Last Updated" field should be derived from the current context."""

DATA_LABELS = {
    "name": "full name",
    "email": "email address",
    "phone": "phone number",
    "address": "physical address",
    "usage": "usage and behavioral data",
    "device": "device and browser information",
    "location": "location data",
    "cookies": "cookies and tracking technologies",
    "payment": "payment and billing information",
    "health": "health and medical data",
    "biometric": "biometric data",
    "children": "children's data",
}

PARTY_LABELS = {
    "analytics": "Google Analytics (web analytics)",
    "ads": "advertising networks and ad partners",
    "payment_proc": "payment processors (e.g., Stripe, PayPal)",
    "cloud": "cloud storage and hosting providers",
    "email_svc": "email delivery services (e.g., SendGrid, Mailchimp)",
    "crm": "customer relationship management and support tools",
    "social": "social media platforms",
    "cdn": "content delivery networks (CDN)",
    "auth": "authentication providers (e.g., Auth0, Firebase)",
    "ml": "AI and machine learning service providers",
}

JURISDICTION_NAMES = {
    "us": "Delaware, United States",
    "eu": "European Union",
    "uk": "United Kingdom",
    "ca": "Ontario, Canada",
    "au": "New South Wales, Australia",
    "global": "multiple jurisdictions",
}

INDUSTRY_NAMES = {
    "saas": "SaaS / Software",
    "ecommerce": "E-Commerce",
    "healthcare": "Healthcare",
    "fintech": "Fintech / Finance",
    "education": "Education",
    "media": "Media / Publishing",
    "marketplace": "Marketplace",
    "other": "Other",
}


def _format_list(items: list[str], label_map: dict) -> str:
    if not items:
        return "None specified"
    return ", ".join(label_map.get(i, i) for i in items)


def _format_practices(d: GenerateRequest) -> str:
    lines = []
    lines.append(f"- Data retention policy: {'Yes' if d.dataPractices.retention else 'No'}")
    lines.append(f"- Data encryption in transit and at rest: {'Yes' if d.dataPractices.encryption else 'No'}")
    lines.append(f"- Data selling/sharing for ads: {'Yes' if d.dataPractices.selling else 'No'}")
    lines.append(f"- Cross-border data transfers: {'Yes' if d.dataPractices.crossBorder else 'No'}")
    return "\n".join(lines)


def _format_compliance(d: GenerateRequest) -> str:
    regs = []
    if d.compliance.gdpr:
        regs.append("GDPR (General Data Protection Regulation)")
    if d.compliance.ccpa:
        regs.append("CCPA (California Consumer Privacy Act)")
    if d.compliance.coppa:
        regs.append("COPPA (Children's Online Privacy Protection Act)")
    if d.compliance.pipeda:
        regs.append("PIPEDA (Personal Information Protection and Electronic Documents Act)")
    return ", ".join(regs) if regs else "None specified"


def _format_rights(d: GenerateRequest) -> str:
    rights = []
    if d.userRights.access:
        rights.append("Right to Access")
    if d.userRights.deletion:
        rights.append("Right to Deletion / Erasure")
    if d.userRights.optout:
        rights.append("Right to Opt-Out of data sale and marketing")
    if d.userRights.portability:
        rights.append("Right to Data Portability")
    if d.userRights.rectification:
        rights.append("Right to Rectification")
    return ", ".join(rights) if rights else "None specified"


def _company_block(d: GenerateRequest) -> str:
    lines = [
        f"Company: {d.companyName}",
        f"Website: {d.websiteUrl}",
        f"Contact Email: {d.contactEmail}",
        f"Industry: {INDUSTRY_NAMES.get(d.industry, d.industry or 'Not specified')}",
        f"Jurisdiction: {JURISDICTION_NAMES.get(d.jurisdiction, d.jurisdiction)}",
    ]
    if d.address:
        lines.append(f"Business Address: {d.address}")
    if d.productDesc:
        lines.append(f"Product/Service Description: {d.productDesc}")
    return "\n".join(lines)


def build_prompt(d: GenerateRequest) -> str:
    builders = {
        "privacy": _build_privacy_prompt,
        "terms": _build_terms_prompt,
        "cookie": _build_cookie_prompt,
        "disclaimer": _build_disclaimer_prompt,
        "refund": _build_refund_prompt,
        "eula": _build_eula_prompt,
    }
    builder = builders.get(d.docType, _build_privacy_prompt)
    return builder(d)


def _build_privacy_prompt(d: GenerateRequest) -> str:
    return f"""Generate a comprehensive Privacy Policy for the following company:

{_company_block(d)}

Data Types Collected: {_format_list(d.dataTypes, DATA_LABELS)}
Third-Party Services Used: {_format_list(d.thirdParties, PARTY_LABELS)}

Data Practices:
{_format_practices(d)}

Compliance Requirements: {_format_compliance(d)}
User Rights to Include: {_format_rights(d)}

Generate a complete, professional Privacy Policy with at least 12 numbered sections covering:
1. Introduction and Scope
2. Information We Collect (detail each data type)
3. How We Use Your Information (lawful bases if GDPR)
4. Sharing and Disclosure (list each third party type)
5. Cookies and Tracking Technologies
6. Data Security measures
7. Data Retention periods
8. Your Rights and Choices (detail each right)
9. Children's Privacy
10. International Data Transfers (if cross-border enabled)
11. Changes to This Policy
12. Contact Information

Include specific regulatory references (e.g., GDPR Article 6, CCPA Section 1798.100) where applicable."""


def _build_terms_prompt(d: GenerateRequest) -> str:
    return f"""Generate comprehensive Terms of Service for the following company:

{_company_block(d)}

Data Types Relevant: {_format_list(d.dataTypes, DATA_LABELS)}
Third-Party Services: {_format_list(d.thirdParties, PARTY_LABELS)}

Data Practices:
{_format_practices(d)}

Compliance Requirements: {_format_compliance(d)}

Generate a complete, professional Terms of Service with at least 11 numbered sections covering:
1. Agreement to Terms (acceptance mechanism)
2. Description of Services
3. User Accounts and Registration
4. User Responsibilities and Acceptable Use
5. Intellectual Property Rights
6. Payment Terms and Billing
7. Disclaimer of Warranties (AS IS)
8. Limitation of Liability (caps)
9. Termination
10. Governing Law and Dispute Resolution (jurisdiction: {JURISDICTION_NAMES.get(d.jurisdiction, d.jurisdiction)})
11. Changes to Terms
12. Contact Information

Use formal legal language. Include ALL CAPS for warranty disclaimers and liability limitations as is standard."""


def _build_cookie_prompt(d: GenerateRequest) -> str:
    return f"""Generate a comprehensive Cookie Policy for the following company:

{_company_block(d)}

Tracking Data Collected: {_format_list(d.dataTypes, DATA_LABELS)}
Third-Party Cookie Services: {_format_list(d.thirdParties, PARTY_LABELS)}

Data Practices:
{_format_practices(d)}

Compliance Requirements: {_format_compliance(d)}
User Rights: {_format_rights(d)}

Generate a complete, professional Cookie Policy with at least 7 numbered sections covering:
1. What Are Cookies (explanation)
2. Types of Cookies We Use (essential, analytics, functional, marketing)
3. How We Use Cookies (purposes)
4. Third-Party Cookies (list each provider)
5. Managing and Disabling Cookies (browser settings, opt-out tools)
6. Cookie Retention Periods (session vs persistent)
7. Updates and Contact Information

If GDPR compliance is required, include consent mechanisms and ePrivacy Directive references."""


def _build_disclaimer_prompt(d: GenerateRequest) -> str:
    return f"""Generate a comprehensive Disclaimer for the following company:

{_company_block(d)}

Compliance Requirements: {_format_compliance(d)}

Generate a complete, professional Disclaimer with at least 6 numbered sections covering:
1. Website Disclaimer (general liability limitation)
2. No Professional Advice (legal, financial, medical)
3. Accuracy of Information (no guarantees)
4. External Links Disclaimer (third-party sites)
5. Fair Use Disclaimer (copyrighted material)
6. Contact Information

Use clear, unambiguous legal language. This document should protect the company from liability claims."""


def _build_refund_prompt(d: GenerateRequest) -> str:
    return f"""Generate a comprehensive Refund Policy for the following company:

{_company_block(d)}

Customer Data Involved: {_format_list(d.dataTypes, DATA_LABELS)}
Payment Services: {_format_list(d.thirdParties, PARTY_LABELS)}

Data Practices:
{_format_practices(d)}

Compliance Requirements: {_format_compliance(d)}
User Rights: {_format_rights(d)}

Generate a complete, professional Refund Policy with at least 7 numbered sections covering:
1. Overview (scope and applicability)
2. Eligibility for Refunds (conditions)
3. Non-Refundable Items (exclusions)
4. How to Request a Refund (process, timeline)
5. Subscription Cancellations (prorating, access)
6. Chargebacks (dispute resolution)
7. Contact Information

Be specific about timelines (e.g., 30-day window, 5-10 business day processing)."""


def _build_eula_prompt(d: GenerateRequest) -> str:
    return f"""Generate a comprehensive End User License Agreement (EULA) for the following company:

{_company_block(d)}

Data Collection by Software: {_format_list(d.dataTypes, DATA_LABELS)}
Third-Party Integrations: {_format_list(d.thirdParties, PARTY_LABELS)}

Data Practices:
{_format_practices(d)}

Compliance Requirements: {_format_compliance(d)}
User Rights: {_format_rights(d)}

Generate a complete, professional EULA with at least 9 numbered sections covering:
1. License Grant (limited, non-exclusive, non-transferable, revocable)
2. Restrictions (no reverse engineering, copying, etc.)
3. Intellectual Property (ownership stays with licensor)
4. Updates and Upgrades
5. Data Collection by the Software (privacy reference)
6. Term and Termination (automatic and for cause)
7. Disclaimer of Warranties and Limitation of Liability (ALL CAPS)
8. Governing Law (jurisdiction: {JURISDICTION_NAMES.get(d.jurisdiction, d.jurisdiction)})
9. Contact Information

Use formal EULA language. WARRANTY DISCLAIMERS MUST BE IN ALL CAPS."""
