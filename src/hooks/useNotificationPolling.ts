import { useEffect, useRef } from 'react'
import { GreenApiError, deleteNotification, receiveNotification } from '../lib/greenapi'
import type { Credentials, GreenApiNotification } from '../types'

const IDLE_DELAY_MS = 700
const ERROR_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useNotificationPolling(
  credentials: Credentials | null,
  onNotification: (notification: GreenApiNotification) => void,
  enabled: boolean,
  onError?: (error: Error) => void,
): void {
  const onNotificationRef = useRef(onNotification)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!enabled || !credentials) return

    const controller = new AbortController()
    let stopped = false

    const loop = async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(credentials, controller.signal)
          if (stopped) break
          if (notification) {
            try {
              onNotificationRef.current(notification)
            } catch (handlerError) {
              console.error('Обработчик уведомления упал', handlerError)
            }
            await deleteNotification(credentials, notification.receiptId)
          } else {
            await sleep(IDLE_DELAY_MS)
          }
        } catch (error) {
          if (stopped || (error as Error).name === 'AbortError') break
          if (error instanceof GreenApiError && error.status === 401) {
            onErrorRef.current?.(error)
            break
          }
          await sleep(ERROR_DELAY_MS)
        }
      }
    }

    void loop()

    return () => {
      stopped = true
      controller.abort()
    }
  }, [credentials, enabled])
}
