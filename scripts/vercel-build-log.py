#!/usr/bin/env python3
"""Print the route table (and any warnings) from a Vercel deployment's build log.

Run: python scripts/vercel-build-log.py [deploymentId]
"""
import json, os, sys, urllib.request, urllib.error

TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
]


def token():
    for p in AUTH:
        if p and os.path.exists(p):
            return json.load(open(p, encoding="utf-8")).get("token")
    raise SystemExit("no vercel cli auth")


def api(url):
    r = urllib.request.Request(url)
    r.add_header("Authorization", f"Bearer {token()}")
    return json.loads(urllib.request.urlopen(r, timeout=30).read())


deps = api(f"https://api.vercel.com/v6/deployments?projectId={PROJECT_ID}&teamId={TEAM_ID}&limit=1")
dep = (deps.get("deployments") or [{}])[0]
dep_id = sys.argv[1] if len(sys.argv) > 1 else dep.get("id")
print(f"deployment {dep_id} state={dep.get('state')} commit={(dep.get('meta') or {}).get('githubCommitSha','')[:8]}\n")

events = api(f"https://api.vercel.com/v3/deployments/{dep_id}/events?teamId={TEAM_ID}&limit=2000")
interesting = ("openings", "Loading", "warn", "error", "Error", "Route")
for e in events.get("events", []):
    txt = (e.get("payload") or {}).get("text") or ""
    if not txt:
        continue
    for line in txt.splitlines():
        if any(k in line for k in interesting):
            print(line[:160])
