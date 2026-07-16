import os, re, glob
files = glob.glob('content/blog/*.md')
posts = []
for f in files:
    with open(f) as fh: c = fh.read()
    posts.append({
        'words': len(c.split()),
        'pos': len(re.findall(r'chess-position', c)),
        'svg': c.count('<svg'),
        'faq': len(re.findall(r'## FAQ|## Frequently', c)),
        'name': os.path.basename(f).replace('.md', '')
    })
posts.sort(key=lambda p: p['words'])
print(f'Total: {len(posts)}')
print(f'Under 2500w: {sum(1 for p in posts if p["words"] < 2500)}')
print(f'0 pos: {sum(1 for p in posts if p["pos"] == 0)}')
print(f'No FAQ: {sum(1 for p in posts if p["faq"] == 0)}')
for p in posts:
    flags = []
    if p['words'] < 2500: flags.append('SHORT')
    if p['pos'] == 0: flags.append('NO-POS')
    if p['faq'] == 0: flags.append('NO-FAQ')
    f = ' ⚠️' + ','.join(flags) if flags else ' ✅'
    print(f"  {p['words']:>5}w {p['pos']:>2}pos {p['svg']:>2}svg {p['faq']:>2}faq | {p['name']}{f}")
