"""
Decision Pipeline - Orchestrates the decision-making process
Integrates Semantic Core with Python analysis backend
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

@dataclass
class Evidence:
    """Evidence item for decision"""
    source: str
    content: str
    confidence: float
    timestamp: datetime
    tags: Optional[List[str]] = None

@dataclass
class DecisionParameters:
    """Parameters for decision making"""
    evidence_sufficiency_threshold: float = 0.7
    hypothesis_confidence_min: float = 0.6
    risk_tolerance: float = 0.5
    enable_feedback: bool = True

@dataclass
class DecisionResult:
    """Result of decision making"""
    verdict: str  # ALLOW, DENY, ABSTAIN
    confidence: float
    reasoning: str
    scores: Dict[str, float]
    vector_analysis: Dict[str, Any]
    audit: Dict[str, Any]

class EvidenceCollector:
    """Collects and aggregates evidence"""
    
    def __init__(self):
        self.evidence_store: List[Evidence] = []
    
    async def collect(self, evidence: Evidence) -> None:
        """Collect evidence item"""
        self.evidence_store.append(evidence)
        logger.info(f"Evidence collected: {evidence.source}")
    
    async def collect_batch(self, evidence_list: List[Evidence]) -> None:
        """Collect batch of evidence"""
        for evidence in evidence_list:
            await self.collect(evidence)
    
    def get_evidence(self) -> List[Evidence]:
        """Get all collected evidence"""
        return self.evidence_store
    
    def clear(self) -> None:
        """Clear evidence store"""
        self.evidence_store = []

class VectorizationBridge:
    """Bridges between text and vector representations"""
    
    def __init__(self):
        self.embedding_cache: Dict[str, List[float]] = {}
    
    async def vectorize(self, text: str) -> List[float]:
        """Convert text to vector"""
        if text in self.embedding_cache:
            return self.embedding_cache[text]
        
        # Placeholder: In production, use actual embedding model
        vector = self._generate_placeholder_vector(text)
        self.embedding_cache[text] = vector
        return vector
    
    async def compute_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between vectors"""
        if not v1 or not v2:
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm1 = sum(a ** 2 for a in v1) ** 0.5
        norm2 = sum(b ** 2 for b in v2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def _generate_placeholder_vector(self, text: str) -> List[float]:
        """Generate placeholder vector from text"""
        # In production, use actual embedding model
        import hashlib
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        return [(hash_val >> (i * 8)) % 256 / 256.0 for i in range(768)]

class ParameterOptimizer:
    """Optimizes decision parameters"""
    
    def __init__(self):
        self.parameter_history: List[Dict[str, Any]] = []
    
    async def optimize(self, params: DecisionParameters, feedback: Dict[str, Any]) -> DecisionParameters:
        """Optimize parameters based on feedback"""
        optimized = DecisionParameters(
            evidence_sufficiency_threshold=params.evidence_sufficiency_threshold,
            hypothesis_confidence_min=params.hypothesis_confidence_min,
            risk_tolerance=params.risk_tolerance,
            enable_feedback=params.enable_feedback,
        )
        
        # Adjust based on feedback
        if feedback.get('accuracy', 0) < 0.8:
            optimized.evidence_sufficiency_threshold *= 0.95
        
        self.parameter_history.append({
            'timestamp': datetime.now().isoformat(),
            'original': params.__dict__,
            'optimized': optimized.__dict__,
            'feedback': feedback,
        })
        
        logger.info(f"Parameters optimized: {optimized}")
        return optimized

class DecisionExecutor:
    """Executes decisions based on analysis"""
    
    def __init__(self, semantic_core_client=None):
        self.semantic_core_client = semantic_core_client
        self.decision_history: List[Dict[str, Any]] = []
    
    async def execute(
        self,
        hypothesis: str,
        evidence: List[Evidence],
        parameters: DecisionParameters,
    ) -> DecisionResult:
        """Execute decision making process"""
        
        # Prepare context for Semantic Core
        context = {
            'hypothesis': hypothesis,
            'evidence': [
                {
                    'source': e.source,
                    'content': e.content,
                    'confidence': e.confidence,
                    'timestamp': e.timestamp.isoformat(),
                    'tags': e.tags or [],
                }
                for e in evidence
            ],
            'parameters': {
                'evidence_sufficiency_threshold': parameters.evidence_sufficiency_threshold,
                'hypothesis_confidence_min': parameters.hypothesis_confidence_min,
                'risk_tolerance': parameters.risk_tolerance,
                'enable_feedback': parameters.enable_feedback,
            },
        }
        
        # Call Semantic Core
        if self.semantic_core_client:
            try:
                decision = await self.semantic_core_client.decide(context)
                result = DecisionResult(
                    verdict=decision['verdict'],
                    confidence=decision['confidence'],
                    reasoning=decision['reasoning'],
                    scores=decision['scores'],
                    vector_analysis=decision['vector_analysis'],
                    audit=decision['audit'],
                )
            except Exception as e:
                logger.error(f"Semantic Core error: {e}")
                result = self._fallback_decision(hypothesis, evidence, parameters)
        else:
            result = self._fallback_decision(hypothesis, evidence, parameters)
        
        # Record decision
        self.decision_history.append({
            'timestamp': datetime.now().isoformat(),
            'hypothesis': hypothesis,
            'result': result.__dict__,
        })
        
        return result
    
    def _fallback_decision(
        self,
        hypothesis: str,
        evidence: List[Evidence],
        parameters: DecisionParameters,
    ) -> DecisionResult:
        """Fallback decision when Semantic Core is unavailable"""
        avg_confidence = sum(e.confidence for e in evidence) / len(evidence) if evidence else 0
        
        return DecisionResult(
            verdict='ABSTAIN' if avg_confidence < 0.7 else 'ALLOW',
            confidence=avg_confidence,
            reasoning=f"Fallback decision based on {len(evidence)} evidence items",
            scores={
                'evidence_sufficiency': avg_confidence,
                'hypothesis_validation': 0.5,
                'action_priority': 0.5,
            },
            vector_analysis={
                'hypothesis_vector': [],
                'evidence_clusters': [],
                'semantic_distances': [],
            },
            audit={
                'request_id': f"fallback_{datetime.now().timestamp()}",
                'timestamp': datetime.now().isoformat(),
                'processing_time_ms': 0,
            },
        )

class DecisionPipeline:
    """Main decision pipeline orchestrator"""
    
    def __init__(self, semantic_core_client=None):
        self.evidence_collector = EvidenceCollector()
        self.vectorization_bridge = VectorizationBridge()
        self.parameter_optimizer = ParameterOptimizer()
        self.decision_executor = DecisionExecutor(semantic_core_client)
    
    async def process(
        self,
        hypothesis: str,
        evidence: List[Evidence],
        parameters: Optional[DecisionParameters] = None,
    ) -> DecisionResult:
        """Process decision through the pipeline"""
        
        if parameters is None:
            parameters = DecisionParameters()
        
        # Stage 1: Collect evidence
        await self.evidence_collector.collect_batch(evidence)
        logger.info(f"Collected {len(evidence)} evidence items")
        
        # Stage 2: Vectorize evidence
        vectors = []
        for e in evidence:
            vector = await self.vectorization_bridge.vectorize(e.content)
            vectors.append(vector)
        logger.info(f"Vectorized {len(vectors)} evidence items")
        
        # Stage 3: Execute decision
        result = await self.decision_executor.execute(hypothesis, evidence, parameters)
        logger.info(f"Decision: {result.verdict} (confidence: {result.confidence})")
        
        return result
    
    def get_history(self) -> Dict[str, Any]:
        """Get processing history"""
        return {
            'decisions': self.decision_executor.decision_history,
            'parameters': self.parameter_optimizer.parameter_history,
        }
