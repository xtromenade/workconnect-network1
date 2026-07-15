/**
 * WorkConnect collapsible sidebar — rendered by _app layout route.
 * Accepts real auth state (user name, email, avatar, signOut) from the layout.
 *
 * Expands to 15rem, collapses to 3rem (icon-only).
 * State is persisted to localStorage. Tooltips appear automatically when collapsed.
 *
 * NOTE: We bypass @blinkdotnew/ui <Sidebar> because it wraps all children in a
 * single overflow-y-auto div, making flex-1/shrink-0 on children no-ops.
 * This native flex-col implementation gives full layout control.
 */
import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  PanelLeft,
  Briefcase,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  to: string
  icon: ReactNode
  label: string
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
  { to: '/jobs', icon: <Search className="h-4 w-4" />, label: 'Browse Jobs' },
  { to: '/messages', icon: <MessageSquare className="h-4 w-4" />, label: 'Messages' },
  { to: '/wallet', icon: <Wallet className="h-4 w-4" />, label: 'Wallet' },
  { to: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
]

interface AppSidebarShellProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
  onSignOut?: () => void
  currentPath?: string
}

function NavItem({
  item,
  collapsed,
  active,
}: {
  item: NavItemDef
  collapsed: boolean
  active: boolean
}) {
  const link = (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
        active
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function AppSidebarShell({
  userName,
  userEmail,
  userAvatar,
  onSignOut,
  currentPath = '/',
}: AppSidebarShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'WC'

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-background border-r border-border overflow-hidden',
          'transition-[width] duration-200 ease-linear shrink-0',
          collapsed ? 'w-[3rem]' : 'w-[15rem]',
        )}
      >
        {/* ── Header: WorkConnect branding ──────────────── */}
        <div
          className={cn(
            'flex items-center gap-2 shrink-0 border-b border-border h-[52px] px-3',
            collapsed && 'justify-center px-2',
          )}
        >
          {!collapsed && (
            <>
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-semibold text-sm truncate">WorkConnect</span>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={toggle}
              >
                <PanelLeft
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    collapsed && 'rotate-180',
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Nav (only this section scrolls) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          {!collapsed && (
            <p className="px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </p>
          )}
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              active={currentPath.startsWith(item.to)}
            />
          ))}
        </div>

        {/* ── Footer: User + Sign out ───────────────────── */}
        <div
          className={cn(
            'shrink-0 border-t border-border',
            collapsed ? 'flex flex-col items-center gap-1 p-2' : 'p-3 space-y-1',
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors cursor-pointer">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {userName || 'User'}
                {userEmail ? ` · ${userEmail}` : ''}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium leading-tight truncate">
                  {userName || 'User'}
                </p>
                {userEmail && (
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-foreground"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
