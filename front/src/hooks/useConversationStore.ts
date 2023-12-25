import { create } from 'zustand'
import { produce } from 'immer'
import { predictStream } from './usePredictStream.ts'

export type ConversationRole = 'human' | 'assistant'

export type Message = {
  id?: string
  role: ConversationRole
  text: string
}

interface ConversationStore {
  messages: Message[]
  post: (message: string) => Promise<void>
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  messages: [],
  post: async message => {
    set(state => {
      const newMessages = produce(state.messages, draft => {
        const humanMessage: Message = { id: crypto.randomUUID(), role: 'human', text: message }
        return [...draft, humanMessage]
      })

      return { messages: newMessages }
    })

    const sendMessage = get().messages.reduce((acc, cur) => {
      if (cur.role === 'human') {
        return `${acc} Human: ${cur.text}\n\n Assistant: `
      } else {
        return `${acc} ${cur.text}\n\n`
      }
    }, '')

    const stream = predictStream({
      messages: sendMessage.trim(),
    })

    let answer = ''
    const currentMessages = get().messages
    for await (const chunk of stream) {
      answer += chunk
      set(() => {
        const newMessages = produce(currentMessages, draft => {
          const message: Message = { id: crypto.randomUUID(), role: 'assistant', text: answer }
          return [...draft, message]
        })

        return { messages: newMessages }
      })
    }
  },
}))
