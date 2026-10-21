import urllib.request
import urllib.parse
import json

print("=== Testing Public Media & Motion Graphics APIs (Zero Auth) ===")

# 1. NASA Media Library (Images & Videos)
try:
    url = "https://images-api.nasa.gov/search?q=mars&media_type=image"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        items = data.get("collection", {}).get("items", [])
        print(f"[NASA Library] SUCCESS! Found {len(items)} items")
        if items:
            print("   Title:", items[0]["data"][0]["title"])
            print("   Preview:", items[0]["links"][0]["href"])
except Exception as e:
    print("[NASA Library] FAILED:", e)

# 2. Art Institute of Chicago (Archival artworks & historical photography)
try:
    url = "https://api.artic.edu/api/v1/artworks/search?q=money&fields=id,title,image_id&limit=3"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        items = data.get("data", [])
        print(f"[Art Institute Chicago] SUCCESS! Found {len(items)} items")
        if items and items[0].get("image_id"):
            img_id = items[0]["image_id"]
            img_url = f"https://www.artic.edu/iiif/2/{img_id}/full/843,/0/default.jpg"
            print("   Title:", items[0].get("title"))
            print("   Image URL:", img_url)
except Exception as e:
    print("[Art Institute Chicago] FAILED:", e)

# 3. Wikimedia Commons (Public domain photos, graphics, historical archives)
try:
    url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=stock%20market&gsrlimit=3&prop=imageinfo&iiprop=url|mime&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        print(f"[Wikimedia Commons] SUCCESS! Found {len(pages)} media files")
        for pid, p in list(pages.items())[:1]:
            ii = p.get("imageinfo", [{}])[0]
            print("   Title:", p.get("title"))
            print("   Media URL:", ii.get("url"))
except Exception as e:
    print("[Wikimedia Commons] FAILED:", e)

# 4. Iconify API (Over 200,000 vector icons & motion graphic symbols)
try:
    url = "https://api.iconify.design/lucide/trending-up.svg"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        content = resp.read().decode("utf-8")
        print(f"[Iconify Vector Graphics] SUCCESS! Retrieved SVG ({len(content)} bytes)")
except Exception as e:
    print("[Iconify Vector Graphics] FAILED:", e)

# 5. QuickChart API (Instant vector/PNG chart motion graphics & data callouts)
try:
    chart_cfg = json.dumps({
        "type": "bar",
        "data": {
            "labels": ["Active Funds", "S&P 500 Index"],
            "datasets": [{"label": "10-Year Return", "data": [7.2, 12.8], "backgroundColor": ["#ef4444", "#10b981"]}]
        },
        "options": {
            "title": {"display": True, "text": "Underperformance vs Index"}
        }
    })
    encoded = urllib.parse.quote(chart_cfg)
    url = f"https://quickchart.io/chart?c={encoded}&width=600&height=400&devicePixelRatio=2"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = resp.read()
        print(f"[QuickChart Motion Visuals] SUCCESS! Rendered chart graphic ({len(data)} bytes PNG)")
except Exception as e:
    print("[QuickChart Motion Visuals] FAILED:", e)

# 6. Internet Archive API (Archival video footage & news clips)
try:
    url = "https://archive.org/advancedsearch.php?q=mediatype:movies+AND+subject:finance&fl[]=identifier,title,description&rows=3&output=json"
    req = urllib.request.Request(url, headers={"User-Agent": "CreatorFlow/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        docs = data.get("response", {}).get("docs", [])
        print(f"[Internet Archive Footage] SUCCESS! Found {len(docs)} archival movie files")
        if docs:
            print("   Title:", docs[0].get("title"))
            print("   Archive ID:", docs[0].get("identifier"))
except Exception as e:
    print("[Internet Archive Footage] FAILED:", e)
