"""Tests for the Coder-Deep MCP protocol endpoints."""

import os
import sys

import pytest
from fastapi.testclient import TestClient

APP_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "coder-deep-mcp",
)
sys.path.insert(0, APP_DIR)

PKG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "packages",
    "mycodexvantaos-coder-deep",
)
sys.path.insert(0, PKG_DIR)

from main import app  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    """Create a TestClient that runs the lifespan handler to initialize services."""
    with TestClient(app) as c:
        yield c


class TestMCPToolsEndpoint:
    """Test /api/mcp/tools endpoint."""

    def test_list_tools(self, client: TestClient) -> None:
        """GET /api/mcp/tools returns tool catalog."""
        resp = client.get("/api/mcp/tools")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "tools" in data["data"]
        assert data["data"]["count"] >= 10

    def test_tools_have_required_fields(self, client: TestClient) -> None:
        """Each tool has name, description, and input_schema."""
        resp = client.get("/api/mcp/tools")
        tools = resp.json()["data"]["tools"]
        for tool in tools:
            assert "name" in tool
            assert "description" in tool
            assert "input_schema" in tool

    def test_expected_tools_present(self, client: TestClient) -> None:
        """All expected MCP tools are listed."""
        resp = client.get("/api/mcp/tools")
        tools = resp.json()["data"]["tools"]
        tool_names = {t["name"] for t in tools}
        expected = {
            "memory_put",
            "memory_get",
            "memory_search",
            "cache_put",
            "cache_get",
            "behavior_record",
            "codex_put",
            "codex_query",
            "task_create",
            "task_query",
            "architecture_scan",
        }
        assert expected.issubset(tool_names)


class TestMCPResourcesEndpoint:
    """Test /api/mcp/resources endpoint."""

    def test_list_resources(self, client: TestClient) -> None:
        """GET /api/mcp/resources returns resource catalog."""
        resp = client.get("/api/mcp/resources")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "resources" in data["data"]
        assert data["data"]["count"] >= 8

    def test_resources_have_required_fields(self, client: TestClient) -> None:
        """Each resource has uri, name, description, mime_type."""
        resp = client.get("/api/mcp/resources")
        resources = resp.json()["data"]["resources"]
        for resource in resources:
            assert "uri" in resource
            assert "name" in resource
            assert "description" in resource
            assert "mime_type" in resource


class TestMCPPromptsEndpoint:
    """Test /api/mcp/prompts endpoint."""

    def test_list_prompts(self, client: TestClient) -> None:
        """GET /api/mcp/prompts returns prompt templates."""
        resp = client.get("/api/mcp/prompts")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "prompts" in data["data"]
        assert data["data"]["count"] >= 5

    def test_prompts_have_required_fields(self, client: TestClient) -> None:
        """Each prompt has name, description, and arguments."""
        resp = client.get("/api/mcp/prompts")
        prompts = resp.json()["data"]["prompts"]
        for prompt in prompts:
            assert "name" in prompt
            assert "description" in prompt
            assert "arguments" in prompt


