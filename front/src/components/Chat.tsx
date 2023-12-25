import { ChatForm } from './ChatForm.tsx'
import { ChatMessage } from './ChatMessage.tsx'

type ChatProps = {
  className?: string
}

export function Chat({ className }: ChatProps) {
  return (
    <div className={className}>
      <ChatMessage />
      <ChatForm />
    </div>
  )
}
