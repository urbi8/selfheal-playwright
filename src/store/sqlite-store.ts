import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { HealingStore } from './store.js';
import type {
  HealingEventRow,
  ClassificationRow,
  AccuracySummary,
  ClassificationSummary,
  TimelineEntry,
  TopBrokenSelector,
  RecentEvent,
} from './types.js';

const SCHEMA = `
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
`;

class SQLiteHealingStore implements HealingStore {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode=WAL');
    this.db.exec(SCHEMA);
  }

  recordHealingEvent(event: HealingEventRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO healing_events (
        timestamp, original_selector, original_selector_type,
        healed_selector, healed_selector_type, success, stage,
        duration, llm_model, llm_tokens_used, page_url, page_title,
        error_message, test_file, test_title
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.timestamp,
      event.originalSelector,
      event.originalSelectorType,
      event.healedSelector,
      event.healedSelectorType,
      event.success ? 1 : 0,
      event.stage,
      event.duration,
      event.llmModel,
      event.llmTokensUsed,
      event.pageUrl,
      event.pageTitle,
      event.errorMessage,
      event.testFile,
      event.testTitle,
    );
  }

  recordClassification(classification: ClassificationRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO classifications (
        timestamp, original_selector, category, confidence,
        reasoning, suggested_action, page_url, test_file, test_title
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      classification.timestamp,
      classification.originalSelector,
      classification.category,
      classification.confidence,
      classification.reasoning,
      classification.suggestedAction,
      classification.pageUrl,
      classification.testFile,
      classification.testTitle,
    );
  }

  getAccuracy(): AccuracySummary {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as healed,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM healing_events
    `).get() as any;

    const total = row?.total ?? 0;
    const healed = row?.healed ?? 0;
    const failed = row?.failed ?? 0;

    return {
      total,
      healed,
      failed,
      accuracy: total > 0 ? healed / total : 0,
    };
  }

  getClassificationSummary(): ClassificationSummary[] {
    const rows = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM classifications
      GROUP BY category
      ORDER BY count DESC
    `).all() as any[];

    return rows.map((r) => ({ category: r.category, count: r.count }));
  }

  getTimeline(days: number = 30): TimelineEntry[] {
    const rows = this.db.prepare(`
      SELECT
        DATE(timestamp) as date,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as healed,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM healing_events
      WHERE timestamp >= DATE('now', ?)
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `).all(`-${days} days`) as any[];

    return rows.map((r) => ({
      date: r.date,
      healed: r.healed,
      failed: r.failed,
    }));
  }

  getTopBrokenSelectors(limit: number = 10): TopBrokenSelector[] {
    const rows = this.db.prepare(`
      SELECT
        original_selector as selector,
        COUNT(*) as failure_count,
        MAX(timestamp) as last_seen
      FROM healing_events
      WHERE success = 0
      GROUP BY original_selector
      ORDER BY failure_count DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      selector: r.selector,
      failureCount: r.failure_count,
      lastSeen: r.last_seen,
    }));
  }

  getRecentEvents(limit: number = 20): RecentEvent[] {
    const rows = this.db.prepare(`
      SELECT
        id, timestamp, original_selector, healed_selector,
        success, stage, duration, page_url
      FROM healing_events
      ORDER BY id DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      originalSelector: r.original_selector,
      healedSelector: r.healed_selector,
      success: r.success === 1,
      stage: r.stage,
      duration: r.duration,
      pageUrl: r.page_url,
    }));
  }

  close(): void {
    this.db.close();
  }
}

export function createSQLiteStore(dbPath: string): HealingStore {
  return new SQLiteHealingStore(dbPath);
}
