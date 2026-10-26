"""Message bus for inter-agent communication and live progress updates."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

class AgentBus:
    """File-backed message bus."""
    
    TOPICS = [
        "job.created",
        "stage.started",
        "stage.completed",
        "stage.failed",
        "concept.identified",
        "exercise.extracted",
        "interaction.assigned",
        "assessment.generated",
        "qa.result",
        "browser_test.result",
    ]

    def __init__(self, work_dir: Path):
        self.messages_file = work_dir / "messages.jsonl"
        
    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def publish(self, topic: str, payload: Dict[str, Any]) -> None:
        """Publish a message to the bus."""
        if topic not in self.TOPICS:
            raise ValueError(f"Unknown topic: {topic}")
            
        message = {
            "timestamp": self._now_iso(),
            "topic": topic,
            "payload": payload
        }
        
        with open(self.messages_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(message, ensure_ascii=False) + "\n")

    def read_all(self) -> List[Dict[str, Any]]:
        """Read all messages from the bus."""
        if not self.messages_file.exists():
            return []
            
        messages = []
        with open(self.messages_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    messages.append(json.loads(line))
        return messages
