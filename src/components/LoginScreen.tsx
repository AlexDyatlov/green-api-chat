import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { DEFAULT_API_URL, getStateInstance } from '../lib/greenapi'
import type { Credentials } from '../types'

type Props = {
  onConnect: (credentials: Credentials) => void
}

export function LoginScreen({ onConnect }: Props) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSubmitDisabled = isLoading || !idInstance.trim() || !apiTokenInstance.trim()

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)
    const credentials: Credentials = {
      apiUrl: (apiUrl.trim() || DEFAULT_API_URL).replace(/\/+$/, ''),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    try {
      const state = await getStateInstance(credentials)
      if (state !== 'authorized') {
        throw new Error(`Инстанс не авторизован (stateInstance: ${state})`)
      }
      onConnect(credentials)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось подключиться')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-semibold text-slate-900">MAX чат</h1>
          <p className="mt-1 text-sm text-slate-500">Введите данные инстанса GREEN-API</p>
        </div>

        <label htmlFor="idInstance" className="block text-sm font-medium text-slate-700">
          idInstance
        </label>
        <input
          id="idInstance"
          value={idInstance}
          onChange={(event) => setIdInstance(event.target.value)}
          required
          autoComplete="off"
          className="mt-1 mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />

        <label htmlFor="apiTokenInstance" className="block text-sm font-medium text-slate-700">
          apiTokenInstance
        </label>
        <input
          id="apiTokenInstance"
          type="password"
          value={apiTokenInstance}
          onChange={(event) => setApiTokenInstance(event.target.value)}
          required
          autoComplete="off"
          className="mt-1 mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />

        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="mb-3 cursor-pointer text-xs font-medium text-brand hover:underline"
        >
          {showAdvanced ? 'Скрыть дополнительные настройки' : 'Дополнительные настройки'}
        </button>

        {showAdvanced && (
          <div>
            <label htmlFor="apiUrl" className="block text-sm font-medium text-slate-700">
              apiUrl
            </label>
            <input
              id="apiUrl"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              className="mt-1 mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="mt-4 w-full cursor-pointer rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Подключение…' : 'Подключиться'}
        </button>
      </form>
    </div>
  )
}
