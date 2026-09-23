export type Credentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageDirection = 'incoming' | 'outgoing'

export type ChatMessage = {
  id: string
  text: string
  direction: MessageDirection
  timestamp: number
}

export type GreenApiNotificationBody = {
  typeWebhook?: string
  idMessage?: string
  timestamp?: number
  senderData?: {
    chatId?: string
    sender?: string
    senderName?: string
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: {
      textMessage?: string
    }
    extendedTextMessageData?: {
      text?: string
    }
  }
}

export type GreenApiNotification = {
  receiptId: number
  body?: GreenApiNotificationBody
}
