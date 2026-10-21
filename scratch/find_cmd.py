import json

with open("C:/Users/HP/.gemini/antigravity-ide/brain/83133eae-d9fc-422d-9ab3-c35bc083859c/.system_generated/logs/transcript_full.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        if '"step_index": 1433' in line:
            obj = json.loads(line)
            for tc in obj.get("tool_calls", []):
                print(tc.get("args", {}).get("CommandLine"))
