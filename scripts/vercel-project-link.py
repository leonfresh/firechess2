#!/usr/bin/env python3
"""Show firechess2's Vercel project link (git integration) and latest deployment meta.

Run: python scripts/vercel-project-link.py
"""
import json, os, urllib.request, urllib.error

PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
]


def token():
    for p in AUTH:
        if p and os.path.exists(p):
            return json.load(open(p, encoding="utf-8")).get("token")
    raise SystemExit("no vercel cli auth")


def get(url):
    r = urllib.request.Request(url)
    r.add_header("Authorization", f"Bearer {token()}")
    return json.loads(urllib.request.urlopen(r, timeout=30).read())


proj = get(f"https://api.vercel.com/v9/projects/{PROJECT_ID}?teamId={TEAM_ID}")
print("name:", proj.get("name"))
print("link:", json.dumps(proj.get("link"), indent=2)[:400])
print("gitProviderOptions:", json.dumps(proj.get("gitProviderOptions"), indent=2)[:300])
print("autoExposeSystemEnvs:", proj.get("autoExposeSystemEnvs"))
print("framework:", proj.get("framework"), "| nodeVersion:", proj.get("nodeVersion"))

deps = get(f"https://api.vercel.com/v6/deployments?projectId={PROJECT_ID}&teamId={TEAM_ID}&limit=1")
d = (deps.get("deployments") or [{}])[0]
meta = d.get("meta", {}) or {}
print("\nlatest deployment:")
for k in ("githubCommitSha", "githubCommitRef", "githubCommitRepo", "githubCommitOrg",
          "githubCommitRepoId", "githubCommitMessage", "githubDeployment", "branchAlias"):
    if k in meta:
        print(f"  {k}: {str(meta[k])[:80]}")
