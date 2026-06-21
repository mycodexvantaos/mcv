"""Kafka admin client for topic lifecycle management."""

from __future__ import annotations

import logging
from typing import Any

from aiokafka.admin import AIOKafkaAdminClient
from aiokafka.errors import KafkaError, UnknownTopicOrPartitionError
from mycodexvantaos_stream_pipeline.models import KafkaTopicConfig

logger = logging.getLogger(__name__)


class KafkaAdmin:
    """Async Kafka admin client for topic management operations."""

    def __init__(self, bootstrap_servers: str = "localhost:9092") -> None:
        self._bootstrap_servers = bootstrap_servers
        self._admin: AIOKafkaAdminClient | None = None

    async def connect(self) -> None:
        """Create and start the admin client connection."""
        self._admin = AIOKafkaAdminClient(
            bootstrap_servers=self._bootstrap_servers,
        )
        await self._admin.start()
        logger.info("Kafka admin client connected to %s", self._bootstrap_servers)

    async def close(self) -> None:
        """Close the admin client connection."""
        if self._admin:
            await self._admin.close()
            self._admin = None
            logger.info("Kafka admin client closed")

    @property
    def client(self) -> AIOKafkaAdminClient:
        """Get the admin client, raising if not connected."""
        if self._admin is None:
            raise RuntimeError("Admin client not connected — call connect() first")
        return self._admin

    async def create_topic(self, config: KafkaTopicConfig) -> bool:
        """Create a Kafka topic with the given configuration.

        Returns True if the topic was created or already exists.
        """
        try:
            existing = await self.list_topics()
            if config.name in existing:
                logger.info("Topic '%s' already exists", config.name)
                return True

            from aiokafka.admin import NewTopic

            new_topic = NewTopic(
                name=config.name,
                num_partitions=config.num_partitions,
                replication_factor=config.replication_factor,
                topic_configs={
                    "retention.ms": str(config.retention_ms),
                    "cleanup.policy": config.cleanup_policy,
                    "max.message.bytes": str(config.max_message_bytes),
                },
            )
            await self.client.create_topics([new_topic])
            logger.info("Created topic '%s' with %d partitions", config.name, config.num_partitions)
            return True
        except KafkaError:
            logger.exception("Failed to create topic '%s'", config.name)
            return False

    async def delete_topic(self, topic_name: str) -> bool:
        """Delete a Kafka topic.

        Returns True if the topic was deleted or did not exist.
        """
        try:
            await self.client.delete_topics([topic_name])
            logger.info("Deleted topic '%s'", topic_name)
            return True
        except UnknownTopicOrPartitionError:
            logger.info("Topic '%s' does not exist — nothing to delete", topic_name)
            return True
        except KafkaError:
            logger.exception("Failed to delete topic '%s'", topic_name)
            return False

    async def describe_topic(self, topic_name: str) -> dict[str, Any] | None:
        """Get detailed metadata for a topic."""
        try:
            metadata = await self.client.describe_topics([topic_name])
            if metadata:
                topic_meta = metadata[0]
                partitions = topic_meta.get("partitions", [])
                return {
                    "name": topic_name,
                    "partitions": len(partitions),
                    "partition_details": [
                        {
                            "partition": p.get("partition"),
                            "leader": p.get("leader"),
                            "replicas": p.get("replicas", []),
                            "isr": p.get("isr", []),
                        }
                        for p in partitions
                    ],
                }
            return None
        except UnknownTopicOrPartitionError:
            logger.warning("Topic '%s' not found", topic_name)
            return None
        except KafkaError:
            logger.exception("Failed to describe topic '%s'", topic_name)
            return None

    async def list_topics(self) -> list[str]:
        """List all topic names in the cluster."""
        try:
            metadata = await self.client.list_topics()
            if isinstance(metadata, dict):
                topics = list(metadata.keys())
            elif hasattr(metadata, "topics"):
                topics = list(metadata.topics.keys())
            else:
                topics = []
            return [t for t in topics if not t.startswith("__")]
        except KafkaError:
            logger.exception("Failed to list topics")
            return []

    async def ensure_topics(self, configs: list[KafkaTopicConfig]) -> dict[str, bool]:
        """Ensure multiple topics exist, creating them if necessary.

        Returns a dict mapping topic names to success status.
        """
        results: dict[str, bool] = {}
        for config in configs:
            results[config.name] = await self.create_topic(config)
        return results
