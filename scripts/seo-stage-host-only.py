#!/usr/bin/env python3
"""Stage the host swap for files that also carry unrelated WIP, without sweeping it in.

Instead of patch surgery (which trips over this repo's CRLF normalisation), this
builds the staged blob deterministically: HEAD content + the apex->www swap, then
writes it straight into the index. The working tree is untouched, so foreign
uncommitted work stays uncommitted.

Run: python scripts/seo-stage-host-only.py <path> [path...]
"""
import os, re, subprocess, sys

APEX = re.compile(r"(?<!www\.)https://firechess\.com")
SUBM = "https://www.firechess.com"

for path in sys.argv[1:]:
    blob = subprocess.run(["git", "show", f"HEAD:{path}"], capture_output=True).stdout
    if not blob:
        print(f"  not in HEAD, skipped: {path}")
        continue
    text = blob.decode("utf-8")
    if not APEX.search(text):
        print(f"  no apex in HEAD, skipped: {path}")
        continue
    new = APEX.sub(SUBM, text)
    tmp = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "fc-host-blob.tmp")
    with open(tmp, "wb") as fh:
        fh.write(new.encode("utf-8"))
    sha = subprocess.run(["git", "hash-object", "-w", "--", tmp],
                         capture_output=True, text=True).stdout.strip()
    mode = subprocess.run(["git", "ls-files", "-s", "--", path],
                          capture_output=True, text=True).stdout.split()[0]
    r = subprocess.run(["git", "update-index", "--cacheinfo", f"{mode},{sha},{path}"],
                       capture_output=True, text=True)
    n = len(APEX.findall(text))
    print(f"  staged {n} swap(s) from HEAD only  {path}" if r.returncode == 0
          else f"  FAILED: {path} {r.stderr.strip()[:100]}")
