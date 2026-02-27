def filter_urls(urls: list[str], keywords: list[str]) -> list[str]:
    out = []
    seen = set()
    for url in urls:
        lowered = url.lower()
        if any(k in lowered for k in keywords):
            if url not in seen:
                seen.add(url)
                out.append(url)
    return out
