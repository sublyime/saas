/**
 * AI Integration Examples - TypeScript
 * 
 * These examples show how to use the AI service programmatically
 */

import { aiService } from './src/services/ai';
import { generateAIResolution, correlateIncidents } from './src/services/resolutionService';

/**
 * Example 1: Check AI Service Status
 */
async function checkAIStatus() {
  const status = aiService.getActiveProvider();
  const available = aiService.getAvailableProviders();

  console.log('Active Provider:', status);
  console.log('Available Providers:', available);
  console.log('AI Configured:', aiService.isConfigured());
}

/**
 * Example 2: Generate Resolution with Specific Provider
 */
async function generateResolutionExample(incidentId: string, orgId: string) {
  try {
    // Use specific provider
    const resolution = await generateAIResolution(
      incidentId,
      orgId,
      'openai' // or 'anthropic', 'ollama'
    );

    console.log('Generated Resolution:', {
      title: resolution.solutionTitle,
      score: resolution.confidenceScore,
      steps: resolution.implementationSteps,
    });
  } catch (error) {
    console.error('Resolution generation failed:', error);
  }
}

/**
 * Example 3: Switch AI Provider at Runtime
 */
async function switchProvider() {
  // Check current
  console.log('Current:', aiService.getActiveProvider());

  // Switch to OpenAI
  aiService.setProvider('openai');
  console.log('Switched to:', aiService.getActiveProvider());

  // Switch to local Ollama
  aiService.setProvider('ollama');
  console.log('Switched to:', aiService.getActiveProvider());
}

/**
 * Example 4: Generate Text with Custom Prompt
 */
async function generateTextExample() {
  const prompt =
    'Provide 3 steps to resolve a Kubernetes pod termination timeout issue';

  try {
    const response = await aiService.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 500,
      provider: 'ollama', // Override default provider
    });

    console.log('Generated Text:', response);
  } catch (error) {
    console.error('Text generation failed:', error);
  }
}

/**
 * Example 5: Context-Based Generation
 */
async function generateWithContextExample() {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert incident resolution assistant.',
    },
    {
      role: 'user',
      content: 'What causes Kubernetes pod termination timeouts?',
    },
  ];

  try {
    const response = await aiService.generateWithContext(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    console.log('Generated Response:', response);
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

/**
 * Example 6: Find Correlated Incidents
 */
async function findCorrelatedExample(incidentId: string, orgId: string) {
  try {
    const correlated = await correlateIncidents(orgId, incidentId, 5);

    console.log('Correlated Incidents:', correlated.map((i) => i.title));
  } catch (error) {
    console.error('Correlation failed:', error);
  }
}

/**
 * Example 7: Handle Different Provider Responses
 */
async function multiProviderExample(incidentId: string, orgId: string) {
  const providers = ['ollama', 'openai', 'anthropic'] as const;

  for (const provider of providers) {
    try {
      const resolution = await generateAIResolution(
        incidentId,
        orgId,
        provider
      );

      console.log(`\n${provider}:`);
      console.log(`  Title: ${resolution.solutionTitle}`);
      console.log(`  Confidence: ${resolution.confidenceScore}`);
      console.log(`  Steps: ${resolution.implementationSteps.length}`);
    } catch (error) {
      console.log(`${provider}: Not configured or failed`);
    }
  }
}

/**
 * Example 8: AI Service Factory - Advanced Usage
 */
async function factoryExample() {
  import { getAIServiceFactory } from './src/services/ai/factory';

  const factory = getAIServiceFactory();

  // Get specific provider
  const openai = factory.getProvider('openai');
  console.log('Provider:', openai.name);
  console.log('Model:', openai.model);
  console.log('Configured:', openai.isConfigured());

  // List all
  const all = factory.getAvailableProviders();
  console.log('All Providers:', all);

  // Switch
  factory.setActiveProvider('anthropic');
  console.log('New Active:', factory.getActiveProvider());
}

// Run examples
if (require.main === module) {
  checkAIStatus()
    .then(() => switchProvider())
    .then(() => generateTextExample())
    .catch(console.error);
}

export {
  checkAIStatus,
  generateResolutionExample,
  switchProvider,
  generateTextExample,
  generateWithContextExample,
  findCorrelatedExample,
  multiProviderExample,
  factoryExample,
};
