/**
 * AI 服务工厂 - 小米 MIMO（通过 OpenRouter）
 */

import { AIService } from './AIServiceInterface'

class MimoService implements AIService {
  name = '小米 MIMO'

  async chat(messages: { role: string; content: string }[], options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    return window.api.aiChat('mimo', messages, options)
  }

  async *chatStream(messages: { role: string; content: string }[], options?: { temperature?: number; maxTokens?: number }): AsyncIterable<string> {
    const result = await window.api.aiChat('mimo', messages, options)
    yield result
  }

  async healthCheck(): Promise<boolean> {
    try {
      await window.api.aiChat('mimo', [{ role: 'user', content: 'hi' }], { maxTokens: 5 })
      return true
    } catch {
      return false
    }
  }
}

export function createAIService(): AIService {
  return new MimoService()
}
