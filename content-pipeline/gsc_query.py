#!/usr/bin/env python3
"""
GSC Query Script — queries Google Search Console for traffic data.

Usage:
  python gsc_query.py                    # Last 7 days summary
  python gsc_query.py --days 28          # Last 28 days
  python gsc_query.py --pages            # Per-page breakdown

Output: JSON to stdout — gets piped back to the agent's context.
"""

import json
import sys
import os
from datetime import datetime, timedelta, timezone

# ── Paths ──────────────────────────────────────────────────────────────
KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "secrets", "gsc-key.json")
SITE_URL = "sc-domain:firechess.com"

# ── Auth ───────────────────────────────────────────────────────────────
def get_credentials():
    from google.oauth2 import service_account
    with open(KEY_PATH) as f:
        info = json.load(f)
    return service_account.Credentials.from_service_account_info(
        info,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )

def refresh_token(creds):
    from google.auth.transport.requests import Request as AuthRequest
    creds.refresh(AuthRequest())
    return creds.token


# ── API helpers ────────────────────────────────────────────────────────
def gsc_post(endpoint: str, body: dict, token: str) -> dict:
    import urllib.request
    req = urllib.request.Request(
        f"https://searchconsole.googleapis.com/webmasters/v3/{endpoint}",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--pages", action="store_true", default=False)
    args = parser.parse_args()

    creds = get_credentials()
    token = refresh_token(creds)

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=args.days)

    # ── Aggregate stats ────────────────────────────────────────────
    agg_body = {
        "startDate": start_date.strftime("%Y-%m-%d"),
        "endDate": end_date.strftime("%Y-%m-%d"),
        "dimensions": [],
        "type": "web",
    }
    agg = gsc_post(f"sites/{SITE_URL}/searchAnalytics/query", agg_body, token)
    agg_rows = agg.get("rows", [])
    total_clicks = agg_rows[0]["clicks"] if agg_rows else 0
    total_impressions = agg_rows[0]["impressions"] if agg_rows else 0
    avg_ctr = agg_rows[0]["ctr"] if agg_rows else 0
    avg_position = agg_rows[0]["position"] if agg_rows else 0

    output = {
        "site": SITE_URL,
        "period_days": args.days,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "total_clicks": total_clicks,
        "total_impressions": total_impressions,
        "avg_ctr": round(avg_ctr * 100, 2),
        "avg_position": round(avg_position, 1),
    }

    # ── Per-page breakdown ─────────────────────────────────────────
    if args.pages:
        page_body = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "dimensions": ["page"],
            "rowLimit": 25,
            "type": "web",
        }
        pages = gsc_post(f"sites/{SITE_URL}/searchAnalytics/query", page_body, token)
        output["top_pages"] = [
            {
                "path": r["keys"][0],
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"] * 100, 2),
                "position": round(r["position"], 1),
            }
            for r in pages.get("rows", [])
        ]

        # ── Queries driving impressions (for content gap analysis) ─
        query_body = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "dimensions": ["query"],
            "rowLimit": 25,
            "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}],
            "type": "web",
        }
        queries = gsc_post(f"sites/{SITE_URL}/searchAnalytics/query", query_body, token)
        output["top_queries"] = [
            {
                "query": r["keys"][0],
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"] * 100, 2),
                "position": round(r["position"], 1),
            }
            for r in queries.get("rows", [])
        ]

        # ── Low-hanging fruit: queries in position 5-20 with impressions ─
        gap_body = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "dimensions": ["query"],
            "rowLimit": 25,
            "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}],
            "type": "web",
        }
        all_queries = gsc_post(f"sites/{SITE_URL}/searchAnalytics/query", gap_body, token)
        output["content_gaps"] = [
            {
                "query": r["keys"][0],
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": round(r["ctr"] * 100, 2),
                "position": round(r["position"], 1),
            }
            for r in all_queries.get("rows", [])
            if 5 <= r["position"] <= 20 and r["impressions"] >= 50
        ]

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
