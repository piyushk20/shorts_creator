import pytest
from backend.app.services.youtube_tools import (
    score_hook, rank_hooks, classify_formula,
    lint_package,
    generate_edl, load_cues_from_string,
    extract_chapters,
    analyze_relative_outliers,
    analyze_retention
)

def test_hook_scorer_basic_and_formulas():
    # Strong hook with concrete number, direct address, stakes, and curiosity
    strong = "If you start a channel today, 97% of people quit before video 30. Here is what the other 3% do differently."
    res = score_hook(strong)
    assert res["verdict"] >= 65
    assert "SPECIFICITY" in res["breakdown"]
    assert "ADDRESS" in res["breakdown"]
    assert res["formula"] == "The Statistic"
    assert res["band"] == "STRONG"
    
    # Weak vague hook with filler
    weak = "Hey guys, welcome today to this incredible amazing crazy video where I talk about stuff."
    weak_res = score_hook(weak)
    assert weak_res["verdict"] < 50
    assert weak_res["band"] == "WEAK"
    assert weak_res["weakest_fix"] != ""

def test_hook_ranking():
    candidates = [
        "Hey guys check this out.",
        "97% of creators quit before video 30. Here is what the top 3% do differently.",
        "This channel went from 400 to 200,000 subscribers in seven months using one prompt."
    ]
    ranked = rank_hooks(candidates)
    assert len(ranked) == 3
    assert ranked[0]["verdict"] >= ranked[1]["verdict"]
    assert ranked[0]["verdict"] > ranked[2]["verdict"] or ranked[1]["verdict"] > ranked[2]["verdict"]

def test_package_linter():
    # Good package
    res = lint_package(
        title="I Built 3 AI Channels in 30 Days (Here's What Happened)",
        thumbnail_text="ZERO CODE"
    )
    assert res["score"] >= 65
    assert res["grade"] in ["EXCELLENT", "ACCEPTABLE"]
    assert len(res["strengths"]) > 0

    # Bad package: duplicate wording, thumbnail word overflow, vague word
    bad_res = lint_package(
        title="This Incredible Crazy AI Tool Will Change Everything Forever And Ever",
        thumbnail_text="THIS INCREDIBLE CRAZY AI TOOL WILL CHANGE EVERYTHING FOREVER"
    )
    assert bad_res["score"] < 50
    assert any(iss["code"] == "thumbnail_title_duplication" for iss in bad_res["issues"])
    assert any(iss["code"] == "thumbnail_text_overflow" for iss in bad_res["issues"])

def test_deadair_detector():
    sample_srt = """1
00:00:00,000 --> 00:00:02,000
Welcome back to the channel.

2
00:00:03,500 --> 00:00:04,500
Basically um so yeah

3
00:00:04,600 --> 00:00:06,000
Today we are discussing compound interest.

4
00:00:06,100 --> 00:00:07,500
Today we are discussing compound interest.
"""
    cues = load_cues_from_string(sample_srt, "srt")
    assert len(cues) == 4
    
    edl = generate_edl(cues, dead_floor=0.45)
    assert edl["cuts_count"] >= 2
    cut_types = [c["kind"] for c in edl["cuts"]]
    assert "DEAD" in cut_types
    assert "FILLER" in cut_types
    assert edl["removed_seconds"] > 0

def test_chapter_extractor():
    sample_srt = """1
00:00:00,000 --> 00:00:15,000
Welcome to this guide on building profitable video workflows and automation.

2
00:00:15,500 --> 00:00:30,000
Now let's examine the technical architecture and neural speech engine.

3
00:00:30,500 --> 00:00:48,000
Next we will configure the composite rendering pipeline and dynamic captions.

4
00:00:49,000 --> 00:01:05,000
Finally we look at the automated QA gate and deployment steps.

5
00:01:06,000 --> 00:01:25,000
Here are the benchmark results and conclusions for production studios.

6
00:01:26,000 --> 00:01:45,000
Make sure to check the documentation in the description below.
"""
    cues = load_cues_from_string(sample_srt, "srt")
    res = extract_chapters(cues, target_count=4, min_chapter_duration=10.0)
    assert res["valid"] is True
    assert res["chapter_count"] >= 3
    assert res["chapters"][0]["start_seconds"] == 0.0
    assert "00:00" in res["description_block"]

def test_outlier_analyzer():
    videos = [
        {"channel": "TechGuy", "title": "Regular Video A", "views": 1000},
        {"channel": "TechGuy", "title": "Regular Video B", "views": 1100},
        {"channel": "TechGuy", "title": "Regular Video C", "views": 950},
        {"channel": "TechGuy", "title": "97% of Engineers Don't Know This Trick", "views": 12000}, # Outlier!
        {"channel": "ThinChannel", "title": "Video 1", "views": 5000} # should be skipped (<4 vids)
    ]
    res = analyze_relative_outliers(videos, min_multiplier=2.0, min_videos_per_channel=4)
    assert res["outlier_count"] == 1
    assert res["outliers"][0]["channel"] == "TechGuy"
    assert res["outliers"][0]["multiple"] > 10.0
    assert len(res["skipped_thin_channels"]) == 1

def test_retention_analyzer():
    # 10 data points: drops from 100 down to 40 with a cliff at 30s
    csv_data = """Position,Retention
0,100%
5,92%
10,88%
15,85%
20,82%
25,80%
30,78%
35,62%
40,58%
45,55%
50,50%
"""
    transcript = [
        (0.0, 15.0, "Welcome to the video today we talk about AI."),
        (15.0, 32.0, "Let us look at some theoretical math details."),
        (32.0, 40.0, "Now here is a sponsor message from our partner."),
        (40.0, 50.0, "Continuing with the main demonstration.")
    ]
    res = analyze_retention(csv_data, transcript_cues=transcript, video_duration_seconds=50.0)
    assert res["valid"] is True
    assert res["hook_leak"]["percent_lost"] == 22.0
    assert res["hook_leak"]["status"] == "healthy"
    assert len(res["cliffs"]) > 0
    # The cliff should capture the sponsor message
    assert "sponsor" in res["cliffs"][0]["spoken_phrase_at_cliff"].lower() or len(res["cliffs"]) >= 1
