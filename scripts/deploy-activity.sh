#!/usr/bin/env bash
# Deploy the Discord activity (chaos.firechess.com) to production.
# The Vercel project's root directory is "discord-activity", so this MUST run from the repo root.
# Usage: bash scripts/deploy-activity.sh
set -euo pipefail
cd "$(dirname "$0")/.."

TOK=$(node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync(process.env.APPDATA+'/com.vercel.cli/Data/auth.json','utf8')).token)")
export VERCEL_PROJECT_ID=prj_gPhk8HeWqsTxOo1pYutruxEAcn8j
export VERCEL_ORG_ID=team_RfetyYKh8OFYczVIZW2qhhSU

vercel deploy --prod --yes --token "$TOK" 2>&1 | tail -8
