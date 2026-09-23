const NON_DIGITS = /\D/g

/**
 * Преобразует номер телефона в идентификатор чата (chatId) GREEN-API.
 * Оставляет только цифры и нормализует российский формат `8XXXXXXXXXX` → `7XXXXXXXXXX`.
 *
 * @example
 * toChatId('+7 999 123-45-67') // '79991234567@c.us'
 * toChatId('89991234567') // '79991234567@c.us'
 */
export function toChatId(phone: string): string {
  const digits = phone.replace(NON_DIGITS, '')
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  return `${normalized}@c.us`
}

/**
 * Извлекает цифровую часть chatId без суффикса (`@c.us`, `@g.us` и т.п.).
 *
 * @example
 * chatIdDigits('79991234567@c.us') // '79991234567'
 */
export function chatIdDigits(chatId: string): string {
  return (chatId.split('@')[0] ?? '').replace(NON_DIGITS, '')
}

/**
 * Сравнивает два chatId по цифровой части, игнорируя суффикс и форматирование.
 *
 * @example
 * isSameChat('79991234567@c.us', '79991234567') // true
 */
export function isSameChat(a: string, b: string): boolean {
  return chatIdDigits(a) === chatIdDigits(b) && chatIdDigits(a).length > 0
}
