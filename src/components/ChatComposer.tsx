import { useState } from 'react'
import type { SubmitEvent } from 'react'

type Props = {
  disabled?: boolean
  onSend: (text: string) => void
}

export function ChatComposer({ disabled, onSend }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
    >
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Сообщение"
        autoComplete="off"
        className="flex-1 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="cursor-pointer rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Отправить
      </button>
    </form>
  )
}
