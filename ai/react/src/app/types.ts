export type Role = 'user' | 'assistant'
export type Theme = 'light' | 'dark'

export type ChatMessage = {
  id: string
  role: Role
  content: string
}

export type ChatSettings = {
  providerId: string
  apiUrl: string
  apiKey: string
  model: string
  systemPrompt: string
}

export type ChatRequestMessage = {
  role: Role | 'system'
  content: string
}
