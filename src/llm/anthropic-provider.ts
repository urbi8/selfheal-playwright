import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './provider.js';
import type { LLMMessage, LLMResponse, LLMContentPart } from './types.js';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  readonly supportsVision = true;
  private client: Anthropic;
  private model: string;
  private temperature: number;

  constructor(apiKey: string, model: string, temperature: number = 0) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.temperature = temperature;
  }

  async complete(messages: LLMMessage[], _jsonMode: boolean = false): Promise<LLMResponse> {
    // Extract system message
    let system: string | undefined;
    const nonSystemMessages: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = typeof msg.content === 'string' ? msg.content : '';
      } else {
        nonSystemMessages.push(msg);
      }
    }

    const anthropicMessages = nonSystemMessages.map((msg) => this.mapMessage(msg));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: this.temperature,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private mapMessage(msg: LLMMessage): Anthropic.MessageParam {
    if (typeof msg.content === 'string') {
      return { role: msg.role as 'user' | 'assistant', content: msg.content };
    }

    const parts = (msg.content as LLMContentPart[]).map((part): Anthropic.ContentBlockParam => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: part.mediaType,
          data: part.base64,
        },
      };
    });

    return { role: msg.role as 'user' | 'assistant', content: parts };
  }
}
