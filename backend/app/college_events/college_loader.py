import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CollegeConfig:
    name: str
    base_url: str
    sitemap_url: str | None
    keywords: list[str]
    seed_urls: list[str]


class CollegeLoader:
    def __init__(self, config_path: Path | None = None):
        default_path = Path(__file__).resolve().parent / "colleges.json"
        self.config_path = config_path or default_path

    def list_colleges(self) -> list[CollegeConfig]:
        raw = json.loads(self.config_path.read_text(encoding="utf-8"))
        colleges = []
        for item in raw:
            colleges.append(
                CollegeConfig(
                    name=item["name"],
                    base_url=item["base_url"].rstrip("/"),
                    sitemap_url=item.get("sitemap_url"),
                    keywords=[k.lower() for k in item.get("keywords", [])],
                    seed_urls=item.get("seed_urls", []),
                )
            )
        return colleges

    def get_by_name(self, college_name: str) -> CollegeConfig | None:
        target = college_name.strip().lower()
        for college in self.list_colleges():
            if college.name.lower() == target:
                return college
        return None
