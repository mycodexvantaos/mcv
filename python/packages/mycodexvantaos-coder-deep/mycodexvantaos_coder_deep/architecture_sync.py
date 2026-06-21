"""Architecture sync — file mapping and change detection across the monorepo.

Detects changes in the project architecture by tracking file trees,
directory structures, dependency relationships, and module boundaries.
Provides diff capabilities for identifying architectural drift and
ensuring synchronization between old and new file layouts.
"""

import hashlib
import logging
import os
import time
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class FileEntry(BaseModel):
    """Represents a file in the architecture map."""

    path: str
    name: str
    extension: str
    size_bytes: int = 0
    checksum: str = ""
    last_modified: float = 0.0
    directory: str = ""
    depth: int = 0
    is_config: bool = False
    is_test: bool = False
    is_source: bool = False
    is_documentation: bool = False
    language: str = ""
    module: str = ""
    tags: list[str] = Field(default_factory=list)


class DirectoryEntry(BaseModel):
    """Represents a directory in the architecture map."""

    path: str
    name: str
    depth: int = 0
    file_count: int = 0
    subdirectory_count: int = 0
    total_size_bytes: int = 0
    languages: list[str] = Field(default_factory=list)
    module_type: str = ""


class ArchitectureSnapshot(BaseModel):
    """A snapshot of the project architecture at a point in time."""

    snapshot_id: str = ""
    root_path: str = ""
    timestamp: float = Field(default_factory=time.time)
    total_files: int = 0
    total_directories: int = 0
    total_size_bytes: int = 0
    files: list[FileEntry] = Field(default_factory=list)
    directories: list[DirectoryEntry] = Field(default_factory=list)
    language_distribution: dict[str, int] = Field(default_factory=dict)
    module_map: dict[str, list[str]] = Field(default_factory=dict)
    checksum: str = ""


class ArchitectureDiff(BaseModel):
    """Diff between two architecture snapshots."""

    from_snapshot_id: str = ""
    to_snapshot_id: str = ""
    added_files: list[str] = Field(default_factory=list)
    removed_files: list[str] = Field(default_factory=list)
    modified_files: list[str] = Field(default_factory=list)
    added_directories: list[str] = Field(default_factory=list)
    removed_directories: list[str] = Field(default_factory=list)
    language_changes: dict[str, int] = Field(default_factory=dict)
    module_changes: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_EXTENSION_LANGUAGE: dict[str, str] = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".toml": "toml",
    ".css": "css",
    ".html": "html",
    ".sql": "sql",
    ".sh": "shell",
    ".dockerfile": "dockerfile",
    ".txt": "text",
    ".cfg": "config",
    ".ini": "config",
    ".env": "config",
}

_CONFIG_EXTENSIONS = {".json", ".yaml", ".yml", ".toml", ".cfg", ".ini", ".env"}
_TEST_PATTERNS = {"test", "tests", "__tests__", "spec", ".test.", ".spec.", "test_"}
_DOC_EXTENSIONS = {".md", ".txt", ".rst"}
_SOURCE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".sh"}

_IGNORED_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    ".pytest_cache",
    ".ruff_cache",
    ".mypy_cache",
    ".next",
    "dist",
    "build",
    ".tox",
    ".eggs",
    "*.egg-info",
    ".hg",
    ".svn",
    "coverage",
    ".coverage",
    "htmlcov",
    ".parcel-cache",
    ".cache",
}


# ---------------------------------------------------------------------------
# ArchitectureSync
# ---------------------------------------------------------------------------


