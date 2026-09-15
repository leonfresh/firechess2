#!/usr/bin/env python3
"""Audit Vercel env vars that carry a public URL host (SEO/host consistency).

Only URL-bearing, non-secret variables are printed in full; every other value is
reported as "set" / "-".

Run: python scripts/vercel-env-audit.py
"""
import json, os, urllib.request, urllib.error

PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
URL_KEYS = {
    "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL", "AUTH_URL", "NEXTAUTH_URL",
    "NEXT_PUBLIC_BASE_URL", "SITE_URL", "APP_URL",
}
CANDIDATE_AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.expanduser("~/.local/share/com.vercel.cli/auth.json"),
]


def token():
    for p in CANDIDATE_AUTH:
        if p and os.path.exists(p):
            return json.load(open(p, encoding="utf-8")).get("token")
    raise SystemExit("no vercel cli auth")


req = urllib.request.Request(
    f"https://api.vercel.com/v9/projects/{PROJECT_ID}/env?teamId={TEAM_ID}&decrypt=true"
)
req.add_header("Authorization", f"Bearer {token()}")
try:
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
except urllib.error.HTTPError as e:
    print("API error", e.code, e.read().decode()[:300])
    raise SystemExit(1)

envs = data.get("envs", [])
print(f"{len(envs)} env vars on firechess2\n")
interesting = []
for e in sorted(envs, key=lambda x: x.get("key", "")):
    key = e.get("key", "")
    val = e.get("value")
    targets = ",".join(e.get("target", []) or [])
    if key in URL_KEYS:
        interesting.append((key, val, targets))
        print(f"  {key:<28} = {val!r}   [{targets}]")
print("\n--- other vars (value hidden) ---")
for e in sorted(envs, key=lambda x: x.get("key", "")):
    key = e.get("key", "")
    if key not in URL_KEYS:
        print(f"  {key:<28} {'set' if e.get('value') else '-'}   [{','.join(e.get('target', []) or [])}]")