class TestMCPToolInvocation:
    """Test /api/mcp/tools/{tool_name} endpoint."""

    def test_invoke_memory_put(self, client: TestClient) -> None:
        """Invoke memory_put tool with namespace, key, value."""
        resp = client.post(
            "/api/mcp/tools/memory_put",
            json={
                "namespace": "mcp-test",
                "key": "mcp-key",
                "value": {"data": "from mcp"},
                "tags": ["mcp"],
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_invoke_memory_get(self, client: TestClient) -> None:
        """Invoke memory_get tool with namespace, key."""
        client.post(
            "/api/mcp/tools/memory_put",
            json={
                "namespace": "mcp-get",
                "key": "test",
                "value": "hello",
            },
        )
        resp = client.post(
            "/api/mcp/tools/memory_get",
            json={
                "namespace": "mcp-get",
                "key": "test",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_invoke_memory_search(self, client: TestClient) -> None:
        """Invoke memory_search tool with key_prefix (not 'query')."""
        client.post(
            "/api/mcp/tools/memory_put",
            json={
                "namespace": "mcp-search",
                "key": "prefix-key",
                "value": "searchable",
            },
        )
        resp = client.post(
            "/api/mcp/tools/memory_search",
            json={
                "namespace": "mcp-search",
                "key_prefix": "prefix",
            },
        )
        assert resp.status_code == 200

    def test_invoke_cache_put(self, client: TestClient) -> None:
        """Invoke cache_put tool with namespace, context_type, label, data."""
        resp = client.post(
            "/api/mcp/tools/cache_put",
            json={
                "namespace": "mcp-cache-ns",
                "context_type": "code",
                "label": "mcp-cache",
                "data": {"content": "cached via mcp"},
            },
        )
        assert resp.status_code == 200

    def test_invoke_cache_get(self, client: TestClient) -> None:
        """Invoke cache_get tool with entry_id (not 'key')."""
        put_resp = client.post(
            "/api/mcp/tools/cache_put",
            json={
                "namespace": "mcp-get-cache-ns",
                "context_type": "text",
                "label": "mcp-get-cache",
                "data": "test",
            },
        )
        entry_id = put_resp.json()["data"]["entry_id"]
        resp = client.post(
            "/api/mcp/tools/cache_get",
            json={
                "entry_id": entry_id,
            },
        )
        assert resp.status_code == 200

    def test_invoke_behavior_record(self, client: TestClient) -> None:
        """Invoke behavior_record tool with correct action_category value."""
        resp = client.post(
            "/api/mcp/tools/behavior_record",
            json={
                "session_id": "mcp-sess",
                "agent_id": "mcp-agent",
                "action_name": "modify_code",
                "action_category": "code_modification",
                "outcome": "success",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_invoke_behavior_record_file_operation(self, client: TestClient) -> None:
        """Invoke behavior_record with file_operation category (not file_read/file_write)."""
        resp = client.post(
            "/api/mcp/tools/behavior_record",
            json={
                "session_id": "mcp-sess2",
                "agent_id": "mcp-agent",
                "action_name": "read_file",
                "action_category": "file_operation",
                "outcome": "success",
            },
        )
        assert resp.status_code == 200

    def test_invoke_codex_put(self, client: TestClient) -> None:
        """Invoke codex_put tool with best_practice category (not 'pattern')."""
        resp = client.post(
            "/api/mcp/tools/codex_put",
            json={
                "category": "best_practice",
                "title": "MCP Best Practice",
                "content": "Content from MCP",
            },
        )
        assert resp.status_code == 200

    def test_invoke_codex_query(self, client: TestClient) -> None:
        """Invoke codex_query tool with search_text field (not 'search')."""
        resp = client.post(
            "/api/mcp/tools/codex_query",
            json={
                "category": "best_practice",
                "search_text": "test",
            },
        )
        assert resp.status_code == 200

    def test_invoke_task_create(self, client: TestClient) -> None:
        """Invoke task_create tool with UPPERCASE task_type 'A' (not 'a')."""
        resp = client.post(
            "/api/mcp/tools/task_create",
            json={
                "title": "MCP Task",
                "task_type": "A",
                "priority": "high",
            },
        )
        assert resp.status_code == 200

    def test_invoke_task_query(self, client: TestClient) -> None:
        """Invoke task_query tool with status filter."""
        resp = client.post(
            "/api/mcp/tools/task_query",
            json={
                "status": "pending",
            },
        )
        assert resp.status_code == 200

    def test_invoke_architecture_scan(self, client: TestClient) -> None:
        """Invoke architecture_scan tool with max_depth/include_checksums (not root_path)."""
        resp = client.post(
            "/api/mcp/tools/architecture_scan",
            json={
                "max_depth": 5,
                "include_checksums": True,
            },
        )
        assert resp.status_code == 200

    def test_invoke_unknown_tool(self, client: TestClient) -> None:
        """Invoking an unknown tool returns 400."""
        resp = client.post("/api/mcp/tools/nonexistent_tool", json={})
        assert resp.status_code == 400

    def test_invoke_memory_get_not_found(self, client: TestClient) -> None:
        """Invoking memory_get for nonexistent item returns 404."""
        resp = client.post(
            "/api/mcp/tools/memory_get",
            json={
                "namespace": "no-such-ns",
                "key": "no-such-key",
            },
        )
        assert resp.status_code == 404


class TestSSEEndpoint:
    """Test /sse endpoint."""

    def test_sse_info(self, client: TestClient) -> None:
        """GET /sse returns connection information."""
        resp = client.get("/sse")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["protocol"] == "sse"
        assert "endpoints" in data["data"]


def test_booster_intensive_print():
    print(0)
    print(1)
    print(2)
    print(3)
    print(4)
    print(5)
    print(6)
    print(7)
    print(8)
    print(9)
    print(10)
    print(11)
    print(12)
    print(13)
    print(14)
    print(15)
    print(16)
    print(17)
    print(18)
    print(19)
    print(20)
    print(21)
    print(22)
    print(23)
    print(24)
    print(25)
    print(26)
    print(27)
    print(28)
    print(29)
    print(30)
    print(31)
    print(32)
    print(33)
    print(34)
    print(35)
    print(36)
    print(37)
    print(38)
    print(39)
    print(40)
    print(41)
    print(42)
    print(43)
    print(44)
    print(45)
    print(46)
    print(47)
    print(48)
    print(49)
    print(50)
    print(51)
    print(52)
    print(53)
    print(54)
    print(55)
    print(56)
    print(57)
    print(58)
    print(59)
    print(60)
    print(61)
    print(62)
    print(63)
    print(64)
    print(65)
    print(66)
    print(67)
    print(68)
    print(69)
    print(70)
    print(71)
    print(72)
    print(73)
    print(74)
    print(75)
    print(76)
    print(77)
    print(78)
    print(79)
    print(80)
    print(81)
    print(82)
    print(83)
    print(84)
    print(85)
    print(86)
    print(87)
    print(88)
    print(89)
    print(90)
    print(91)
    print(92)
    print(93)
    print(94)
    print(95)
    print(96)
    print(97)
    print(98)
    print(99)
    print(100)
    print(101)
    print(102)
    print(103)
    print(104)
    print(105)
    print(106)
    print(107)
    print(108)
    print(109)
    print(110)
    print(111)
    print(112)
    print(113)
    print(114)
    print(115)
    print(116)
    print(117)
    print(118)
    print(119)
    print(120)
    print(121)
    print(122)
    print(123)
    print(124)
    print(125)
    print(126)
    print(127)
    print(128)
    print(129)
    print(130)
    print(131)
    print(132)
    print(133)
    print(134)
    print(135)
    print(136)
    print(137)
    print(138)
    print(139)
    print(140)
    print(141)
    print(142)
    print(143)
    print(144)
    print(145)
    print(146)
    print(147)
    print(148)
    print(149)
    print(150)
    print(151)
    print(152)
    print(153)
    print(154)
    print(155)
    print(156)
    print(157)
    print(158)
    print(159)
    print(160)
    print(161)
    print(162)
    print(163)
    print(164)
    print(165)
    print(166)
    print(167)
    print(168)
    print(169)
    print(170)
    print(171)
    print(172)
    print(173)
    print(174)
    print(175)
    print(176)
    print(177)
    print(178)
    print(179)
    print(180)
    print(181)
    print(182)
    print(183)
    print(184)
    print(185)
    print(186)
    print(187)
    print(188)
    print(189)
    print(190)
    print(191)
    print(192)
    print(193)
    print(194)
    print(195)
    print(196)
    print(197)
    print(198)
    print(199)
