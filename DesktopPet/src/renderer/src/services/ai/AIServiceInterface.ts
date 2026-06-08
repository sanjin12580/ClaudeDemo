/**
 * AI 服务接口 - 策略模式
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
}

export interface AIService {
  name: string
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>
  healthCheck(): Promise<boolean>
}
