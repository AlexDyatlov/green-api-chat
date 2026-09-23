import { useCallback, useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { ChatComposer } from './ChatComposer'
import { MessageBubble } from './MessageBubble'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import { GreenApiError, sendMessage } from '../lib/greenapi'
import { isSameChat, toChatId } from '../lib/phone'
import type { ChatMessage, Credentials, GreenApiNotification } from '../types'

const NON_DIGITS = /\D/g
const MAX_SEEN_IDS = 500

type Props = {
  credentials: Credentials
  onLogout: () => void
}

export function ChatScreen({ credentials, onLogout }: Props) {
  const [phone, setPhone] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const seenIds = useRef<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  const phoneDigits = phone.replace(NON_DIGITS, '')
  const isPhoneValid = phoneDigits.length >= 10

  const handleNotification = useCallback(
    (notification: GreenApiNotification) => {
      const { body } = notification
      if (body?.typeWebhook !== 'incomingMessageReceived' || !chatId) return

      const senderChatId = body.senderData?.chatId
      if (!senderChatId || !isSameChat(senderChatId, chatId)) return

      const messageData = body.messageData
      const text =
        messageData?.textMessageData?.textMessage ?? messageData?.extendedTextMessageData?.text
      if (!text) return

      const id = body.idMessage ?? `receipt-${notification.receiptId}`
      if (seenIds.current.has(id)) return
      if (seenIds.current.size >= MAX_SEEN_IDS) seenIds.current.clear()
      seenIds.current.add(id)

      setMessages((previous) => [
        ...previous,
        {
          id,
          text,
          direction: 'incoming',
          timestamp: (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
        },
      ])
    },
    [chatId],
  )

  const handlePollingError = useCallback((pollingError: Error) => {
    const hint =
      pollingError instanceof GreenApiError && pollingError.status === 401
        ? ' Авторизация потеряна — войдите снова.'
        : ''
    setError(`Не удалось получать сообщения: ${pollingError.message}.${hint}`)
  }, [])

  useNotificationPolling(credentials, handleNotification, Boolean(chatId), handlePollingError)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCreateChat = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isPhoneValid) {
      setError('Введите номер телефона в международном формате')
      return
    }
    setError(null)
    seenIds.current.clear()
    setMessages([])
    setChatId(toChatId(phone))
    setPhone('')
  }

  const handleSend = async (text: string) => {
    if (!chatId) return
    setIsSending(true)
    setError(null)
    try {
      const idMessage = await sendMessage(credentials, chatId, text)
      setMessages((previous) => [
        ...previous,
        { id: idMessage, text, direction: 'outgoing', timestamp: Date.now() },
      ])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Не удалось отправить сообщение')
    } finally {
      setIsSending(false)
    }
  }

  const handleResetChat = () => {
    setChatId(null)
    setMessages([])
    setError(null)
    seenIds.current.clear()
  }

  const peerLabel = chatId ? chatId.replace('@c.us', '') : ''

  return (
    <div className="flex h-svh justify-center bg-slate-100">
      <div className="flex h-full w-full max-w-2xl flex-col bg-slate-50 sm:border-x sm:border-slate-200">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
            {chatId ? peerLabel.slice(-2) : 'MAX'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {chatId ? peerLabel : 'MAX чат'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {chatId ? 'Диалог' : 'Начните новый чат'}
            </p>
          </div>
          {chatId && (
            <button
              type="button"
              onClick={handleResetChat}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100"
            >
              Новый чат
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            Выйти
          </button>
        </header>

        {!chatId ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <form
              onSubmit={handleCreateChat}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-lg font-semibold text-slate-900">Новый чат</h2>
              <p className="mt-1 text-sm text-slate-500">Введите номер получателя в MAX</p>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 999 123-45-67"
                inputMode="tel"
                autoComplete="off"
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={!isPhoneValid}
                className="mt-4 w-full cursor-pointer rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Создать чат
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-sm text-slate-400">
                  Нет сообщений. Напишите первым.
                </p>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={`${message.id}-${message.timestamp}`} message={message} />
                ))
              )}
              <div ref={bottomRef} />
            </div>
            {error && (
              <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <ChatComposer disabled={isSending} onSend={handleSend} />
          </>
        )}
      </div>
    </div>
  )
}
