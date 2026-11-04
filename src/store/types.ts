export interface HealingEventRow {
  timestamp: string;
  originalSelector: string;
  originalSelectorType: string | null;
  healedSelector: string | null;
  healedSelectorType: string | null;
  success: boolean;
  stage: string;
  duration: number;
  llmModel: string | null;
  llmTokensUsed: number | null;
  pageUrl: string;
  pageTitle: string;
  errorMessage: string;
  testFile: string | null;
  testTitle: string | null;
}

export interface ClassificationRow {
  timestamp: string;
  originalSelector: string;
  category: string;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  pageUrl: string;
  testFile: string | null;
  testTitle: string | null;
}

export interface AccuracySummary {
  total: number;
  healed: number;
  failed: number;
  accuracy: number;
}

export interface ClassificationSummary {
  category: string;
  count: number;
}

export interface TimelineEntry {
  date: string;
  healed: number;
  failed: number;
}

export interface TopBrokenSelector {
  selector: string;
  failureCount: number;
  lastSeen: string;
}

export interface RecentEvent {
  id: number;
  timestamp: string;
  originalSelector: string;
  healedSelector: string | null;
  success: boolean;
  stage: string;
  duration: number;
  pageUrl: string;
}
