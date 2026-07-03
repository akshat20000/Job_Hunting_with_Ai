import { env } from '../config/index.js';
import {
  EvaluationRequest,
  EvaluationResult,
  GenerateArtifactsRequest,
  GenerateArtifactsResponse,
} from './types.js';

export class BrainEngineClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.BRAIN_ENGINE_URL.replace(/\/$/, '');
  }

  private async request<T>(
    path: string,
    options: RequestInit,
    retries = 3,
    timeoutMs = 60000
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}. Body: ${errorBody}`
          );
        }

        return (await response.json()) as T;
      } catch (error: any) {
        clearTimeout(timeoutId);

        const isAbort = error.name === 'AbortError';
        const isNetworkError =
          error instanceof TypeError || error.message?.includes('fetch failed');
        const isServerError =
          error.message?.includes('500') ||
          error.message?.includes('502') ||
          error.message?.includes('503') ||
          error.message?.includes('504');

        const shouldRetry = isAbort || isNetworkError || isServerError;

        if (attempt < retries && shouldRetry) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `⚠️ [BrainEngineClient] Call to ${path} failed (Attempt ${attempt}/${retries}). Retrying in ${delay}ms... Error: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Failed to request ${url} after ${retries} attempts`);
  }

  async evaluateFit(req: EvaluationRequest): Promise<EvaluationResult> {
    return this.request<EvaluationResult>('/api/v1/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
  }

  async generateArtifacts(req: GenerateArtifactsRequest): Promise<GenerateArtifactsResponse> {
    // Generate artifacts can take a long time, so use 120s timeout
    return this.request<GenerateArtifactsResponse>(
      '/api/v1/generate-artifacts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      },
      3,
      120000
    );
  }

  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    }, 1, 5000);
  }
}

export const brainEngineClient = new BrainEngineClient();
export default brainEngineClient;
