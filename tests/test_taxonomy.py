from mycodexvantaos_doctor.taxonomy import (
    BANNED_EXTERNAL_PLATFORM_TERMS,
    CATEGORY_RULES,
    MODULE_KEYWORDS,
    NATIVE_REPLACEMENTS,
    NativeCategory,
    NativeModule,
)


def test_all_native_categories_have_rules() -> None:
    ruled = {rule.category for rule in CATEGORY_RULES}
    assert ruled == set(NativeCategory)


def test_module_keywords_are_non_empty() -> None:
    assert set(MODULE_KEYWORDS) == set(NativeModule)
    assert all(keywords for keywords in MODULE_KEYWORDS.values())


def test_external_terms_have_replacements() -> None:
    assert set(BANNED_EXTERNAL_PLATFORM_TERMS) <= set(NATIVE_REPLACEMENTS)
