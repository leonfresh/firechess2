#!/usr/bin/env python3
import subprocess, json

reports = [
    ("d88ee0a8-2686-4c9a-9100-cb5c7c6a0068", "Hikaru"),
    ("4aa88749-ca3b-430e-9d03-f7dca08eadf2", "Magnus"),
    ("8c8d499e-1f04-4121-aabc-71a818b98ce6", "GothamChess"),
    ("bbacb94a-f71b-47f3-84ab-39d5696c1925", "AlexandraBotez"),
    ("f16a5e29-532c-4ee8-ba00-52fb01c20b3f", "AndreaBotez"),
    ("56577c6f-114d-4231-a141-6bcfe9c80d88", "EricRosen"),
    ("45315c3e-c79f-465d-973a-c629f7a341fd", "Tyler1"),
    ("6ee89e5c-d93a-4c1b-b813-fa8a1f0df340", "xQc"),
    ("5ec6e272-4a2e-4c7e-afa5-7c4cc0462619", "MoistCr1TiKaL"),
]

for rid, name in reports:
    out = subprocess.run(
        ["curl", "-s", f"http://localhost:3000/api/scans/{rid}?guestToken=public"],
        capture_output=True, text=True, timeout=15
    )
    try:
        d = json.loads(out.stdout)
        result = d.get("scan", {}).get("result") or {}
        if isinstance(result, str):
            result = json.loads(result)
        games = result.get("gamesAnalyzed", 0) or 0
        leaks = result.get("leaks") or []
        missed = result.get("missedTactics") or []
        endgames = result.get("endgameMistakes") or []
        print(f'    {name}: {{ gamesScanned: {games}, openingLeaks: {len(leaks)}, missedTactics: {len(missed) if isinstance(missed, list) else missed}, endgameMistakes: {len(endgames) if isinstance(endgames, list) else endgames} }},')
    except Exception as e:
        print(f"{name}: ERROR {e}", file=__import__('sys').stderr)
