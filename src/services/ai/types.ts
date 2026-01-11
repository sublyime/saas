/**
 * AI Service abstraction - supports any LLM provider
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIGenerationOptions {
  temperature?: number; // 0-2, controls randomness
  maxTokens?: number; // Max output tokens
  topP?: number; // Nucleus sampling
  frequencyPenalty?: number; // -2 to 2
  presencePenalty?: number; // -2 to 2
  stream?: boolean; // Enable streaming
}

export interface AIGenerationResponse {
  content: string;
  stopReason?: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  provider: string;
  model: string;
}

export interface AIResolutionRequest {
  incidentTitle: string;
  incidentDescription: string;
  artifactTexts: string[];
  previousResolutions?: string[];
  context?: Record<string, any>;
}

export interface AIResolutionResponse {
  solutionTitle: string;
  solutionDescription: string;
  implementationSteps: string[];
  confidenceScore: number; // 0-1
  reasoning: string;
  relatedErrors?: string[];
  preventionSteps?: string[];
}

export interface AIProvider {
  name: string;
  model: string;
  isConfigured(): boolean;
  generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse>;
  generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIGenerationResponse>;
  generateIncidentResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions
  ): Promise<AIResolutionResponse>;
}

export type AIProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom';
