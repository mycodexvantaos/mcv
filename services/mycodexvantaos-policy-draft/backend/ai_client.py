import asyncio
import json
import os
from typing import AsyncGenerator


def _get_claude_env() -> dict:
    """
    Build environment for the Claude CLI subprocess.
    Reads ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from
    /root/.claude/settings.json (fallback /dev/shm/claude_settings.json)
    and sets CLAUDE_CODE_SIMPLE=1 for fast startup.
    """
    env = os.environ.copy()
    env["CLAUDE_CODE_SIMPLE"] = "1"

    # Try to read credentials from settings files
    for path in ("/root/.claude/settings.json", "/dev/shm/claude_settings.json"):
        try:
            with open(path) as f:
                settings = json.load(f)
            settings_env = settings.get("env", {})
            for key in ("ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_MODEL"):
                if key in settings_env:
                    env[key] = settings_env[key]
            break  # found a valid settings file
        except (FileNotFoundError, json.JSONDecodeError):
            continue

    return env


async def stream_document_generation(
    system_prompt: str, user_prompt: str
) -> AsyncGenerator[str, None]:
    """
    Use Claude Code CLI as the AI brain.
    Runs `claude -p` with stream-json + --include-partial-messages for real-time streaming.
    Yields text chunks as they arrive.
    """
    full_prompt = system_prompt + "\n\n" + user_prompt

    env = _get_claude_env()                                                                                                                                                                           
    model = env.get("ANTHROPIC_MODEL", "sonnet")                                                                                                                                                                                                           
    proc = await asyncio.create_subprocess_exec(
        "claude",
        "-p", full_prompt,
        "--output-format", "stream-json",
        "--verbose",
        "--bare",
        "--include-partial-messages",
        "--model", model,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )

    result_text = ""
    streamed_any = False

    try:
        async for line in proc.stdout:
            line = line.decode("utf-8", errors="replace").strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type", "")

            # Real-time streaming: content_block_delta with text chunks
            if event_type == "stream_event":
                inner = event.get("event", {})
                inner_type = inner.get("type", "")

                if inner_type == "content_block_delta":
                    delta = inner.get("delta", {})
                    delta_type = delta.get("type", "")

                    # Only yield actual text, skip thinking deltas
                    if delta_type == "text_delta":
                        text = delta.get("text", "")
                        if text:
                            streamed_any = True
                            yield text

            # Final result fallback (if streaming didn't yield anything)
            elif event_type == "result":
                if event.get("is_error"):                                                                                                                                                             
                    raise RuntimeError(f"Claude CLI error: {event.get('result', 'unknown error')[:200]}")
                result_text = event.get("result", "")

        await proc.wait()

        # If we didn't get any streaming chunks, yield the final result
        if not streamed_any and result_text:
            yield result_text

        if proc.returncode != 0:
            stderr = await proc.stderr.read()
            err_msg = stderr.decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"Claude CLI exited with code {proc.returncode}: {err_msg}")

    except Exception:
        try:
            proc.kill()
            await proc.wait()
        except ProcessLookupError:
            pass
        raise
