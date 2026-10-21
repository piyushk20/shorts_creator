import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.public_media_engine import public_media_engine

client = TestClient(app)

def test_public_media_sources():
    response = client.get("/api/media/sources")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    names = [p["name"] for p in data["providers"]]
    assert "Wikimedia Commons" in names
    assert "NASA Image & Video Library" in names
    assert "QuickChart Engine" in names
    assert "Iconify Vector Graphics" in names

def test_quickchart_generation():
    payload = {
        "chart_type": "bar",
        "title": "Index Fund Growth vs Active",
        "labels": ["Active", "S&P 500 Index"],
        "datasets": [{"label": "Return (%)", "data": [7.5, 13.2], "backgroundColor": ["#ef4444", "#10b981"]}],
        "width": 600,
        "height": 400
    }
    response = client.post("/api/media/chart-graphic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "quickchart"
    assert "quickchart.io/chart" in data["image_url"]

def test_iconify_svg_fetch():
    response = client.get("/api/media/icon?name=trending-up&collection=lucide")
    assert response.status_code == 200
    assert "image/svg+xml" in response.headers.get("content-type", "")
    assert "<svg" in response.text

def test_public_media_search():
    # Test Wikimedia search directly via endpoint
    response = client.get("/api/media/search-public?query=stock+exchange&provider=wikimedia&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "stock exchange"
    assert "candidates" in data
    assert isinstance(data["candidates"], list)
