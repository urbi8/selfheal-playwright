export enum FailureCategory {
  Flaky = 'flaky',
  AppBug = 'app-bug',
  TestBug = 'test-bug',
}

export interface Classification {
  category: FailureCategory;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}
