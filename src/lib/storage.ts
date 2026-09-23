import type { Credentials } from '../types'
import { DEFAULT_API_URL } from './greenapi'

const STORAGE_KEY = 'green-api-max:credentials'
const STORAGE_VERSION = 1

type StoredCredentials = Credentials & { v: number }

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredCredentials>
    if (parsed.v !== STORAGE_VERSION) return null
    if (!parsed.idInstance || !parsed.apiTokenInstance) return null
    return {
      apiUrl: parsed.apiUrl || DEFAULT_API_URL,
      idInstance: parsed.idInstance,
      apiTokenInstance: parsed.apiTokenInstance,
    }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials): void {
  const payload: StoredCredentials = { v: STORAGE_VERSION, ...credentials }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY)
}
