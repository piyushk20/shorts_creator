"""YouTube Agent Skill Tools & Services Package.
Exposes zero-dependency engines:
- hook_scorer: 21 formulas and weakest-link hook evaluation
- package_linter: title and thumbnail co-design verification
- deadair_detector: silence, hesitation, and repeat take removal
- chapter_extractor: YouTube-compliant chapter generation
- outlier_analyzer: channel median multiple ranking
- retention_analyzer: hook leak, cliff sentence detection, and pacing diagnostics
"""
from backend.app.services.youtube_tools.hook_scorer import (
    score_hook, rank_hooks, classify_formula
)
from backend.app.services.youtube_tools.package_linter import (
    lint_package
)
from backend.app.services.youtube_tools.deadair_detector import (
    generate_edl, load_cues_from_string, load_cues_from_file
)
from backend.app.services.youtube_tools.chapter_extractor import (
    extract_chapters
)
from backend.app.services.youtube_tools.outlier_analyzer import (
    analyze_relative_outliers
)
from backend.app.services.youtube_tools.retention_analyzer import (
    analyze_retention
)

__all__ = [
    "score_hook",
    "rank_hooks",
    "classify_formula",
    "lint_package",
    "generate_edl",
    "load_cues_from_string",
    "load_cues_from_file",
    "extract_chapters",
    "analyze_relative_outliers",
    "analyze_retention"
]
