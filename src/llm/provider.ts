import type { LLMMessage, LLMResponse } from './types.js';

export interface LLMProvider {
  readonly name: string;
  readonly supportsVision: boolean;
  complete(messages: LLMMessage[], jsonMode?: boolean): Promise<LLMResponse>;
}
