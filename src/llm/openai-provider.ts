import OpenAI from 'openai';
import type { LLMProvider } from './provider.js';
import type { LLMMessage, LLMResponse, LLMContentPart } from './types.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  readonly supportsVision = true;
  private client: OpenAI;
  private model: string;
  private temperature: number;

  constructor(apiKey: string, model: string, temperature: number = 0) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.temperature = temperature;
  }

  async complete(messages: LLMMessage[], jsonMode: boolean = false): Promise<LLMResponse> {
    const openaiMessages = messages.map((msg) => this.mapMessage(msg));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      temperature: this.temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });

    const content = response.choices[0]?.message?.content ?? '';
    return {
      content,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  private mapMessage(msg: LLMMessage): OpenAI.Chat.ChatCompletionMessageParam {
    if (typeof msg.content === 'string') {
      return { role: msg.role as 'system' | 'user' | 'assistant', content: msg.content };
    }

    const parts = (msg.content as LLMContentPart[]).map((part) => {
      if (part.type === 'text') {
        return { type: 'text' as const, text: part.text };
      }
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:${part.mediaType};base64,${part.base64}`,
          detail: 'low' as const,
        },
      };
    });

    return { role: msg.role as 'user', content: parts };
  }
}
