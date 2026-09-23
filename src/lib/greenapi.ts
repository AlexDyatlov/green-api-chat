import ky, { HTTPError, NetworkError, TimeoutError } from 'ky'
import type { Credentials, GreenApiNotification } from '../types'

export const DEFAULT_API_URL = 'https://api.green-api.com'

const REQUEST_TIMEOUT_MS = 60_000

export class GreenApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

const client = ky.create({ timeout: REQUEST_TIMEOUT_MS })

function buildUrl(credentials: Credentials, method: string, suffix = ''): string {
  const base = credentials.apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${suffix}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

async function parseHttpError(error: HTTPError): Promise<GreenApiError> {
  const status = error.response.status
  const fallback = `Ошибка ${status}`
  try {
    const data = (await error.response.json()) as { message?: unknown; code?: unknown }
    const message =
      typeof data.message === 'string' && data.message.length > 0 ? data.message : fallback
    const code = typeof data.code === 'string' && data.code.length > 0 ? data.code : null
    return new GreenApiError(code ? `${message} (${code})` : message, status)
  } catch {
    return new GreenApiError(fallback, status)
  }
}

async function toGreenApiError(error: unknown): Promise<GreenApiError> {
  if (error instanceof HTTPError) {
    return parseHttpError(error)
  }
  if (error instanceof TimeoutError) {
    return new GreenApiError('Превышено время ожидания ответа')
  }
  if (error instanceof NetworkError) {
    return new GreenApiError('Сеть недоступна')
  }
  if (error instanceof Error) {
    return new GreenApiError(error.message)
  }
  return new GreenApiError('Неизвестная ошибка')
}

export async function getStateInstance(credentials: Credentials): Promise<string> {
  try {
    const data = await client
      .get(buildUrl(credentials, 'getStateInstance'))
      .json<{ stateInstance?: string }>()
    return data.stateInstance ?? 'unknown'
  } catch (error) {
    throw await toGreenApiError(error)
  }
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  try {
    const data = await client
      .post(buildUrl(credentials, 'sendMessage'), { json: { chatId, message } })
      .json<{ idMessage?: string }>()
    return data.idMessage ?? String(Date.now())
  } catch (error) {
    throw await toGreenApiError(error)
  }
}

export async function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<GreenApiNotification | null> {
  try {
    const response = await client.get(buildUrl(credentials, 'receiveNotification'), { signal })
    if (response.status === 204) return null
    const text = await response.text()
    if (!text || text === 'null') return null
    const notification = JSON.parse(text) as Partial<GreenApiNotification>
    if (typeof notification.receiptId !== 'number') {
      // Уведомление без receiptId нельзя удалить — неконсистентный ответ API.
      console.warn('Получено уведомление без receiptId, пропускаем', notification)
      return null
    }
    if (!notification.body) {
      // Тело кривое, но receiptId есть — удалим, чтобы не блокировать очередь.
      console.warn('Получено уведомление без body, удаляем из очереди', notification)
      return { receiptId: notification.receiptId }
    }
    return notification as GreenApiNotification
  } catch (error) {
    if (isAbortError(error)) throw error
    throw await toGreenApiError(error)
  }
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  try {
    await client.delete(buildUrl(credentials, 'deleteNotification', `/${receiptId}`))
  } catch (error) {
    throw await toGreenApiError(error)
  }
}
