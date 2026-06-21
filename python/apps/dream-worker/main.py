"""
MyCodeXvantaOS Dream Worker

Consumes dream-run jobs from database/queue and executes memory dream processing.

CLI subcommands:
  dream run --mode dry-run   Run dream processing (dry-run mode)
  dream run --mode proposal  Run dream processing (proposal mode)
  dream run --mode execute   Run dream processing (execute mode)

Also supports direct JSON input via stdin for TS→Python integration.
"""

import argparse
import json
import sys
from pathlib import Path

from mycodexvantaos_memory_dream import DreamReport, DreamRun, MemoryItem


def load_memory_items_from_json(filepath: str) -> list[MemoryItem]:
    """
    Load memory items from JSON file

    Expected format matches TypeScript contracts:
    contracts/schemas/memory-item.schema.json
    """
    with open(filepath, "r") as f:
        data = json.load(f)

    return [MemoryItem.model_validate(item) for item in data]


def load_memory_items_from_stdin() -> list[MemoryItem]:
    """
    Load memory items from stdin (JSON array)

    Used by TS→Python integration via child_process.spawn
    """
    raw = sys.stdin.read()
    data = json.loads(raw)

    if isinstance(data, dict) and "memory_items" in data:
        # Handle wrapped format: { "memory_items": [...] }
        return [MemoryItem.model_validate(item) for item in data["memory_items"]]
    elif isinstance(data, list):
        return [MemoryItem.model_validate(item) for item in data]
    else:
        raise ValueError(
            "Expected JSON array of memory items or object with 'memory_items' key"
        )


def save_report_to_json(report: DreamReport, filepath: str) -> None:
    """
    Save dream report to JSON file

    Output format matches TypeScript contracts:
    contracts/schemas/dream-report.schema.json
    """
    with open(filepath, "w") as f:
        json.dump(report.model_dump(mode="json"), f, indent=2, default=str)


def execute_dream_run(
    memory_items: list[MemoryItem],
    dry_run: bool = True,
    proposal_mode: bool = True,
) -> DreamReport:
    """
    Execute a dream run

    Args:
        memory_items: Memory items to process
        dry_run: If True, only report actions without executing
        proposal_mode: If True, suggest actions but don't auto-apply

    Returns:
        Dream processing report
    """
    dream_run = DreamRun(
        dream_run_id=f"urn:mycodexvantaos:dream:cli:{Path.cwd()}",
        memory_items=memory_items,
        dry_run=dry_run,
        proposal_mode=proposal_mode,
    )

    return dream_run.run()


def print_report_summary(report: DreamReport) -> None:
    """Print a human-readable summary of the dream report"""
    print("\n" + "=" * 60)
    print(f"🧠 DREAM REPORT: {report.dream_run_id}")
    print("=" * 60)
    print(f"Processed: {report.total_memories} memories")
    print(f"Duplicates found: {report.duplicates_found}")
    print(f"Conflicts found: {report.conflicts_found}")
    print(f"Orphans found: {report.orphans_found}")
    print(f"Actions suggested: {len(report.actions)}")
    print("\n" + "-" * 60)

    # Print memory types
    memory_types = report.statistics.get("memory_types", {})
    if memory_types:
        print("\n📊 Memory Types:")
        for mem_type, count in sorted(
            memory_types.items(), key=lambda x: x[1], reverse=True
        ):
            print(f"  - {mem_type}: {count}")

    # Print actions
    if report.actions:
        print(f"\n⚡ Suggested Actions ({len(report.actions)}):")
        for i, action in enumerate(report.actions[:10], 1):  # Show first 10
            print(f"\n  [{i}] {action.action_type.value.upper()}")
            print(f"      Target: {action.target_memory_id}")
            if action.related_memory_id:
                print(f"      Related: {action.related_memory_id}")
            print(f"      Reason: {action.reason}")
            print(f"      Confidence: {action.confidence * 100:.0f}%")

        if len(report.actions) > 10:
            print(f"\n  ... and {len(report.actions) - 10} more actions")
    else:
        print("\n✅ No actions needed — memory is clean!")

    print("\n" + "=" * 60 + "\n")


