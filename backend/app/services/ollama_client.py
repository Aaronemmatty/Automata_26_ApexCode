"""
Ollama client wrapper for local AI model inference.
Uses qwen2.5:7b by default for all AI tasks.
"""
import json
import logging
from typing import Dict, Any
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL
        
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using Ollama API."""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        **kwargs
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            return ""

    async def generate_json(self, prompt: str, **kwargs) -> Dict[str, Any] | None:
        """Generate JSON response using Ollama API."""
        json_prompt = f"{prompt}\n\nReturn ONLY valid JSON, no additional text."
        response = await self.generate(json_prompt, format="json", **kwargs)
        
        if not response:
            return None
            
        # Clean response
        cleaned = response.strip()
        if cleaned.startswith("```"):
            import re
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from Ollama: {e}\nResponse: {cleaned[:500]}")
            return None

    def generate_sync(self, prompt: str, **kwargs) -> str:
        """Synchronous version of generate."""
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        **kwargs
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            return ""

    def generate_json_sync(self, prompt: str, **kwargs) -> Dict[str, Any] | None:
        """Synchronous version of generate_json."""
        json_prompt = f"{prompt}\n\nReturn ONLY valid JSON, no additional text."
        response = self.generate_sync(json_prompt, format="json", **kwargs)
        
        if not response:
            return None
            
        # Clean response
        cleaned = response.strip()
        if cleaned.startswith("```"):
            import re
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from Ollama: {e}\nResponse: {cleaned[:500]}")
            return None


# Global instance
ollama_client = OllamaClient()
