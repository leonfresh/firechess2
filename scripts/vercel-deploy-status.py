#!/usr/bin/env python3
"""Show the latest Vercel deployments for firechess2 (state + git commit).

Run: python scripts/vercel-deploy-status.py [count]
"""
import json, os, sys, urllib.request, urllib.error

PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
CANDIDATE_AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
]


def token():
    for p in CANDIDATE_AUTH:
        if p and os.path.exists(p):
            return json.load(open(p, encoding="utf-8")).get("token")
    raise SystemExit("no vercel cli auth")


limit = sys.argv[1] if len(sys.argv) > 1 else "4"
req = urllib.request.Request(
    f"https://api.vercel.com/v6/deployments?projectId={PROJECT_ID}&teamId={TEAM_ID}&limit={limit}"
)
req.add_header("Authorization", f"Bearer {token()}")
try:
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
except urllib.error.HTTPError as e:
    print("API error", e.code, e.read().decode()[:300])
    raise SystemExit(1)

for d in data.get("deployments", []):
    meta = d.get("meta", {}) or {}
    sha = (meta.get("githubCommitSha") or "")[:8]
    msg = (meta.get("githubCommitMessage") or "").split("\n")[0][:60]
    print(f"{d.get('state'):<10} {meta.get('githubCommitRef','-'):<8} {sha:<9} {d.get('created', 0)}  {msg}")
    print(f"           url: https://{d.get('url')}")
