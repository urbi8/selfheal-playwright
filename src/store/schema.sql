CREATE TABLE IF NOT EXISTS healing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  original_selector TEXT NOT NULL,
  original_selector_type TEXT,
  healed_selector TEXT,
  healed_selector_type TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'none',
  duration INTEGER NOT NULL DEFAULT 0,
  llm_model TEXT,
  llm_tokens_used INTEGER,
  page_url TEXT,
  page_title TEXT,
  error_message TEXT,
  test_file TEXT,
  test_title TEXT
);

CREATE TABLE IF NOT EXISTS classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  original_selector TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0,
  reasoning TEXT,
  suggested_action TEXT,
  page_url TEXT,
  test_file TEXT,
  test_title TEXT
);

CREATE INDEX IF NOT EXISTS idx_healing_events_timestamp ON healing_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_healing_events_success ON healing_events(success);
CREATE INDEX IF NOT EXISTS idx_classifications_category ON classifications(category);
