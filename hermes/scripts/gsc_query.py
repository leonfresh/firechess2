#!/usr/bin/env python3
"""
SEO Content Pipeline — Blog Audit & Topic Gap Analysis
Runs as a pre-step for the seo-content-pipeline cron job.
Outputs: audit report + suggested next topic.
"""
import os
import re
import glob
import json

BLOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "content", "blog")

def get_existing_topics():
    """Extract titles and tags from existing blog posts."""
    topics = []
    for f in glob.glob(os.path.join(BLOG_DIR, "*.md")):
        with open(f) as fh:
            content = fh.read()
        # Extract frontmatter
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match:
            continue
        fm = fm_match.group(1)
        title = re.search(r'title:\s*"([^"]+)"', fm)
        tags = re.search(r'tags:\s*\[([^\]]+)\]', fm)
        words = len(content.split())
        positions = len(re.findall(r'chess-position', content))
        has_faq = bool(re.search(r'## FAQ|## Frequently', content))
        topics.append({
            "file": os.path.basename(f),
            "title": title.group(1) if title else "",
            "tags": tags.group(1) if tags else "",
            "words": words,
            "positions": positions,
            "has_faq": has_faq,
        })
    return topics

def find_gaps(topics):
    """Identify content gaps and suggest next topics."""
    existing_tags = set()
    existing_titles = []
    for t in topics:
        for tag in t["tags"].split(","):
            existing_tags.add(tag.strip().strip('"').lower())
        existing_titles.append(t["title"].lower())
    
    # High-value chess topics not yet covered
    gap_topics = [
        ("How to Think Ahead in Chess: A Practical Calculation Guide", ["calculation", "thinking", "improvement"]),
        ("Chess Pawn Structure Guide: Every Pattern You Need to Know", ["pawn structure", "strategy", "fundamentals"]),
        ("The Best Chess Openings for Black: Complete Repertoire Guide", ["openings", "black", "repertoire"]),
        ("Chess Endgame Fundamentals: The 10 Positions Every Player Must Know", ["endgame", "fundamentals", "improvement"]),
        ("How to Analyze Your Opponent's Games Before a Match", ["preparation", "analysis", "tournament"]),
        ("Chess Time Management: How to Stop Flagging and Win on Time", ["time management", "blitz", "rapid"]),
        ("The Sicilian Najdorf: Why 2000+ Players All Play It", ["sicilian", "najdorf", "openings"]),
        ("Chess Traps Every Beginner Falls For (And How to Avoid Them)", ["traps", "beginner", "tactics"]),
        ("How to Build a Chess Opening Repertoire from Scratch", ["repertoire", "openings", "study"]),
        ("Chess Visualization Training: How to See 3 Moves Ahead", ["visualization", "calculation", "training"]),
    ]
    
    suggestions = []
    for title, tags in gap_topics:
        # Check if any tag is already well-covered
        tag_overlap = sum(1 for t in tags if t in existing_tags)
        if tag_overlap < 2:  # Not well covered yet
            suggestions.append({"title": title, "tags": tags})
    
    return suggestions[:3]  # Top 3 suggestions

def main():
    topics = get_existing_topics()
    
    # Audit summary
    under_2500 = [t for t in topics if t["words"] < 2500]
    no_positions = [t for t in topics if t["positions"] == 0]
    no_faq = [t for t in topics if not t["has_faq"]]
    
    print("=" * 60)
    print("FIRECHESS BLOG AUDIT")
    print("=" * 60)
    print(f"Total posts: {len(topics)}")
    print(f"Under 2500w: {len(under_2500)}")
    print(f"No positions: {len(no_positions)}")
    print(f"No FAQ: {len(no_faq)}")
    
    if under_2500:
        print("\n--- Posts needing expansion ---")
        for t in sorted(under_2500, key=lambda x: x["words"]):
            print(f"  {t['words']:>5}w | {t['title']}")
    
    # Topic suggestions
    gaps = find_gaps(topics)
    print("\n--- Suggested next topics ---")
    for i, g in enumerate(gaps, 1):
        print(f"  {i}. {g['title']}")
        print(f"     Tags: {', '.join(g['tags'])}")
    
    # Output as JSON for the agent
    output = {
        "audit": {
            "total": len(topics),
            "under_2500": len(under_2500),
            "no_positions": len(no_positions),
            "no_faq": len(no_faq),
        },
        "suggested_topics": gaps,
        "weakest_post": min(topics, key=lambda x: x["words"]) if topics else None,
    }
    
    print("\n--- JSON OUTPUT ---")
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
