import { ConversationRole, Message, useConversationStore } from '../hooks/useConversationStore.ts'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function ChatMessage() {
  const messages: Message[] = useConversationStore(state => state.messages)

  return (
    <div className="h-[77vh] overflow-y-scroll">
      {messages.map(message => {
        const roleColor = roleColorClass(message.role)
        const texts = message.text.split('\n\n')

        return (
          <p key={message.id} className={`px-5 py-3 leading-8 ${roleColor}`}>
            <Markdown
              components={{
                code(props) {
                  const { children, className } = props
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  const codeText = String(children).replace(/\n$/, '')

                  return (
                    <>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language ? language : 'plaintext'}
                        PreTag="div"
                      >
                        {codeText}
                      </SyntaxHighlighter>
                    </>
                  )
                },
              }}
            >
              {texts.join('\n')}
            </Markdown>
          </p>
        )
      })}
    </div>
  )
}

function roleColorClass(role: ConversationRole): string {
  return role === 'assistant' ? 'bg-sky-50' : ''
}
