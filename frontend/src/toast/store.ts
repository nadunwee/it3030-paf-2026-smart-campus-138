export type ToastVariant = 'success' | 'error'

export type ToastItem = {
  id: number
  variant: ToastVariant
  message: string
}

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getToasts(): ToastItem[] {
  return items
}

export function getServerSnapshot(): ToastItem[] {
  return []
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id)
  notify()
}

function push(variant: ToastVariant, message: string) {
  const id = nextId++
  items = [...items, { id, variant, message }]
  notify()
  const ms = variant === 'error' ? 6000 : 4000
  if (typeof window !== 'undefined') {
    window.setTimeout(() => dismissToast(id), ms)
  }
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
}
