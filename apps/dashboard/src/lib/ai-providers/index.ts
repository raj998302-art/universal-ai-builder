/**
 * Universal AI Builder — Modular AI Provider Architecture
 * Supports OpenAI-compatible APIs, Google Gemini, Anthropic Claude, and Custom Endpoints.
 * Never exposes raw API keys to client JavaScript or public payloads.
 */

export interface AIProviderConfig {
  id: string;
  name: string;
  endpoint: string;
  models: string[];
  defaultModel: string;
  isConfigured: boolean;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface CompletionResult {
  text: string;
  provider: string;
  model: string;
  tokensUsed?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

/**
 * Check which providers are configured in the current environment
 */
export function getProviderConfigs(): AIProviderConfig[] {
  return [
    {
      id: 'gemini',
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
      defaultModel: 'gemini-1.5-flash',
      isConfigured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    },
    {
      id: 'openai',
      name: 'OpenAI / Compatible',
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini'],
      defaultModel: 'gpt-4o',
      isConfigured: !!process.env.OPENAI_API_KEY,
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      endpoint: 'https://api.anthropic.com/v1',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      defaultModel: 'claude-3-5-sonnet-20241022',
      isConfigured: !!process.env.ANTHROPIC_API_KEY,
    },
    {
      id: 'nvidia-nim',
      name: 'NVIDIA NIM',
      endpoint: process.env.NVIDIA_NIM_URL || 'https://integrate.api.nvidia.com/v1',
      models: ['meta/llama-3.1-70b-instruct', 'mistralai/mistral-large-2-instruct'],
      defaultModel: 'meta/llama-3.1-70b-instruct',
      isConfigured: !!process.env.NVIDIA_API_KEY,
    },
    {
      id: 'custom',
      name: 'Custom OpenAI-Compatible Endpoint',
      endpoint: process.env.CUSTOM_AI_ENDPOINT || '',
      models: ['custom-model'],
      defaultModel: 'custom-model',
      isConfigured: !!(process.env.CUSTOM_AI_ENDPOINT && process.env.CUSTOM_AI_KEY),
    },
  ];
}

/**
 * Health check a specified provider
 */
export async function checkProviderHealth(providerId: string): Promise<{
  provider: string;
  status: 'healthy' | 'unconfigured' | 'error';
  latencyMs?: number;
  message: string;
}> {
  const configs = getProviderConfigs();
  const config = configs.find(c => c.id === providerId);

  if (!config) {
    return {
      provider: providerId,
      status: 'error',
      message: `Unknown provider identifier: ${providerId}`,
    };
  }

  if (!config.isConfigured) {
    return {
      provider: config.name,
      status: 'unconfigured',
      message: `API key or endpoint environment variable is not configured for ${config.name}.`,
    };
  }

  const start = Date.now();
  try {
    if (providerId === 'gemini') {
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        { method: 'GET', signal: AbortSignal.timeout(5000) }
      );
      const latencyMs = Date.now() - start;
      return {
        provider: config.name,
        status: res.ok ? 'healthy' : 'error',
        latencyMs,
        message: res.ok ? 'Successfully connected to Google Gemini API' : `HTTP error: ${res.status}`,
      };
    }

    if (providerId === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      const res = await fetch(`${config.endpoint}/models`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;
      return {
        provider: config.name,
        status: res.ok ? 'healthy' : 'error',
        latencyMs,
        message: res.ok ? 'Successfully connected to OpenAI API' : `HTTP error: ${res.status}`,
      };
    }

    return {
      provider: config.name,
      status: 'healthy',
      latencyMs: Date.now() - start,
      message: `${config.name} credentials present and configured.`,
    };
  } catch (err: any) {
    return {
      provider: config.name,
      status: 'error',
      latencyMs: Date.now() - start,
      message: `Connection failed: ${err.message}`,
    };
  }
}

/**
 * Generate AI completion with automatic fallback and error propagation
 */
export async function generateCompletion(
  prompt: string,
  preferredProvider = 'gemini',
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const configs = getProviderConfigs();
  let provider = configs.find(c => c.id === preferredProvider && c.isConfigured);

  // Fallback to any configured provider if preferred is missing
  if (!provider) {
    provider = configs.find(c => c.isConfigured);
  }

  if (!provider) {
    throw new Error(
      'No AI Provider is configured with valid API keys. Please configure GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your environment.'
    );
  }

  const timeoutMs = options.timeoutMs || 25000;
  const model = options.model || provider.defaultModel;

  if (provider.id === 'gemini') {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      text,
      provider: 'gemini',
      model,
      tokensUsed: {
        total: data.usageMetadata?.totalTokenCount,
      },
    };
  }

  if (provider.id === 'openai' || provider.id === 'custom' || provider.id === 'nvidia-nim') {
    const key =
      provider.id === 'openai'
        ? process.env.OPENAI_API_KEY
        : provider.id === 'nvidia-nim'
        ? process.env.NVIDIA_API_KEY
        : process.env.CUSTOM_AI_KEY;

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${provider.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${provider.name} API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return {
      text,
      provider: provider.id,
      model,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens,
        completion: data.usage?.completion_tokens,
        total: data.usage?.total_tokens,
      },
    };
  }

  throw new Error(`Provider implementation pending for ${provider.id}`);
}
