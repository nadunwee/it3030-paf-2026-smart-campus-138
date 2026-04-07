import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/app/components/ui/utils'
import {
  dismissToast,
  getServerSnapshot,
  getToasts,
  subscribe,
  type ToastItem,
} from '@/toast/store'

function ToastRow({ item }: { item: ToastItem }) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
        item.variant === 'success' &&
          'border-[#a3bfa8]/50 bg-[#cde7b0]/40 text-[#59594a]',
        item.variant === 'error' &&
          'border-destructive/40 bg-destructive/10 text-destructive',
      )}
    >
      <p className="flex-1 leading-relaxed">{item.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function AppToaster() {
  const list = useSyncExternalStore(subscribe, getToasts, getServerSnapshot)

  if (list.length === 0) return null

  return (
    <div
      className="fixed top-4 left-1/2 z-[200] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {list.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>
  )
}
