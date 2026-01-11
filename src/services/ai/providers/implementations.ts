import axios from 'axios';
import config from '../../config';
import { logger } from '../../config/logger';
import {
  AIProvider,
  AIGenerationOptions,
  AIGenerationResponse,
  AIMessage,
  AIResolutionRequest,
  AIResolutionResponse,
} from '../types';

/**
 * OpenAI GPT-4/GPT-3.5 Provider
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model: string;
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || config.ai.openaiApiKey;
    this.model = model || config.ai.openaiModel || 'gpt-4-turbo';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
          top_p: options?.topP ?? 1,
          frequency_penalty: options?.frequencyPenalty ?? 0,
          presence_penalty: options?.presencePenalty ?? 0,
          stream: options?.stream ?? false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        stopReason: response.data.choices[0].finish_reason,
        tokensUsed: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens,
        },
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  async generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
          stream: options?.stream ?? false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        stopReason: response.data.choices[0].finish_reason,
        tokensUsed: {
          input: response.data.usage.prompt_tokens,
          output: response.data.usage.completion_tokens,
          total: response.data.usage.total_tokens,
        },
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  async generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert incident resolution assistant. Analyze the incident and provide actionable solutions.
Return a JSON object with: solutionTitle, solutionDescription, implementationSteps (array), confidenceScore (0-1), reasoning, relatedErrors (array), preventionSteps (array).`;

    const userPrompt = `
Incident: ${request.incidentTitle}
Description: ${request.incidentDescription}

Artifact Data:
${request.artifactTexts.map((text, i) => `--- Artifact ${i + 1} ---\n${text.substring(0, 1000)}`).join('\n')}

${request.previousResolutions ? `Previous attempts:\n${request.previousResolutions.join('\n')}` : ''}

Generate a resolution with implementation steps.`;

    try {
      const response = await this.generateWithContext(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { ...options, maxTokens: 2000, temperature: 0.5 }
      );

      const parsed = JSON.parse(response.content);
      return {
        solutionTitle: parsed.solutionTitle || 'Solution',
        solutionDescription: parsed.solutionDescription || response.content,
        implementationSteps: parsed.implementationSteps || [],
        confidenceScore: Math.min(1, Math.max(0, parsed.confidenceScore || 0.8)),
        reasoning: parsed.reasoning || '',
        relatedErrors: parsed.relatedErrors || [],
        preventionSteps: parsed.preventionSteps || [],
      };
    } catch (error) {
      logger.error('OpenAI resolution generation error:', error);
      throw error;
    }
  }
}

/**
 * Anthropic Claude Provider
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  model: string;
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model || process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: options?.maxTokens ?? 2000,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      return {
        content: response.data.content[0].text,
        stopReason: response.data.stop_reason,
        tokensUsed: {
          input: response.data.usage.input_tokens,
          output: response.data.usage.output_tokens,
          total: response.data.usage.input_tokens + response.data.usage.output_tokens,
        },
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('Anthropic API error:', error);
      throw error;
    }
  }

  async generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: options?.maxTokens ?? 2000,
          messages: conversationMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...(systemMessage && { system: systemMessage }),
          temperature: options?.temperature ?? 0.7,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      return {
        content: response.data.content[0].text,
        stopReason: response.data.stop_reason,
        tokensUsed: {
          input: response.data.usage.input_tokens,
          output: response.data.usage.output_tokens,
          total: response.data.usage.input_tokens + response.data.usage.output_tokens,
        },
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('Anthropic API error:', error);
      throw error;
    }
  }

  async generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const systemPrompt = `You are an expert incident resolution assistant. Analyze the incident and provide actionable solutions.
Return a JSON object with: solutionTitle, solutionDescription, implementationSteps (array), confidenceScore (0-1), reasoning, relatedErrors (array), preventionSteps (array).`;

    const userPrompt = `
Incident: ${request.incidentTitle}
Description: ${request.incidentDescription}

Artifact Data:
${request.artifactTexts.map((text, i) => `--- Artifact ${i + 1} ---\n${text.substring(0, 1000)}`).join('\n')}

${request.previousResolutions ? `Previous attempts:\n${request.previousResolutions.join('\n')}` : ''}

Generate a resolution with implementation steps.`;

    try {
      const response = await this.generateWithContext(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { ...options, maxTokens: 2000, temperature: 0.5 }
      );

      const parsed = JSON.parse(response.content);
      return {
        solutionTitle: parsed.solutionTitle || 'Solution',
        solutionDescription: parsed.solutionDescription || response.content,
        implementationSteps: parsed.implementationSteps || [],
        confidenceScore: Math.min(1, Math.max(0, parsed.confidenceScore || 0.8)),
        reasoning: parsed.reasoning || '',
        relatedErrors: parsed.relatedErrors || [],
        preventionSteps: parsed.preventionSteps || [],
      };
    } catch (error) {
      logger.error('Anthropic resolution generation error:', error);
      throw error;
    }
  }
}

/**
 * Ollama Local LLM Provider (for self-hosted models)
 */
export class OllamaProvider implements AIProvider {
  name = 'ollama';
  model: string;
  private baseUrl: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = model || process.env.OLLAMA_MODEL || 'mistral';
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  async generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt,
        temperature: options?.temperature ?? 0.7,
        stream: false,
      });

      return {
        content: response.data.response,
        stopReason: 'stop',
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      logger.error('Ollama API error:', error);
      throw error;
    }
  }

  async generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    // Ollama's chat endpoint is simpler, convert to prompt
    const conversationText = messages
      .map((m) => {
        const prefix = m.role === 'user' ? 'User: ' : m.role === 'assistant' ? 'Assistant: ' : '';
        return `${prefix}${m.content}`;
      })
      .join('\n');

    return this.generateText(conversationText, options);
  }

  async generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse> {
    const prompt = `You are an expert incident resolution assistant.

Incident: ${request.incidentTitle}
Description: ${request.incidentDescription}

Artifact Data:
${request.artifactTexts.map((text, i) => `--- Artifact ${i + 1} ---\n${text.substring(0, 500)}`).join('\n')}

Provide a JSON response with:
{
  "solutionTitle": "string",
  "solutionDescription": "string",
  "implementationSteps": ["step1", "step2"],
  "confidenceScore": 0.8,
  "reasoning": "string",
  "relatedErrors": [],
  "preventionSteps": []
}`;

    try {
      const response = await this.generateText(prompt, { ...options, temperature: 0.5 });

      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        solutionTitle: parsed.solutionTitle || 'Solution',
        solutionDescription: parsed.solutionDescription || response.content,
        implementationSteps: parsed.implementationSteps || [],
        confidenceScore: Math.min(1, Math.max(0, parsed.confidenceScore || 0.7)),
        reasoning: parsed.reasoning || '',
        relatedErrors: parsed.relatedErrors || [],
        preventionSteps: parsed.preventionSteps || [],
      };
    } catch (error) {
      logger.error('Ollama resolution generation error:', error);
      throw error;
    }
  }
}
