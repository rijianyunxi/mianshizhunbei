import { openAICompatibleProvider, type ChatProviderAdapter } from './provider'

const providerRegistry = new Map<string, ChatProviderAdapter>([
  [openAICompatibleProvider.id, openAICompatibleProvider],
])

export function listChatProviders(): ChatProviderAdapter[] {
  return Array.from(providerRegistry.values())
}

export function getChatProvider(providerId: string): ChatProviderAdapter {
  return providerRegistry.get(providerId) ?? openAICompatibleProvider
}

export function registerChatProvider(provider: ChatProviderAdapter): void {
  providerRegistry.set(provider.id, provider)
}

export function unregisterChatProvider(providerId: string): boolean {
  if (providerId === openAICompatibleProvider.id) {
    return false
  }
  return providerRegistry.delete(providerId)
}
