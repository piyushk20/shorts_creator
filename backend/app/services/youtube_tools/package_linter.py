"""Package Linter Engine - Ported & enhanced from youtube-agent-skill.
Co-lints YouTube Title and Thumbnail text as an interdependent single package.
Enforces:
- Hard limit: 100 chars
- Desktop cutoff: 60 chars
- Mobile feed cutoff: 40 chars (verifies subject survival)
- Thumbnail word ceiling: max 3-4 words at feed size
- Cross-surface deduplication: thumbnail must not mirror title words
- Style checks: all-caps shouting, vague clickbait words, front-loaded subject
"""
import re
from typing import Dict, List, Optional, Any

DESKTOP_CUTOFF = 60
MOBILE_CUTOFF = 40
HARD_LIMIT = 100

VAGUE_WORDS = {
    "amazing", "incredible", "insane", "crazy", "huge", "massive", "ultimate",
    "best", "powerful", "secret", "revolutionary", "mindblowing", "epic", "perfect",
    "complete", "everything"
}

STOP_WORDS = {
    "the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are",
    "with", "your", "you", "my", "i", "this", "that", "it", "how", "what", "why"
}

def extract_clean_words(text: str) -> List[str]:
    return re.findall(r"[a-z0-9']+", text.lower())

def lint_package(title: str, thumbnail_text: Optional[str] = None) -> Dict[str, Any]:
    t = title.strip()
    char_len = len(t)
    issues: List[Dict[str, str]] = []
    good: List[str] = []
    
    # 1. Title Length Bounds
    if char_len > HARD_LIMIT:
        issues.append({
            "code": "hard_length_exceeded",
            "message": f"{char_len} characters exceeds YouTube's 100-character ceiling."
        })
    elif char_len > DESKTOP_CUTOFF:
        issues.append({
            "code": "desktop_truncation",
            "message": f"{char_len} characters - desktop search cuts near {DESKTOP_CUTOFF} chars."
        })
    else:
        good.append(f"{char_len} characters - safely inside the {DESKTOP_CUTOFF}-character desktop cutoff.")
        
    # 2. Mobile Home Truncation Check
    if char_len > MOBILE_CUTOFF:
        snippet = t[:MOBILE_CUTOFF].rsplit(" ", 1)[0]
        issues.append({
            "code": "mobile_truncation",
            "message": f'Mobile home feed cuts around "{snippet}..." - ensure the subject survives.'
        })
    else:
        good.append("Full title survives mobile home feed truncation (<40 chars).")
        
    # 3. Capitalization & Shouting
    caps = [w for w in t.split() if len(w) > 2 and w.isupper()]
    if len(caps) > 2:
        issues.append({
            "code": "excessive_caps",
            "message": f"{len(caps)} all-caps words - two is the maximum before triggering spam/clickbait fatigue."
        })
    elif len(caps) > 0:
        good.append(f"{len(caps)} emphasis word capitalized effectively.")
        
    # 4. Vague Words vs Concrete Signal
    words = extract_clean_words(t)
    vague_found = [w for w in words if w in VAGUE_WORDS]
    if vague_found:
        issues.append({
            "code": "vague_adjectives",
            "message": f"Contains vague filler words: {', '.join(sorted(set(vague_found)))}. Swap for a number, date, or specific entity."
        })
        
    nums = re.findall(r"\d[\d,.]*%?", t)
    if nums:
        good.append(f"Carries concrete figure: {', '.join(nums[:3])}")
    else:
        issues.append({
            "code": "no_concrete_figure",
            "message": "Missing concrete numbers, dates, or named outcomes - one of the most reliable click catalysts."
        })
        
    if t.endswith("?"):
        good.append("Opens an intrigue question in the title.")
        
    # 5. Front-loading
    first_three_content = [w for w in words[:3] if w not in STOP_WORDS]
    if not first_three_content and len(words) >= 3:
        issues.append({
            "code": "delayed_subject",
            "message": "The first three words are all filler/stopwords. Move the subject or curiosity trigger forward."
        })
        
    # 6. Thumbnail Co-Linting (Cross-Surface Check)
    thumb_words_list: List[str] = []
    if thumbnail_text and thumbnail_text.strip():
        thumb_clean = thumbnail_text.strip()
        thumb_words_list = extract_clean_words(thumb_clean)
        
        tw_set = set(words) - STOP_WORDS
        hw_set = set(thumb_words_list) - STOP_WORDS
        shared = tw_set & hw_set
        
        if shared:
            issues.append({
                "code": "thumbnail_title_duplication",
                "message": f"Thumbnail mirrors title words: {', '.join(sorted(shared))}. The thumbnail should say what the title cannot."
            })
        else:
            good.append("Thumbnail and title carry completely complementary phrasing.")
            
        if len(thumb_words_list) > 4:
            issues.append({
                "code": "thumbnail_text_overflow",
                "message": f"{len(thumb_words_list)} words on thumbnail. 3-4 words is the legibility ceiling on mobile feeds."
            })
        else:
            good.append(f"Thumbnail text ({len(thumb_words_list)} words) is snappy and legible on small screens.")

    score = max(0, min(100, 100 - (14 * len(issues)) + (4 * len(good))))
    grade = "EXCELLENT" if score >= 80 else "ACCEPTABLE" if score >= 60 else "NEEDS_REVISION"
    
    return {
        "title": t,
        "thumbnail_text": thumbnail_text,
        "char_count": char_len,
        "title_word_count": len(words),
        "thumbnail_word_count": len(thumb_words_list),
        "score": score,
        "grade": grade,
        "issues": issues,
        "recommendations": [iss["message"] for iss in issues],
        "strengths": good
    }
