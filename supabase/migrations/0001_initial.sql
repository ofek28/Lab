-- ============================================================
-- Stock Analyst - Initial Database Schema
-- ============================================================

-- -------------------------------------------------------
-- NOTES: Investment notebook entries (one per stock)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker        TEXT NOT NULL,
  company_name  TEXT,

  -- Core thesis fields
  thesis        TEXT,
  risks         TEXT,
  target_price  NUMERIC(10, 2),
  conviction    SMALLINT CHECK (conviction BETWEEN 1 AND 5),
  rating        TEXT CHECK (rating IN ('strong_buy','buy','hold','sell','strong_sell')),

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT notes_ticker_unique UNIQUE (ticker)
);

-- -------------------------------------------------------
-- NOTE_VERSIONS: Append-only history of every edit
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS note_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id      UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  ticker       TEXT NOT NULL,

  thesis       TEXT,
  risks        TEXT,
  target_price NUMERIC(10, 2),
  conviction   SMALLINT,
  rating       TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);

-- -------------------------------------------------------
-- AGENT_REPORTS: Cached AI analysis results
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker       TEXT NOT NULL,
  report_type  TEXT NOT NULL CHECK (report_type IN ('fundamental','technical','news','composite')),
  content      JSONB NOT NULL,
  model_id     TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_reports_ticker ON agent_reports(ticker);
CREATE INDEX IF NOT EXISTS idx_agent_reports_ticker_type ON agent_reports(ticker, report_type, created_at DESC);

-- -------------------------------------------------------
-- AUTO-UPDATE updated_at on notes
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- AUTO-SNAPSHOT: Create a version row on every notes update
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION snapshot_note_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO note_versions (note_id, ticker, thesis, risks, target_price, conviction, rating)
  VALUES (OLD.id, OLD.ticker, OLD.thesis, OLD.risks, OLD.target_price, OLD.conviction, OLD.rating);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_version_snapshot ON notes;
CREATE TRIGGER notes_version_snapshot
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION snapshot_note_version();

-- -------------------------------------------------------
-- ROW LEVEL SECURITY (disabled for MVP - single user)
-- Uncomment and configure when adding auth
-- -------------------------------------------------------
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_reports ENABLE ROW LEVEL SECURITY;
