import { logger } from '../../config/logger';
import { AIProvider, AIProviderType } from './types';
import {
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
} from './providers/implementations';

/**
 * AI Service Factory - manages provider selection and initialization
 */
export class AIServiceFactory {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string;

  constructor(defaultProvider?: AIProviderType) {
    // Initialize available providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('ollama', new OllamaProvider());

    // Set active provider (prefer the one that's configured)
    this.activeProvider = defaultProvider || this.detectConfiguredProvider();
  }

  /**
   * Auto-detect which provider is configured
   */
  private detectConfiguredProvider(): string {
    for (const [name, provider] of this.providers.entries()) {
      if (provider.isConfigured()) {
        logger.info(`Auto-detected configured provider: ${name}`);
        return name;
      }
    }

    // Default to Ollama (most developer-friendly)
    logger.warn('No configured AI provider detected, defaulting to Ollama');
    return 'ollama';
  }

  /**
   * Get or create provider instance
   */
  getProvider(providerType?: AIProviderType | string): AIProvider {
    const provider = providerType || this.activeProvider;

    if (!this.providers.has(provider)) {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    const instance = this.providers.get(provider)!;

    if (!instance.isConfigured()) {
      logger.warn(`Provider ${provider} is not properly configured`);
    }

    return instance;
  }

  /**
   * Set active provider
   */
  setActiveProvider(provider: AIProviderType | string) {
    if (!this.providers.has(provider)) {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    this.activeProvider = provider;
    logger.info(`Active AI provider set to: ${provider}`);
  }

  /**
   * Get active provider name
   */
  getActiveProvider(): string {
    return this.activeProvider;
  }

  /**
   * List available providers and their status
   */
  getAvailableProviders(): Array<{
    name: string;
    model: string;
    configured: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      model: provider.model,
      configured: provider.isConfigured(),
    }));
  }

  /**
   * Register custom provider
   */
  registerProvider(name: string, provider: AIProvider) {
    this.providers.set(name, provider);
    logger.info(`Custom provider registered: ${name}`);
  }
}

// Singleton instance
let factory: AIServiceFactory | null = null;

export function getAIServiceFactory(): AIServiceFactory {
  if (!factory) {
    factory = new AIServiceFactory();
  }
  return factory;
}
