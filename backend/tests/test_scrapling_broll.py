import os
import pytest
from backend.app.services.scrapling_crawler import scrapling_crawler
from backend.app.services.broll_engine import broll_engine
from backend.app.services.audio_engine import audio_engine

def test_scrapling_mixkit_and_coverr_search():
    # 1. Search for candidates across Mixkit & Coverr
    candidates = scrapling_crawler.search_best_candidates(["technology", "business"], limit=3)
    assert len(candidates) > 0

    candidate = candidates[0]
    # 2. Assert streamable thumbnail preview URL exists
    assert candidate.preview_url is not None
    assert candidate.preview_url.startswith("http")

    # 3. Assert direct stream download URL exists
    assert candidate.download_url is not None
    assert candidate.download_url.startswith("http")

    # 4. Assert rights provenance status
    assert candidate.rights_status == "VERIFIED_FOR_INTENDED_USE"
    assert "License" in candidate.license_type

def test_on_demand_download_and_caching():
    # Test downloading a verified Mixkit candidate when approved
    candidates = scrapling_crawler.search_best_candidates(["coding"], limit=1)
    assert len(candidates) > 0
    chosen = candidates[0]

    # Download when approved
    local_path = broll_engine.download_asset_on_demand(chosen.download_url)
    assert os.path.exists(local_path)
    assert os.path.getsize(local_path) > 10000

    # Test cache lookup: second call must be instantaneous from local cache
    cached_path = broll_engine.get_cached_asset_path(chosen.download_url)
    assert cached_path == local_path
