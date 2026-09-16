#!/usr/bin/env python3
"""Trigger a Vercel production deployment from a git ref (committed code only).

Used when a push to main did not kick off a build (webhook miss). Deploys the ref,
never the dirty working tree, so uncommitted WIP stays out of production.

Run: python scripts/vercel-deploy-git.py [ref]   (default: main)
"""
import json, os, sys, time, urllib.request, urllib.error

PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
REPO_ID = 1163713574
AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
]

ref = sys.argv[1] if len(sys.argv) > 1 else "main"
target = sys.argv[2] if len(sys.argv) > 2 else "production"


def token():
    for p in AUTH:
        if p and os.path.exists(p):
            return json.load(open(p, encoding="utf-8")).get("token")
    raise SystemExit("no vercel cli auth")


def api(url, method="GET", body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Authorization", f"Bearer {token()}")
    if body:
        req.add_header("Content-Type", "application/json")
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read())
    except urllib.error.HTTPError as e:
        print("API error", e.code, e.read().decode()[:400])
        raise SystemExit(1)


proj = api(f"https://api.vercel.com/v9/projects/{PROJECT_ID}?teamId={TEAM_ID}")
print("ignoreCommand:", proj.get("commandForIgnoringBuildStep"))

body = {
    "name": "firechess2",
    "project": PROJECT_ID,
    "gitSource": {"type": "github", "ref": ref, "repoId": REPO_ID},
}
# 'preview' is not an accepted target value (production | staging | custom env);
# a non-production branch preview is simply a deploy with no target.
if target != "preview":
    body["target"] = target

d = api(
    f"https://api.vercel.com/v13/deployments?teamId={TEAM_ID}&forceNew=1",
    method="POST",
    body=body,
)
dep_id = d.get("id")
print(f"created deployment {dep_id} state={d.get('state')} commit={(d.get('meta') or {}).get('githubCommitSha','')[:8]}")
print(f"  url: https://{d.get('url')}")

for _ in range(60):
    time.sleep(15)
    cur = api(f"https://api.vercel.com/v13/deployments/{dep_id}?teamId={TEAM_ID}")
    # The single-deployment endpoint reports readyState; the list endpoint uses state.
    state = cur.get("readyState") or cur.get("state") or "UNKNOWN"
    print(f"  [{time.strftime('%H:%M:%S')}] {state}")
    if state in {"READY", "ERROR", "CANCELED"}:
        print(f"final: {state}  https://{cur.get('url')}")
        raise SystemExit(0 if state == "READY" else 1)
raise SystemExit(2)  # never resolved: treat as failure, not success
