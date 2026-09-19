-- Weekly growth metrics for Chaos Chess. One row per metric per capture, written by
-- scripts/chaos-growth-report.mjs, so the trend survives without a hand-kept spreadsheet.
-- Window is stored per row (window_days) because retros may use a different span.
CREATE TABLE IF NOT EXISTS chaos_metric (
 id bigserial PRIMARY KEY,
 captured_at timestamptz NOT NULL DEFAULT now(),
 window_days integer NOT NULL DEFAULT 7,
 metric text NOT NULL,
 value numeric NOT NULL,
 detail jsonb
);
CREATE INDEX IF NOT EXISTS chaos_metric_lookup ON chaos_metric(metric, captured_at DESC);
CREATE INDEX IF NOT EXISTS chaos_metric_time ON chaos_metric(captured_at DESC);
