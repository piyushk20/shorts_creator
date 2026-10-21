import re

with open('scratch/public-apis/README.md', 'r', encoding='utf-8') as f:
    text = f.read()

for cat in ['Video', 'Photography', 'Art & Design']:
    pattern = rf'### {cat}\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        print(f"==================== {cat} ====================")
        lines = match.group(1).strip().split('\n')
        for l in lines[2:]:
            parts = [p.strip() for p in l.split('|') if p.strip()]
            if len(parts) >= 3:
                name = parts[0]
                desc = parts[1]
                auth = parts[2]
                print(f"{name:<35} | Auth: {auth:<12} | {desc}")
        print()
