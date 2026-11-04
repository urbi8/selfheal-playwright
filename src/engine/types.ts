export interface HealingContext {
  originalSelector: string;
  selectorType: string;
  ariaSnapshot: string;
  htmlSnippet: string;
  screenshotBase64?: string;
  errorMessage: string;
  pageUrl: string;
  pageTitle: string;
  testInfo?: {
    file: string;
    title: string;
    line: number;
  };
}

export interface HealingProposal {
  selector: string;
  selectorType: 'css' | 'xpath' | 'role' | 'text' | 'testid' | 'label' | 'placeholder';
  confidence: number;
  reasoning: string;
}

export interface HealingResult {
  success: boolean;
  originalSelector: string;
  healedSelector?: string;
  healedSelectorType?: string;
  proposals: HealingProposal[];
  stage: 'aria' | 'vision' | 'none';
  duration: number;
  llmModel?: string;
  llmTokensUsed?: number;
}
