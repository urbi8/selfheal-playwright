import type {
  HealingEventRow,
  ClassificationRow,
  AccuracySummary,
  ClassificationSummary,
  TimelineEntry,
  TopBrokenSelector,
  RecentEvent,
} from './types.js';

export interface HealingStore {
  recordHealingEvent(event: HealingEventRow): void;
  recordClassification(classification: ClassificationRow): void;
  getAccuracy(): AccuracySummary;
  getClassificationSummary(): ClassificationSummary[];
  getTimeline(days?: number): TimelineEntry[];
  getTopBrokenSelectors(limit?: number): TopBrokenSelector[];
  getRecentEvents(limit?: number): RecentEvent[];
  close(): void;
}
