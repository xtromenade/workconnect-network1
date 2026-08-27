import { Popover, PopoverContent, PopoverTrigger } from '@blinkdotnew/ui'
import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications'
import type { Notification } from '@/types'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications(user?.id)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unread = notifications.filter((n) => n.read === '0')

  const handleClick = (n: Notification) => {
    if (n.read === '0' && user) markRead.mutate({ id: n.id, userId: user.id })
    // n.link is a fully dynamic, data-driven path — TanStack Router's typed <Link>
    // requires a statically-known route, so this goes through navigate() instead.
    navigate({ to: n.link as never })
  }

  const handleMarkAll = () => {
    if (user && unread.length > 0) {
      markAllRead.mutate({ userId: user.id, unreadIds: unread.map((n) => n.id) })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <p className="text-sm font-semibold">Activity</p>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No activity yet — bids, price requests, and job updates will show up here.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`block w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                  n.read === '0' ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {n.read === '0' && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                  <div className={n.read === '0' ? '' : 'pl-3.5'}>
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
