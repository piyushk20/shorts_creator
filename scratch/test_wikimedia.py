import urllib.request, json

url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=stock%20exchange&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0 (contact@creatorflow.ai)"})
try:
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        print(f"Pages found: {len(pages)}")
        for pid, p in pages.items():
            ii = p.get("imageinfo", [{}])[0]
            print(f"- {p.get('title')}: {ii.get('url')}")
except Exception as e:
    print("Error:", e)
