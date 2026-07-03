import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer
from config import settings

class Embedder:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            # Lazy initialization of the local SentenceTransformer model
            cls._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return cls._model

    def embed_text(self, text: str) -> List[float]:
        """Generate a vector embedding for a given string."""
        if not text.strip():
            return [0.0] * 384  # Default MiniLM embedding dimension
        model = self.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Compute the cosine similarity between two vector embeddings."""
        a = np.array(v1)
        b = np.array(v2)
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))
