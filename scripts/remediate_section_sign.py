#!/usr/bin/env python3
"""
Sec. Symbol Remediation Script
===========================
Replaces all Sec. (U+00A7, SECTION SIGN) with ASCII-safe alternatives across the codebase.

Risk analysis shows Sec. is ONLY used in:
1. Comments (Dockerfile, .env.example, scripts, knowledge-graph)
2. Print/echo statements (scripts)
3. Documentation (markdown, todo.md)
4. NOT in any programmatically parsed files (JSON, YAML, SQL, TS)

Despite being "safe" today, Sec. poses latent risks:
- CP437 (DOS/Windows console) cannot encode Sec. at all
- Some terminals render Sec. as '?' or garbled text
- Windows PowerShell may mangle Sec. in git operations
- CI runners with wrong locale could break grep/sed on Sec.
- Docker build logs on Windows may show garbled comments
- Search/indexing tools may not handle Sec. correctly

Replacement strategy:
- Sec.5 → Sec.5 (section reference in comments/docs)
- Sec.7.2 → Sec.7.2 (subsection reference)
- Sec. alone → Sec. (standalone reference)
"""

import os
import re
import sys

BASE = "/workspace/mycodexvantaos"
DRY_RUN = "--dry-run" in sys.argv
replaced_total = 0
files_modified = 0

# Directories to skip
SKIP_DIRS = {".git", "node_modules", ".venv", "__pycache__", ".next", ".idx"}

# File extensions to process
PROCESS_EXTENSIONS = {
    ".md", ".py", ".sh", ".ttl", ".Dockerfile", ".example",
    ".txt", ".env", ".toml", ".cfg", ".ini", ".rst",
}

# Filenames without extensions to process
PROCESS_FILENAMES = {
    "Dockerfile", ".env.example",
}

def should_process(filepath):
    """Determine if a file should be processed."""
    parts = filepath.split(os.sep)
    for skip in SKIP_DIRS:
        if skip in parts:
            return False

    basename = os.path.basename(filepath)

    # Check by filename
    if basename in PROCESS_FILENAMES:
        return True
    if basename.startswith(".env"):
        return True

    # Check by extension
    _, ext = os.path.splitext(basename)
    if ext.lower() in PROCESS_EXTENSIONS:
        return True

    # Skip binary files
    return False

def replace_section_sign(content):
    """Replace Sec. with ASCII-safe alternatives."""
    global replaced_total

    if 'Sec.' not in content:
        return content, 0

    original = content

    # Replace Sec. followed by digits (like Sec.5, Sec.7, Sec.7.2, Sec.10-12)
    # Pattern: Sec.<digits> or Sec.<digits>.<digits> or Sec.<digits>-<digits>
    content = re.sub(r'Sec.(\d+(?:[.\-]\d+)*)', r'Sec.\1', content)

    # Replace standalone Sec. (not followed by digits)
    content = re.sub(r'Sec.', 'Sec.', content)

    actual_count = original.count('Sec.') - content.count('Sec.')
    replaced_total += actual_count

    return content, actual_count

def process_file(filepath):
    """Process a single file."""
    global files_modified

    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except (IOError, OSError) as e:
        print(f"  SKIP (read error): {filepath} - {e}")
        return

    if 'Sec.' not in content:
        return

    new_content, count = replace_section_sign(content)

    if count == 0:
        return

    rel_path = os.path.relpath(filepath, BASE)

    if DRY_RUN:
        print(f"  WOULD REPLACE: {rel_path} ({count} occurrences)")
    else:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  REPLACED: {rel_path} ({count} occurrences)")
            files_modified += 1
        except (IOError, OSError) as e:
            print(f"  FAIL (write error): {filepath} - {e}")

def main():
    print(f"{'DRY RUN - ' if DRY_RUN else ''}Sec. Symbol Remediation")
    print(f"Base: {BASE}")
    print(f"Strategy: Sec. → Sec. (e.g., Sec.5 → Sec.5, Sec.7.2 → Sec.7.2)")
    print()

    for root, dirs, files in os.walk(BASE):
        # Skip directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            filepath = os.path.join(root, filename)

            if not should_process(filepath):
                continue

            # Quick binary check
            try:
                with open(filepath, 'rb') as f:
                    chunk = f.read(1024)
                    if b'\x00' in chunk:
                        continue  # Skip binary files
            except (IOError, OSError):
                continue

            process_file(filepath)

    print()
    print(f"{'Would replace' if DRY_RUN else 'Replaced'}: {replaced_total} Sec. symbols in {files_modified} files")

    if DRY_RUN:
        print("\nRun without --dry-run to apply changes.")

if __name__ == "__main__":
    main()
