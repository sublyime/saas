import { getAIServiceFactory } from './factory';
import {
  AIResolutionRequest,
  AIResolutionResponse,
  AIGenerationOptions,
  AIMessage,
} from './types';
import { logger } from '../../config/logger';

/**
 * AI Service - High-level interface for AI-powered operations
 */
export class AIService {
  private factory = getAIServiceFactory();

  /**
   * Generate incident resolution with AI
   */
  async generateResolution(
    request: AIResolutionRequest,
    options?: AIGenerationOptions & { provider?: string }
  ): Promise<AIResolutionResponse> {
    try {
      const provider = this.factory.getProvider(options?.provider);

      logger.info(`Generating resolution using ${provider.name}`);

      const resolution = await provider.generateIncidentResolution(request, options);

      return resolution;
    } catch (error) {
      logger.error('Resolution generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate text with AI
   */
  async generateText(
    prompt: string,
    options?: AIGenerationOptions & { provider?: string }
  ): Promise<string> {
    try {
      const provider = this.factory.getProvider(options?.provider);

      const response = await provider.generateText(prompt, options);

      return response.content;
    } catch (error) {
      logger.error('Text generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate response with conversation context
   */
  async generateWithContext(
    messages: AIMessage[],
    options?: AIGenerationOptions & { provider?: string }
  ): Promise<string> {
    try {
      const provider = this.factory.getProvider(options?.provider);

      const response = await provider.generateWithContext(messages, options);

      return response.content;
    } catch (error) {
      logger.error('Context-based generation failed:', error);
      throw error;
    }
  }

  /**
   * Check if any provider is configured
   */
  isConfigured(): boolean {
    const providers = this.factory.getAvailableProviders();
    return providers.some((p) => p.configured);
  }

  /**
   * Get current active provider info
   */
  getActiveProvider() {
    const name = this.factory.getActiveProvider();
    const provider = this.factory.getProvider(name);

    return {
      name: provider.name,
      model: provider.model,
      configured: provider.isConfigured(),
    };
  }

  /**
   * Get all available providers
   */
  getAvailableProviders() {
    return this.factory.getAvailableProviders();
  }

  /**
   * Set active provider
   */
  setProvider(provider: string) {
    this.factory.setActiveProvider(provider);
  }
}

// Singleton instance
export const aiService = new AIService();