def cmd_dream_run(args: argparse.Namespace) -> None:
    """Handle 'dream run' subcommand"""
    mode = args.mode

    # Determine dry_run and proposal_mode from mode
    dry_run = mode in ("dry-run", "proposal")
    proposal_mode = mode in ("dry-run", "proposal")

    # Load memory items
    try:
        if args.stdin:
            memory_items = load_memory_items_from_stdin()
            print(
                f"✅ Loaded {len(memory_items)} memory items from stdin",
                file=sys.stderr,
            )
        elif args.input:
            memory_items = load_memory_items_from_json(args.input)
            print(
                f"✅ Loaded {len(memory_items)} memory items from {args.input}",
                file=sys.stderr,
            )
        else:
            # No input specified — use sample data for demo
            memory_items = _create_sample_memory_items()
            print(
                f"✅ Using {len(memory_items)} sample memory items (no input specified)",
                file=sys.stderr,
            )
    except Exception as e:
        print(f"❌ Failed to load memory items: {e}", file=sys.stderr)
        sys.exit(1)

    # Execute dream run
    print(f"🧠 Running dream processing (mode: {mode})...", file=sys.stderr)
    report = execute_dream_run(
        memory_items=memory_items,
        dry_run=dry_run,
        proposal_mode=proposal_mode,
    )

    # Output as JSON to stdout (for TS integration)
    if args.json:
        report_json = report.model_dump(mode="json")
        print(json.dumps(report_json, indent=2, default=str))
    else:
        # Print human-readable summary
        print_report_summary(report)

    # Save report if output specified
    if args.output:
        save_report_to_json(report, args.output)
        print(f"💾 Dream report saved to: {args.output}", file=sys.stderr)


def _create_sample_memory_items() -> list[MemoryItem]:
    """Create sample memory items for demo/testing"""
    from mycodexvantaos_memory_dream.models import MemoryItemType

    return [
        MemoryItem(
            memory_id="mem_sample_001",
            content="System deployed version 2.1.0 at 2024-01-15",
            tags=["system", "deployment"],
            memory_type=MemoryItemType.OBSERVATION,
        ),
        MemoryItem(
            memory_id="mem_sample_002",
            content="System deployed version 2.1.0 at 2024-01-15",
            tags=["system", "deployment"],
            memory_type=MemoryItemType.OBSERVATION,
        ),
        MemoryItem(
            memory_id="mem_sample_003",
            content="Agent chat service is operational",
            tags=["agent", "status"],
            related_entities=["urn:mycodexvantaos:entity:agent-chat-001"],
            memory_type=MemoryItemType.FACT,
        ),
        MemoryItem(
            memory_id="mem_sample_004",
            content="Decision to use TypeScript for control plane",
            tags=["architecture", "decision"],
            memory_type=MemoryItemType.DECISION,
        ),
    ]


def cli() -> None:
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="MyCodeXvantaOS Dream Worker — Memory Dream Processing"
    )
    subparsers = parser.add_subparsers(
        dest="command", help="Available commands")

    # ─── dream run ────────────────────────────────────────────
    run_parser = subparsers.add_parser("run", help="Execute a dream run")
    run_parser.add_argument(
        "input",
        nargs="?",
        help="Input JSON file containing memory items",
    )
    run_parser.add_argument(
        "--mode",
        choices=["dry-run", "proposal", "execute"],
        default="dry-run",
        help="Execution mode (default: dry-run)",
    )
    run_parser.add_argument(
        "-o",
        "--output",
        help="Output JSON file for dream report",
    )
    run_parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read memory items from stdin (JSON format)",
    )
    run_parser.add_argument(
        "--json",
        action="store_true",
        help="Output report as JSON to stdout (for TS integration)",
    )

    args = parser.parse_args()

    if args.command == "run":
        cmd_dream_run(args)
    else:
        parser.print_help()


def main() -> None:
    """Backward-compatible main() for direct script execution"""
    # If no subcommand, fall back to legacy behavior
    if len(sys.argv) > 1 and sys.argv[1] in ("run",):
        cli()
        return

    # Legacy: positional input file
    parser = argparse.ArgumentParser(
        description="MyCodeXvantaOS Dream Worker — Memory Dream Processing"
    )
    parser.add_argument(
        "input",
        help="Input JSON file containing memory items",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Output JSON file for dream report (default: stdout)",
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Disable dry-run mode (actually process actions)",
    )
    parser.add_argument(
        "--no-proposal-mode",
        action="store_true",
        help="Disable proposal mode (auto-apply actions)",
    )

    args = parser.parse_args()

    # Load memory items
    try:
        memory_items = load_memory_items_from_json(args.input)
        print(f"✅ Loaded {len(memory_items)} memory items from {args.input}")
    except Exception as e:
        print(f"❌ Failed to load memory items: {e}", file=sys.stderr)
        sys.exit(1)

    # Execute dream run
    print("\n🧠 Running dream processing...")
    report = execute_dream_run(
        memory_items=memory_items,
        dry_run=not args.no_dry_run,
        proposal_mode=not args.no_proposal_mode,
    )

    # Print summary
    print_report_summary(report)

    # Save report if output specified
    if args.output:
        save_report_to_json(report, args.output)
        print(f"💾 Dream report saved to: {args.output}")


if __name__ == "__main__":
    cli()
