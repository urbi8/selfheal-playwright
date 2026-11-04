export interface LLMTextContent {
  type: 'text';
  text: string;
}

export interface LLMImageContent {
  type: 'image';
  base64: string;
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp';
}

export type LLMContentPart = LLMTextContent | LLMImageContent;

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | LLMContentPart[];
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMResponse {
  content: string;
  usage: LLMUsage;
}
