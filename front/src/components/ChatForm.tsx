import React, { useState } from 'react'
import { useConversationStore } from '../hooks/useConversationStore.ts'

type TextFormProps = {
  className?: string
}

export function ChatForm({ className }: TextFormProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const post = useConversationStore(state => state.post)

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value)
  }
  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isSending) {
      return
    }
    setIsSending(true)
    post(message)
    setMessage('')
    setIsSending(false)
  }

  return (
    <div className={className}>
      <div className="">
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-screen-lg   bg-gradient-to-b from-transparent to-white">
          <div className="px-4">
            <textarea
              className="h-full w-full resize-none border border-gray-300 p-5 pl-3 pr-36"
              placeholder="Type something..."
              value={message}
              onChange={handleChange}
            />
            <button
              className="absolute bottom-3 right-8 rounded-sm bg-blue-300 px-10 py-2 text-white hover:bg-blue-400 active:bg-blue-500"
              onClick={handleSubmit}
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
