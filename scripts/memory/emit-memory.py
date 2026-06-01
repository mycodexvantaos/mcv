import json
import sys
import datetime
from typing import List, Optional
from pydantic import BaseModel

class MemoryItem(BaseModel):
    memory_id: str
    content: str
    tags: List[str]
    related_entities: List[str]
    temporal_expressions: List[str]
    memory_type: str = "observation"

def emit_memory(content: str, tags: List[str], entities: List[str], mem_type: str = "observation"):
    mem_id = f"urn:mycodexvantaos:memory:{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    item = MemoryItem(
        memory_id=mem_id,
        content=content,
        tags=tags,
        related_entities=entities,
        temporal_expressions=[datetime.datetime.now().isoformat()],
        memory_type=mem_type
    )
    # In a real system, this would push to a database or event bus.
    # For now, we append to a local audit file.
    with open("governance/registry/memory-audit.jsonl", "a") as f:
        f.write(item.json() + "\n")
    print(f"Memory emitted: {mem_id}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 emit-memory.py <content> <tags_comma_separated> <entities_comma_separated>")
        sys.exit(1)
    
    content = sys.argv[1]
    tags = sys.argv[2].split(",") if len(sys.argv) > 2 else []
    entities = sys.argv[3].split(",") if len(sys.argv) > 3 else []
    emit_memory(content, tags, entities)
