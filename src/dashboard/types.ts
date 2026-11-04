import type {
  AccuracySummary,
  ClassificationSummary,
  TimelineEntry,
  TopBrokenSelector,
  RecentEvent,
} from '../store/types.js';

export interface DashboardData {
  generatedAt: string;
  accuracy: AccuracySummary;
  classificationSummary: ClassificationSummary[];
  timeline: TimelineEntry[];
  topBrokenSelectors: TopBrokenSelector[];
  recentEvents: RecentEvent[];
}
