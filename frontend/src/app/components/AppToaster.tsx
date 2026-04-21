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
        'pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
        item.variant === 'success' &&
          'border-[#bdd4ea] bg-[#eef5fc] text-[#1f4f7f]',
        item.variant === 'error' &&
          'border-[#e7c1ba] bg-[#f8ebe8] text-[#9f4336]',
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
