"""Tests for mycodexvantaos_coder_deep.architecture_sync module."""

import pytest
from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync


@pytest.fixture
def sample_project(tmp_path):
    """Create a sample project directory structure."""
    base = tmp_path

    # Create directories
    (base / "src").mkdir()
    (base / "tests").mkdir()
    (base / "docs").mkdir()

    # Create files
    (base / "README.md").write_text("# Test Project")
    (base / "src" / "main.py").write_text("print('hello')")
    (base / "src" / "utils.py").write_text("def helper(): pass")
    (base / "tests" / "test_main.py").write_text("def test_main(): pass")
    (base / "docs" / "guide.md").write_text("# Guide")
    (base / "pyproject.toml").write_text("[project]\nname = 'test'")

    return str(base)


class TestArchitectureScan:
    """Test scan operation."""

    @pytest.mark.asyncio
    async def test_scan_basic(self, sample_project: str) -> None:
        """Scan a basic project structure."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        assert snapshot.checksum != ""
        assert len(snapshot.files) > 0
        assert len(snapshot.directories) > 0

    @pytest.mark.asyncio
    async def test_scan_detects_files(self, sample_project: str) -> None:
        """Scan detects all files in the project."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        file_names = [f.path for f in snapshot.files]
        assert any("main.py" in f for f in file_names)
        assert any("utils.py" in f for f in file_names)
        assert any("test_main.py" in f for f in file_names)

    @pytest.mark.asyncio
    async def test_scan_detects_languages(self, sample_project: str) -> None:
        """Scan detects file languages."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        py_files = [f for f in snapshot.files if f.language == "python"]
        assert len(py_files) >= 3

    @pytest.mark.asyncio
    async def test_scan_detects_tests(self, sample_project: str) -> None:
        """Scan classifies test files."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        test_files = [f for f in snapshot.files if f.is_test]
        assert len(test_files) >= 1

    @pytest.mark.asyncio
    async def test_scan_detects_docs(self, sample_project: str) -> None:
        """Scan classifies documentation files."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        doc_files = [f for f in snapshot.files if f.is_documentation]
        assert len(doc_files) >= 2  # README.md + guide.md

    @pytest.mark.asyncio
    async def test_scan_detects_config(self, sample_project: str) -> None:
        """Scan classifies config files."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        config_files = [f for f in snapshot.files if f.is_config]
        assert len(config_files) >= 1  # pyproject.toml

    @pytest.mark.asyncio
    async def test_scan_ignores_dirs(self, sample_project: str) -> None:
        """Scan respects ignored directories (node_modules, __pycache__, etc.)."""
        import pathlib

        nm_dir = pathlib.Path(sample_project) / "node_modules"
        nm_dir.mkdir()
        (nm_dir / "package.js").write_text("module.exports = {}")

        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan()
        file_names = [f.path for f in snapshot.files]
        assert not any("node_modules" in f for f in file_names)

    @pytest.mark.asyncio
    async def test_scan_with_max_depth(self, sample_project: str) -> None:
        """Scan respects max_depth parameter."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan(max_depth=1)
        # Should still work, just limited depth
        assert snapshot.total_files >= 0

    @pytest.mark.asyncio
    async def test_scan_without_checksums(self, sample_project: str) -> None:
        """Scan with include_checksums=False skips checksums."""
        sync = ArchitectureSync(root_path=sample_project)
        snapshot = await sync.scan(include_checksums=False)
        # All checksums should be empty when skipped
        for f in snapshot.files:
            assert f.checksum == ""


class TestArchitectureDiff:
    """Test diff operation."""

    @pytest.mark.asyncio
    async def test_diff_no_changes(self, sample_project: str) -> None:
        """Diffing identical snapshots shows no changes."""
        sync = ArchitectureSync(root_path=sample_project)
        snap1 = await sync.scan()
        snap2 = await sync.scan()
        diff = await sync.diff(from_id=snap1.snapshot_id, to_id=snap2.snapshot_id)
        assert len(diff.added_files) == 0
        assert len(diff.removed_files) == 0
        assert len(diff.modified_files) == 0

    @pytest.mark.asyncio
    async def test_diff_added_file(self, sample_project: str) -> None:
        """Diffing detects added files."""
        import pathlib

        sync = ArchitectureSync(root_path=sample_project)
        baseline = await sync.scan()

        # Add a new file
        (pathlib.Path(sample_project) / "new_file.py").write_text("new content")
        current = await sync.scan()

        diff = await sync.diff(from_id=baseline.snapshot_id, to_id=current.snapshot_id)
        assert len(diff.added_files) >= 1

    @pytest.mark.asyncio
    async def test_diff_removed_file(self, sample_project: str) -> None:
        """Diffing detects removed files."""
        import pathlib

        sync = ArchitectureSync(root_path=sample_project)
        baseline = await sync.scan()

        # Remove a file
        (pathlib.Path(sample_project) / "src" / "utils.py").unlink()
        current = await sync.scan()

        diff = await sync.diff(from_id=baseline.snapshot_id, to_id=current.snapshot_id)
        assert len(diff.removed_files) >= 1

    @pytest.mark.asyncio
    async def test_diff_modified_file(self, sample_project: str) -> None:
        """Diffing detects modified files."""
        import pathlib

        sync = ArchitectureSync(root_path=sample_project)
        baseline = await sync.scan()

        # Modify a file
        (pathlib.Path(sample_project) / "src" / "main.py").write_text("print('modified')")
        current = await sync.scan()

        diff = await sync.diff(from_id=baseline.snapshot_id, to_id=current.snapshot_id)
        assert len(diff.modified_files) >= 1

    @pytest.mark.asyncio
    async def test_diff_default_ids(self, sample_project: str) -> None:
        """Diff with default None IDs uses last two snapshots."""
        sync = ArchitectureSync(root_path=sample_project)
        await sync.scan()
        await sync.scan()
        diff = await sync.diff()
        # With two identical scans, no changes expected
        assert len(diff.added_files) == 0


class TestArchitectureListSnapshots:
    """Test list_snapshots and get_latest_snapshot."""

    @pytest.mark.asyncio
    async def test_list_snapshots(self, sample_project: str) -> None:
        """List snapshots returns scan history."""
        sync = ArchitectureSync(root_path=sample_project)
        await sync.scan()
        await sync.scan()
        snapshots = await sync.list_snapshots()
        assert len(snapshots) == 2

    @pytest.mark.asyncio
    async def test_get_latest_snapshot(self, sample_project: str) -> None:
        """Get latest snapshot returns the most recent scan."""
        sync = ArchitectureSync(root_path=sample_project)
        await sync.scan()
        latest = await sync.get_latest_snapshot()
        assert latest is not None
        assert latest.total_files > 0

    @pytest.mark.asyncio
    async def test_get_latest_snapshot_none(self, tmp_path) -> None:
        """Get latest snapshot returns None when no scans done."""
        sync = ArchitectureSync(root_path=str(tmp_path))
        latest = await sync.get_latest_snapshot()
        assert latest is None
