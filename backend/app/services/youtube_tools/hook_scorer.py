"""Hook Scorer Engine - Ported & enhanced from youtube-agent-skill.
Evaluates YouTube hooks across 5 core dimensions:
- Specificity (concrete numbers, dates, named entities vs vague fluff)
- Direct Address ("you" within the first 6 words)
- Stakes (cost of failure, consequence, what is lost)
- Curiosity Gap (unresolved tension, open questions)
- Brevity (optimal 9-24 spoken words band)

Verdict formula: 60% mean + 40% weakest link (weakest property heavily penalizes).
"""
import json
import os
import re
from typing import Dict, List, Optional, Tuple, Any

HERE = os.path.dirname(os.path.abspath(__file__))
HOOKS_FILE = os.path.join(HERE, "hooks.json")

if os.path.exists(HOOKS_FILE):
    with open(HOOKS_FILE, "r", encoding="utf-8") as f:
        FORMULAS = json.load(f).get("hooks", [])
else:
    FORMULAS = []

FILLER = {
    "basically", "actually", "literally", "just", "really", "very", "so", "kind", "sort", "like",
    "guys", "hey", "welcome", "today", "video", "subscribe", "channel"
}
VAGUE = {
    "amazing", "incredible", "insane", "crazy", "huge", "massive", "game", "changer", "secret",
    "powerful", "ultimate", "best", "revolutionary", "mind", "blowing", "unbelievable"
}
CONCRETE = re.compile(
    r"\b(\d[\d,.]*\s?(%|k|m|x|s|m|h)?|\$\d|\d+\s?(second|minute|hour|day|week|month|year)s?)\b",
    re.I
)
YOU = re.compile(r"\b(you|your|you're|youre|yourself)\b", re.I)
STAKE = re.compile(
    r"\b(lose|lost|wasting|waste|quit|fail|broke|cost|risk|before|stop|never|die|dying|dead)\b",
    re.I
)
CURIOSITY = re.compile(
    r"\b(why|how|what|which|until|before|but|nobody|almost|except|reason|actually)\b",
    re.I
)

FIX = {
    "SPECIFICITY": "Swap one adjective for a concrete number, named person, tool, or timeframe.",
    "ADDRESS": "Use 'you' or 'your' within the first six words to speak directly to the viewer.",
    "STAKES": "Name the specific cost or risk of continuing without this insight.",
    "CURIOSITY": "Open an unresolved gap; avoid answering the premise in the opening sentence.",
    "BREVITY": "Aim for 9 to 24 words (~4 to 8 spoken seconds) so the hook doesn't drag."
}

def extract_words(text: str) -> List[str]:
    return re.findall(r"[a-z0-9'%$.]+", text.lower())

def calc_specificity(text: str) -> int:
    w = extract_words(text)
    if not w:
        return 0
    nums = len(CONCRETE.findall(text))
    vague_count = sum(1 for x in w if x in VAGUE)
    filler_count = sum(1 for x in w if x in FILLER)
    score = 34 + (nums * 22) - (vague_count * 16) - (filler_count * 5)
    # Proper nouns that are not sentence-initial
    score += min(18, 6 * sum(1 for x in text.split()[1:] if x[:1].isupper()))
    return max(0, min(100, score))

def calc_address(text: str) -> int:
    n = len(YOU.findall(text))
    first_words = " ".join(text.split()[:6])
    first_bonus = 30 if YOU.search(first_words) else 0
    return max(0, min(100, 26 + (n * 20) + first_bonus))

def calc_stakes(text: str) -> int:
    n = len(STAKE.findall(text))
    concrete_bonus = 14 if CONCRETE.search(text) else 0
    return max(0, min(100, 22 + (n * 26) + concrete_bonus))

def calc_curiosity(text: str) -> int:
    n = len(CURIOSITY.findall(text))
    question_bonus = 18 if text.strip().endswith("?") else 0
    closed_penalty = -18 if re.search(r"\b(because|so that|which means)\b", text, re.I) else 0
    return max(0, min(100, 24 + (n * 17) + question_bonus + closed_penalty))

def calc_brevity(text: str) -> int:
    w = extract_words(text)
    n = len(w)
    if n == 0:
        return 0
    # 9-24 words is the target spoken band inside 10 seconds
    if 9 <= n <= 24:
        return 100
    if n < 9:
        return max(30, 100 - (9 - n) * 11)
    return max(10, 100 - (n - 24) * 7)

PROPERTIES = [
    ("SPECIFICITY", calc_specificity),
    ("ADDRESS", calc_address),
    ("STAKES", calc_stakes),
    ("CURIOSITY", calc_curiosity),
    ("BREVITY", calc_brevity),
]

def classify_formula(text: str) -> Tuple[str, int]:
    best, hits = None, 0
    for f in FORMULAS:
        matches = sum(1 for p in f.get("match", []) if re.search(p, text, re.I))
        if matches > hits:
            best, hits = f, matches
    formula_name = best["name"] if best else "Unclassified"
    return formula_name, hits

def score_hook(text: str) -> Dict[str, Any]:
    text_clean = text.strip()
    scores = {name: fn(text_clean) for name, fn in PROPERTIES}
    score_vals = list(scores.values())
    
    # 60% mean, 40% weakest link
    mean_val = sum(score_vals) / len(score_vals) if score_vals else 0
    min_val = min(score_vals) if score_vals else 0
    verdict = round(0.6 * mean_val + 0.4 * min_val)
    
    formula_name, hits = classify_formula(text_clean)
    weakest_prop = min(scores, key=scores.get)
    
    band = "STRONG" if verdict >= 72 else "WORKABLE" if verdict >= 55 else "WEAK"
    
    return {
        "hook": text_clean,
        "word_count": len(extract_words(text_clean)),
        "verdict": verdict,
        "band": band,
        "formula": formula_name,
        "formula_hits": hits,
        "breakdown": scores,
        "weakest_property": weakest_prop,
        "weakest_fix": FIX.get(weakest_prop, "")
    }

def rank_hooks(hooks: List[str]) -> List[Dict[str, Any]]:
    scored = [score_hook(h) for h in hooks if h.strip()]
    scored.sort(key=lambda x: -x["verdict"])
    return scored
