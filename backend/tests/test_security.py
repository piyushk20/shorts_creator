import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import (
    is_safe_url, sanitize_safe_id, escape_ffmpeg_path,
    escape_ffmpeg_concat_path, safe_subtitle_text
)
from backend.app.services.broll_engine import broll_engine
from backend.app.services.project_storage import project_storage

client = TestClient(app)

def test_ssrf_blocking_internal_ips():
    dangerous_urls = [
        "http://localhost:8000/secret",
        "http://127.0.0.1:8000/api",
        "http://0.0.0.0:8002",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1/admin",
        "http://192.168.1.1/router",
        "http://172.16.0.1/intranet",
        "http://metadata.google.internal/computeMetadata/v1/",
        "file:///etc/passwd",
        "gopher://127.0.0.1:6379",
        "ftp://127.0.0.1/test"
    ]
    for url in dangerous_urls:
        assert is_safe_url(url) is False, f"URL should be blocked: {url}"

def test_ssrf_allowing_legitimate_urls():
    safe_urls = [
        "https://assets.mixkit.co/videos/preview/mixkit-futuristic-ai-360-1.mp4",
        "https://cdn.coverr.co/videos/mp4/coverr-sample-1080.mp4",
        "https://images.pexels.com/videos/1234/pexels-video.mp4"
    ]
    for url in safe_urls:
        assert is_safe_url(url) is True, f"URL should be allowed: {url}"

def test_path_traversal_sanitization():
    assert sanitize_safe_id("../../../etc/passwd") == "etcpasswd"
    assert sanitize_safe_id("..\\..\\windows\\system32") == "windowssystem32"
    assert sanitize_safe_id("proj-123_abc-456") == "proj-123_abc-456"
    assert sanitize_safe_id("test/path/injection") == "testpathinjection"

def test_ffmpeg_filter_path_escaping():
    raw_path = "C:\\Projects\\video\\subtitle:1'2.ass"
    escaped = escape_ffmpeg_path(raw_path)
    assert "\\:" in escaped
    assert "\\'" in escaped
    assert "\\" not in escaped.replace("\\:", "").replace("\\'", "")

def test_ffmpeg_concat_path_escaping():
    # Paths with single quotes must escape single quotes as '\''' for concat demuxer
    path_with_apostrophe = "C:\\Videos\\Don't_Stop\\scene_1.mp4"
    escaped = escape_ffmpeg_concat_path(path_with_apostrophe)
    assert "\\'\\'" in escaped or "'\\''" in escaped
    assert "\\" not in escaped.replace("'\\''", "")

def test_safe_subtitle_text():
    # Injected ASS tags must have braces converted to parens
    malicious_text = r"Normal text {\c&H0000FF&} Red injection \N newline"
    clean = safe_subtitle_text(malicious_text)
    assert "{" not in clean
    assert "}" not in clean
    assert "(" in clean
    assert ")" in clean
    assert "\n" not in clean

def test_api_rejects_path_traversal_ids():
    response = client.get("/api/projects/../../etc/passwd")
    assert response.status_code in [400, 404]

    response_broll = client.get("/api/projects/proj-123/broll/..%2F..%2Fhack")
    assert response_broll.status_code in [400, 404]

def test_broll_engine_blocks_ssrf_download():
    # Attempting to download an internal URL must return empty string
    res = broll_engine.download_asset_on_demand("http://127.0.0.1:8000/internal-secrets")
    assert res == ""

def test_security_headers_present():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

def test_project_storage_blocks_traversal():
    import pytest
    with pytest.raises(ValueError):
        project_storage.get_project_dir("../../../escaped_dir")

