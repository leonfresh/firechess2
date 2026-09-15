#!/usr/bin/env python3
"""Inspect (and optionally fix) the Vercel project-domain redirect for firechess2.

Why this exists: canonicals, sitemap and JSON-LD all point at the apex
`https://firechess.com`, but the apex 307-redirects to `https://www.firechess.com`
a Vercel project-domain redirect, configured nowhere in the repo (vercel.json has
no redirects), so it can only be read/changed through the Vercel API.

Usage:
  python scripts/vercel-domain-redirect.py show
  python scripts/vercel-domain-redirect.py set-permanent            # apex -> www, 308
  python scripts/vercel-domain-redirect.py clear                    # remove apex redirect

Auth: reads the token from the Vercel CLI's own config (the session created by
`vercel login`). The token is never printed; only API responses are.
"""
import json, os, sys, urllib.request, urllib.error

PROJECT = "firechess2"
PROJECT_ID = "prj_aQmAqE4rruZSZsblcD5pQjVj0sG9"
TEAM_ID = "team_RfetyYKh8OFYczVIZW2qhhSU"
APEX = "firechess.com"
WWW = "www.firechess.com"

CANDIDATE_AUTH = [
    os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
    os.path.expanduser("~/.local/share/com.vercel.cli/auth.json"),
]


def token() -> str:
    for p in CANDIDATE_AUTH:
        if p and os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                data = json.load(f)
            t = data.get("token")
            if t:
                return t
    raise SystemExit("No Vercel CLI auth found — run `vercel login` first.")


def api(method: str, path: str, body=None):
    url = f"https://api.vercel.com{path}"
    sep = "&" if "?" in path else "?"
    url = f"{url}{sep}teamId={TEAM_ID}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token()}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()[:400]}


def show():
    res = api("GET", f"/v9/projects/{PROJECT_ID}/domains")
    domains = res.get("domains", [])
    if not domains:
        print(json.dumps(res, indent=2))
        return domains
    print(f"{'domain':<26} {'redirect':<24} {'status':<10} verified")
    for d in domains:
        print(
            f"{d.get('name',''):<26} {str(d.get('redirect') or '-'):<24} "
            f"{str(d.get('redirectStatusCode') or '-'):<10} {d.get('verified')}"
        )
    return domains


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "show"
    if action == "show":
        show()
        return

    if action == "set-permanent":
        # apex -> www, permanent, so Google treats the apex URLs as redirects of www
        res = api("PATCH", f"/v9/projects/{PROJECT_ID}/domains/{APEX}",
                  {"redirect": WWW, "redirectStatusCode": 308})
        print("PATCH:", json.dumps(res, indent=2)[:400])
    elif action == "clear":
        res = api("PATCH", f"/v9/projects/{PROJECT_ID}/domains/{APEX}",
                  {"redirect": None})
        print("PATCH:", json.dumps(res, indent=2)[:400])
    else:
        print(__doc__)
        return
    print()
    show()


if __name__ == "__main__":
    main()