class ArchitectureSync:
    """Track and detect changes in project architecture.

    Scans the monorepo file tree, builds architecture snapshots, and
    detects changes between snapshots. Supports diffing for identifying
    architectural drift, file moves, and structural changes.
    """

    def __init__(self, root_path: str = ".") -> None:
        self._root_path = root_path
        self._snapshots: list[ArchitectureSnapshot] = []

    def _should_ignore(self, dir_name: str) -> bool:
        """Check if a directory should be ignored during scanning."""
        return dir_name in _IGNORED_DIRS or dir_name.startswith(".")

    def _classify_file(self, entry: FileEntry) -> FileEntry:
        """Classify a file entry by type and language."""
        ext = entry.extension.lower()
        entry.language = _EXTENSION_LANGUAGE.get(ext, "")
        entry.is_config = ext in _CONFIG_EXTENSIONS
        entry.is_test = any(p in entry.path.lower() for p in _TEST_PATTERNS)
        entry.is_source = ext in _SOURCE_EXTENSIONS and not entry.is_test
        entry.is_documentation = ext in _DOC_EXTENSIONS

        # Determine module from path
        parts = Path(entry.path).parts
        if len(parts) >= 2:
            entry.module = parts[0]
        if len(parts) >= 3 and parts[0] in ("python", "packages", "services", "apps"):
            entry.module = "/".join(parts[:3])

        return entry

    def _compute_file_checksum(self, file_path: str) -> str:
        """Compute MD5 checksum of a file."""
        try:
            full_path = os.path.join(self._root_path, file_path)
            with open(full_path, "rb") as f:
                return hashlib.md5(f.read()).hexdigest()[:16]
        except OSError:
            return ""

    async def scan(
        self, max_depth: int = 10, include_checksums: bool = True
    ) -> ArchitectureSnapshot:
        """Scan the project and create an architecture snapshot."""
        files: list[FileEntry] = []
        directories: list[DirectoryEntry] = []
        language_dist: dict[str, int] = {}
        module_map: dict[str, list[str]] = {}

        for root, dirs, filenames in os.walk(self._root_path):
            # Filter ignored directories
            dirs[:] = [d for d in dirs if not self._should_ignore(d)]

            rel_root = os.path.relpath(root, self._root_path)
            if rel_root == ".":
                rel_root = ""
            depth = rel_root.count(os.sep) + 1 if rel_root else 0

            if max_depth > 0 and depth > max_depth:
                dirs.clear()
                continue

            # Directory entry
            dir_entry = DirectoryEntry(
                path=rel_root,
                name=os.path.basename(root) if rel_root else self._root_path,
                depth=depth,
            )

            # Process files
            dir_languages: set[str] = set()
            for fname in filenames:
                file_path = os.path.join(rel_root, fname) if rel_root else fname
                ext = os.path.splitext(fname)[1].lower()

                full_path = os.path.join(self._root_path, file_path)
                try:
                    stat = os.stat(full_path)
                    size_bytes = stat.st_size
                    last_modified = stat.st_mtime
                except OSError:
                    size_bytes = 0
                    last_modified = 0.0

                checksum = ""
                if (
                    include_checksums
                    and size_bytes > 0
                    and size_bytes < 10 * 1024 * 1024
                ):
                    checksum = self._compute_file_checksum(file_path)

                file_entry = FileEntry(
                    path=file_path,
                    name=fname,
                    extension=ext,
                    size_bytes=size_bytes,
                    checksum=checksum,
                    last_modified=last_modified,
                    directory=rel_root,
                    depth=depth,
                )
                file_entry = self._classify_file(file_entry)
                files.append(file_entry)

                # Update statistics
                if file_entry.language:
                    language_dist[file_entry.language] = (
                        language_dist.get(file_entry.language, 0) + 1
                    )
                    dir_languages.add(file_entry.language)

                if file_entry.module:
                    if file_entry.module not in module_map:
                        module_map[file_entry.module] = []
                    module_map[file_entry.module].append(file_path)

            dir_entry.file_count = len(filenames)
            dir_entry.languages = sorted(dir_languages)
            directories.append(dir_entry)

        # Compute directory stats
        dir_index = {d.path: d for d in directories}
        for d in directories:
            parent = os.path.dirname(d.path)
            if parent in dir_index:
                dir_index[parent].subdirectory_count += 1
                dir_index[parent].total_size_bytes += d.total_size_bytes

        # Update directory file sizes
        for f in files:
            if f.directory in dir_index:
                dir_index[f.directory].total_size_bytes += f.size_bytes

        # Compute snapshot checksum
        all_paths = sorted(f.path for f in files)
        snapshot_checksum = hashlib.sha256("\n".join(all_paths).encode()).hexdigest()[
            :16
        ]

        snapshot = ArchitectureSnapshot(
            snapshot_id=hashlib.sha256(
                f"{time.time()}:{len(files)}".encode()
            ).hexdigest()[:16],
            root_path=self._root_path,
            total_files=len(files),
            total_directories=len(directories),
            total_size_bytes=sum(f.size_bytes for f in files),
            files=files,
            directories=directories,
            language_distribution=language_dist,
            module_map=module_map,
            checksum=snapshot_checksum,
        )

        self._snapshots.append(snapshot)
        logger.info(
            "Architecture scan: %d files, %d dirs, checksum=%s",
            len(files),
            len(directories),
            snapshot_checksum,
        )
        return snapshot

    async def diff(
        self, from_id: str | None = None, to_id: str | None = None
    ) -> ArchitectureDiff:
        """Compute the diff between two architecture snapshots.

        If from_id is None, uses the second-to-last snapshot.
        If to_id is None, uses the latest snapshot.
        """
        if len(self._snapshots) < 2:
            return ArchitectureDiff()

        from_snapshot = self._find_snapshot(from_id) if from_id else self._snapshots[-2]
        to_snapshot = self._find_snapshot(to_id) if to_id else self._snapshots[-1]

        if not from_snapshot or not to_snapshot:
            return ArchitectureDiff()

        from_files = {f.path: f for f in from_snapshot.files}
        to_files = {f.path: f for f in to_snapshot.files}

        from_dirs = {d.path for d in from_snapshot.directories}
        to_dirs = {d.path for d in to_snapshot.directories}

        added_files = [p for p in to_files if p not in from_files]
        removed_files = [p for p in from_files if p not in to_files]
        modified_files = [
            p
            for p in from_files
            if p in to_files
            and from_files[p].checksum != to_files[p].checksum
            and from_files[p].checksum
            and to_files[p].checksum
        ]

        added_dirs = sorted(to_dirs - from_dirs)
        removed_dirs = sorted(from_dirs - to_dirs)

        # Language changes
        from_langs = from_snapshot.language_distribution
        to_langs = to_snapshot.language_distribution
        all_langs = set(from_langs) | set(to_langs)
        language_changes = {
            lang: to_langs.get(lang, 0) - from_langs.get(lang, 0)
            for lang in all_langs
            if to_langs.get(lang, 0) != from_langs.get(lang, 0)
        }

        # Module changes
        from_modules = set(from_snapshot.module_map.keys())
        to_modules = set(to_snapshot.module_map.keys())
        module_changes = sorted(
            (from_modules | to_modules) - (from_modules & to_modules)
        )

        return ArchitectureDiff(
            from_snapshot_id=from_snapshot.snapshot_id,
            to_snapshot_id=to_snapshot.snapshot_id,
            added_files=sorted(added_files),
            removed_files=sorted(removed_files),
            modified_files=sorted(modified_files),
            added_directories=added_dirs,
            removed_directories=removed_dirs,
            language_changes=language_changes,
            module_changes=module_changes,
        )

    def _find_snapshot(self, snapshot_id: str) -> ArchitectureSnapshot | None:
        """Find a snapshot by ID."""
        for s in self._snapshots:
            if s.snapshot_id == snapshot_id:
                return s
        return None

    async def get_latest_snapshot(self) -> ArchitectureSnapshot | None:
        """Get the most recent architecture snapshot."""
        return self._snapshots[-1] if self._snapshots else None

    async def list_snapshots(self) -> list[dict[str, Any]]:
        """List all stored snapshots with summary info."""
        return [
            {
                "snapshot_id": s.snapshot_id,
                "timestamp": s.timestamp,
                "total_files": s.total_files,
                "total_directories": s.total_directories,
                "checksum": s.checksum,
            }
            for s in self._snapshots
        ]
