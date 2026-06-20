"""Tests for the Coder-Deep MCP FastAPI application endpoints."""

import os
import sys

import pytest
from fastapi.testclient import TestClient

# Add the apps directory to the path so we can import main.py
APP_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "coder-deep-mcp",
)
sys.path.insert(0, APP_DIR)

# Also add the package to the path
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


class TestHealthEndpoint:
    """Test /health endpoint."""

    def test_health_returns_ok(self, client: TestClient) -> None:
        """Health check returns 200 with success status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "ok"
        assert data["data"]["version"] == "0.1.0"

    def test_health_has_request_id(self, client: TestClient) -> None:
        """Health response includes request_id."""
        response = client.get("/health")
        data = response.json()
        assert "request_id" in data
        assert data["request_id"] != ""

    def test_health_has_services(self, client: TestClient) -> None:
        """Health response includes services status."""
        response = client.get("/health")
        data = response.json()
        assert "services" in data["data"]


class TestMemoryEndpoints:
    """Test memory store API endpoints."""

    def test_memory_put_and_get(self, client: TestClient) -> None:
        """PUT then GET a memory item."""
        put_resp = client.post(
            "/api/memory",
            json={
                "namespace": "test-ns",
                "key": "my-key",
                "value": {"hello": "world"},
                "tags": ["test"],
            },
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["success"] is True

        get_resp = client.get("/api/memory/test-ns/my-key")
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["success"] is True
        assert data["data"]["value"] == {"hello": "world"}

    def test_memory_get_not_found(self, client: TestClient) -> None:
        """GET a nonexistent memory item returns 404."""
        resp = client.get("/api/memory/missing/key")
        assert resp.status_code == 404
        assert resp.json()["success"] is False

    def test_memory_delete(self, client: TestClient) -> None:
        """DELETE a memory item."""
        client.post(
            "/api/memory",
            json={
                "namespace": "del-ns",
                "key": "del-key",
                "value": "to-delete",
            },
        )
        del_resp = client.delete("/api/memory/del-ns/del-key")
        assert del_resp.status_code == 200
        assert del_resp.json()["success"] is True
        get_resp = client.get("/api/memory/del-ns/del-key")
        assert get_resp.status_code == 404

    def test_memory_search(self, client: TestClient) -> None:
        """POST /api/memory/search searches by key_prefix and tags (not query)."""
        client.post(
            "/api/memory",
            json={
                "namespace": "search-ns",
                "key": "s1",
                "value": "hello world",
            },
        )
        resp = client.post(
            "/api/memory/search",
            json={
                "namespace": "search-ns",
                "key_prefix": "s",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_memory_list_namespaces(self, client: TestClient) -> None:
        """GET /api/memory/namespaces lists namespaces."""
        client.post(
            "/api/memory",
            json={
                "namespace": "list-ns",
                "key": "k1",
                "value": "v1",
            },
        )
        resp = client.get("/api/memory/namespaces")
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_memory_clear_namespace(self, client: TestClient) -> None:
        """DELETE /api/memory/{namespace} clears all items."""
        client.post(
            "/api/memory",
            json={
                "namespace": "clear-ns",
                "key": "k1",
                "value": "v1",
            },
        )
        resp = client.delete("/api/memory/clear-ns")
        assert resp.status_code == 200
        assert resp.json()["success"] is True


class TestCacheEndpoints:
    """Test context cache API endpoints — uses namespace/context_type/label/data."""

    def test_cache_put_and_get(self, client: TestClient) -> None:
        """PUT then GET a cache entry using namespace, context_type, label, data."""
        put_resp = client.post(
            "/api/cache",
            json={
                "namespace": "test-ns",
                "context_type": "code",
                "label": "cache-key",
                "data": {"content": "cached content"},
            },
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["success"] is True
        entry_id = put_resp.json()["data"]["entry_id"]

        get_resp = client.get(f"/api/cache/{entry_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["data"]["data"] == {"content": "cached content"}

    def test_cache_get_not_found(self, client: TestClient) -> None:
        """GET a nonexistent cache entry returns 404."""
        resp = client.get("/api/cache/nonexistent")
        assert resp.status_code == 404

    def test_cache_delete(self, client: TestClient) -> None:
        """DELETE a cache entry by entry_id."""
        put_resp = client.post(
            "/api/cache",
            json={
                "namespace": "del-ns",
                "context_type": "text",
                "label": "del-cache",
                "data": "x",
            },
        )
        entry_id = put_resp.json()["data"]["entry_id"]
        resp = client.delete(f"/api/cache/{entry_id}")
        assert resp.status_code == 200

    def test_cache_find(self, client: TestClient) -> None:
        """POST /api/cache/find finds entries by namespace/context_type/label/tags."""
        client.post(
            "/api/cache",
            json={
                "namespace": "find-ns",
                "context_type": "text",
                "label": "find-key",
                "data": "searchable content",
            },
        )
        resp = client.post(
            "/api/cache/find",
            json={
                "namespace": "find-ns",
                "context_type": "text",
            },
        )
        assert resp.status_code == 200

    def test_cache_stats(self, client: TestClient) -> None:
        """GET /api/cache/stats returns statistics."""
        resp = client.get("/api/cache/stats")
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_cache_invalidate(self, client: TestClient) -> None:
        """POST /api/cache/invalidate/{namespace} invalidates entries."""
        client.post(
            "/api/cache",
            json={
                "namespace": "inv-ns",
                "context_type": "text",
                "label": "inv-key",
                "data": "x",
            },
        )
        resp = client.post("/api/cache/invalidate/inv-ns")
        assert resp.status_code == 200


class TestBehaviorEndpoints:
    """Test behavior tracker API endpoints."""

    def test_behavior_record(self, client: TestClient) -> None:
        """POST /api/behavior/record records an action with correct category."""
        resp = client.post(
            "/api/behavior/record",
            json={
                "session_id": "sess-1",
                "agent_id": "agent-1",
                "action_name": "write_code",
                "action_category": "code_modification",
                "outcome": "success",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_behavior_record_invalid_category(self, client: TestClient) -> None:
        """POST with invalid category still records (library does not validate enums)."""
        # The behavior_tracker library does not enforce enum validation on
        # action_category — it stores whatever string is provided.
        # So this should return 200, not 400.
        resp = client.post(
            "/api/behavior/record",
            json={
                "session_id": "sess-1",
                "agent_id": "agent-1",
                "action_name": "test",
                "action_category": "invalid_category",
                "outcome": "success",
            },
        )
        # Library accepts any string; returns 200
        assert resp.status_code == 200

    def test_behavior_query(self, client: TestClient) -> None:
        """POST /api/behavior/query queries actions by session_id."""
        client.post(
            "/api/behavior/record",
            json={
                "session_id": "q-sess",
                "agent_id": "q-agent",
                "action_name": "test",
                "action_category": "testing",
            },
        )
        resp = client.post(
            "/api/behavior/query",
            json={
                "session_id": "q-sess",
            },
        )
        assert resp.status_code == 200

    def test_behavior_stats(self, client: TestClient) -> None:
        """GET /api/behavior/stats returns stats."""
        resp = client.get("/api/behavior/stats")
        assert resp.status_code == 200

    def test_behavior_sessions(self, client: TestClient) -> None:
        """GET /api/behavior/sessions lists sessions."""
        resp = client.get("/api/behavior/sessions")
        assert resp.status_code == 200


class TestArchitectureEndpoints:
    """Test architecture sync API endpoints — uses max_depth/include_checksums."""

    def test_architecture_scan(self, client: TestClient) -> None:
        """POST /api/architecture/scan scans the configured root path."""
        resp = client.post(
            "/api/architecture/scan",
            json={
                "max_depth": 5,
                "include_checksums": True,
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_architecture_scan_no_root_path(self, client: TestClient) -> None:
        """Architecture scan does NOT accept root_path — it uses the server config."""
        resp = client.post(
            "/api/architecture/scan",
            json={
                "max_depth": 5,
            },
        )
        assert resp.status_code == 200

    def test_architecture_diff(self, client: TestClient) -> None:
        """POST /api/architecture/diff uses from_id/to_id (not root_path/baseline_checksum)."""
        resp = client.post(
            "/api/architecture/diff",
            json={
                "from_id": None,
                "to_id": None,
            },
        )
        assert resp.status_code == 200


class TestCodexEndpoints:
    """Test pipeline codex API endpoints."""

    def test_codex_put_and_get(self, client: TestClient) -> None:
        """PUT then GET a codex entry with best_practice category."""
        put_resp = client.post(
            "/api/codex",
            json={
                "category": "best_practice",
                "title": "Test Pattern",
                "content": "Do X then Y",
                "tags": ["test"],
            },
        )
        assert put_resp.status_code == 200
        entry_id = put_resp.json()["data"]["entry_id"]

        get_resp = client.get(f"/api/codex/{entry_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["data"]["title"] == "Test Pattern"

    def test_codex_get_not_found(self, client: TestClient) -> None:
        """GET a nonexistent codex entry returns 404."""
        resp = client.get("/api/codex/nonexistent")
        assert resp.status_code == 404

    def test_codex_delete(self, client: TestClient) -> None:
        """DELETE a codex entry."""
        put_resp = client.post(
            "/api/codex",
            json={
                "category": "standard",
                "title": "To Delete",
                "content": "content",
            },
        )
        entry_id = put_resp.json()["data"]["entry_id"]
        del_resp = client.delete(f"/api/codex/{entry_id}")
        assert del_resp.status_code == 200

    def test_codex_query(self, client: TestClient) -> None:
        """POST /api/codex/query queries entries with search_text (not 'search')."""
        resp = client.post(
            "/api/codex/query",
            json={
                "category": "best_practice",
                "search_text": "test",
            },
        )
        assert resp.status_code == 200

    def test_codex_versions(self, client: TestClient) -> None:
        """GET /api/codex/{id}/versions returns versions."""
        put_resp = client.post(
            "/api/codex",
            json={
                "category": "workflow",
                "title": "Version Test",
                "content": "c1",
            },
        )
        entry_id = put_resp.json()["data"]["entry_id"]
        resp = client.get(f"/api/codex/{entry_id}/versions")
        assert resp.status_code == 200

    def test_codex_stats(self, client: TestClient) -> None:
        """GET /api/codex/stats returns stats."""
        resp = client.get("/api/codex/stats")
        assert resp.status_code == 200


class TestTaskEndpoints:
    """Test task tracker API endpoints."""

    def test_task_create_and_get(self, client: TestClient) -> None:
        """POST then GET a task with UPPERCASE task_type 'A'."""
        create_resp = client.post(
            "/api/tasks",
            json={
                "title": "My Task",
                "description": "A test task",
                "task_type": "A",
                "priority": "medium",
            },
        )
        assert create_resp.status_code == 200
        task_id = create_resp.json()["data"]["task_id"]

        get_resp = client.get(f"/api/tasks/{task_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["data"]["title"] == "My Task"

    def test_task_get_not_found(self, client: TestClient) -> None:
        """GET a nonexistent task returns 404."""
        resp = client.get("/api/tasks/nonexistent")
        assert resp.status_code == 404

    def test_task_update(self, client: TestClient) -> None:
        """PATCH a task with field updates."""
        create_resp = client.post(
            "/api/tasks",
            json={
                "title": "Old Title",
                "task_type": "A",
            },
        )
        task_id = create_resp.json()["data"]["task_id"]

        update_resp = client.patch(
            f"/api/tasks/{task_id}",
            json={
                "title": "New Title",
                "status": "in_progress",
            },
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["data"]["title"] == "New Title"

    def test_task_delete(self, client: TestClient) -> None:
        """DELETE a task."""
        create_resp = client.post(
            "/api/tasks",
            json={
                "title": "Delete Me",
                "task_type": "A",
            },
        )
        task_id = create_resp.json()["data"]["task_id"]

        del_resp = client.delete(f"/api/tasks/{task_id}")
        assert del_resp.status_code == 200

    def test_task_query(self, client: TestClient) -> None:
        """POST /api/tasks/query queries tasks with UPPERCASE task_type."""
        client.post("/api/tasks", json={"title": "Q Task", "task_type": "C"})
        resp = client.post(
            "/api/tasks/query",
            json={
                "task_type": "C",
            },
        )
        assert resp.status_code == 200

    def test_task_transitions(self, client: TestClient) -> None:
        """GET /api/tasks/{id}/transitions returns transitions."""
        create_resp = client.post(
            "/api/tasks",
            json={
                "title": "T Task",
                "task_type": "A",
            },
        )
        task_id = create_resp.json()["data"]["task_id"]
        client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})

        resp = client.get(f"/api/tasks/{task_id}/transitions")
        assert resp.status_code == 200

    def test_task_dependencies(self, client: TestClient) -> None:
        """GET /api/tasks/{id}/dependencies returns dependencies."""
        create_resp = client.post(
            "/api/tasks",
            json={
                "title": "D Task",
                "task_type": "A",
            },
        )
        task_id = create_resp.json()["data"]["task_id"]

        resp = client.get(f"/api/tasks/{task_id}/dependencies")
        assert resp.status_code == 200

    def test_task_stats(self, client: TestClient) -> None:
        """GET /api/tasks/stats returns stats."""
        resp = client.get("/api/tasks/stats")
        assert resp.status_code == 200


class TestRequestIdMiddleware:
    """Test request ID middleware."""

    def test_request_id_generated(self, client: TestClient) -> None:
        """A request_id is generated when not provided."""
        resp = client.get("/health")
        assert "X-Request-ID" in resp.headers

    def test_request_id_propagated(self, client: TestClient) -> None:
        """Provided X-Request-ID is propagated in response."""
        resp = client.get("/health", headers={"X-Request-ID": "test-123"})
        assert resp.headers["X-Request-ID"] == "test-123"

    def test_request_id_in_response_body(self, client: TestClient) -> None:
        """Request ID appears in response body."""
        resp = client.get("/health", headers={"X-Request-ID": "body-test"})
        data = resp.json()
        assert data["request_id"] == "body-test"


class TestStandardizedResponses:
    """Test standardized API response format."""

    def test_success_response_format(self, client: TestClient) -> None:
        """Success responses have success, data, request_id."""
        resp = client.get("/health")
        data = resp.json()
        assert "success" in data
        assert "data" in data
        assert "request_id" in data

    def test_error_response_format(self, client: TestClient) -> None:
        """Error responses have success=false and error details."""
        resp = client.get("/api/memory/missing/key")
        data = resp.json()
        assert data["success"] is False
        assert "error" in data
        assert data["error"]["code"] is not None
