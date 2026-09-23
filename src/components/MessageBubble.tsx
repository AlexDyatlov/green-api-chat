import { memo } from 'react'
import type { ChatMessage } from '../types'

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

type Props = {
  message: ChatMessage
}

export const MessageBubble = memo(function MessageBubble({ message }: Props) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
          isOutgoing
            ? 'rounded-br-md bg-brand text-white'
            : 'rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200'
        }`}
      >
        <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
        <span
          className={`mt-1 block text-right text-[11px] ${
            isOutgoing ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          {timeFormatter.format(new Date(message.timestamp))}
        </span>
      </div>
    </div>
  )
})
