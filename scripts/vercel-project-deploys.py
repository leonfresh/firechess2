import json, os, sys, urllib.request
AUTH = [os.path.join(os.environ.get("APPDATA", ""), "com.vercel.cli", "Data", "auth.json"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "com.vercel.cli", "Data", "auth.json")]
tok = next(json.load(open(p, encoding="utf-8"))["token"] for p in AUTH if os.path.exists(p))
project = sys.argv[1] if len(sys.argv) > 1 else "prj_gPhk8HeWqsTxOo1pYutruxEAcn8j"
url = f"https://api.vercel.com/v6/deployments?projectId={project}&teamId=team_RfetyYKh8OFYczVIZW2qhhSU&limit=4"
req = urllib.request.Request(url, headers={"Authorization": "Bearer " + tok})
for d in json.load(urllib.request.urlopen(req))["deployments"]:
    commit = ((d.get("meta") or {}).get("githubCommitSha") or "")[:8]
    print(f"{d['readyState']:9} {d.get('target') or '-':10} {commit:9} {d.get('name','')[:28]:28} {d.get('url','')}")
