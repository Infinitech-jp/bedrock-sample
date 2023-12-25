import { ConversationRole, Message, useConversationStore } from '../hooks/useConversationStore.ts'

export function ChatMessage() {
  const messages: Message[] = useConversationStore(state => state.messages)

  return (
    <div className="h-[77vh] overflow-y-scroll">
      {messages.map(message => {
        const roleColor = roleColorClass(message.role)
        const texts = message.text.split('\n\n')

        return (
          <p key={message.id} className={`px-5 py-3 leading-8 ${roleColor}`}>
            {texts.map((text, i) => {
              return (
                <span key={`${message.id}-${i}`}>
                  {text}
                  <br />
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}

function roleColorClass(role: ConversationRole): string {
  return role === 'assistant' ? 'bg-sky-50' : ''
}
