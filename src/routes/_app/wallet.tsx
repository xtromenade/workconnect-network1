import { createFileRoute } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useWallet, useTransactions } from '@/hooks/useWallet'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, Badge } from '@blinkdotnew/ui'
import { Wallet, Loader2, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'

export const Route = createFileRoute('/_app/wallet')({
  component: WalletPage,
})

function WalletPage() {
  return (
    <div className="p-6 lg:p-8">
      <BlinkClientBoundary
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <WalletContent />
      </BlinkClientBoundary>
    </div>
  )
}

function WalletContent() {
  const { user } = useAuth()
  const { wallet, isLoading: walletLoading, createWallet } = useWallet(user?.id)
  const { data: transactions, isLoading: txLoading } = useTransactions(wallet?.id)
  const { data: subscription, isLoading: subLoading } = useSubscription(user?.id)

  const txList = Array.isArray(transactions) ? transactions : []

  if (walletLoading || subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const trialExpiry = subscription?.expiresAt
    ? new Date(subscription.expiresAt)
    : null
  const isTrialActive = trialExpiry ? trialExpiry > new Date() : false
  const daysLeft = trialExpiry
    ? Math.max(0, Math.ceil((trialExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const pricingInfo = subscription
    ? subscription.currency === 'NGN'
      ? { monthly: '₦3,000–5,000', currency: 'NGN' }
      : { monthly: '$5–7', currency: 'USD' }
    : { monthly: 'Varies', currency: 'NGN' }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Your balance, transactions, and subscription.</p>
      </div>

      {/* Balance card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-primary-foreground/70 mb-2">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Your Balance</span>
          </div>
          {wallet ? (
            <p className="text-3xl font-bold tracking-tight">
              {wallet.currency} {wallet.balance.toLocaleString()}
            </p>
          ) : (
            <p className="text-lg font-medium">No wallet yet</p>
          )}
        </CardContent>
      </Card>

      {/* Subscription card */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Subscription</h3>
            <Badge
              variant={isTrialActive ? 'default' : 'outline'}
            >
              {subscription?.plan === 'free_trial'
                ? isTrialActive
                  ? 'Free Trial'
                  : 'Expired'
                : subscription?.plan || 'No plan'}
            </Badge>
          </div>
          {subscription && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Started:{' '}
                  {new Date(subscription.startedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {isTrialActive
                    ? `Trial ends: ${trialExpiry!.toLocaleDateString()} (${daysLeft} days left)`
                    : `Expired: ${trialExpiry!.toLocaleDateString()}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span>
                  After trial: {pricingInfo.monthly}/month
                </span>
              </div>
            </>
          )}
          {!subscription && (
            <p className="text-sm text-muted-foreground">
              No active subscription.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <div>
        <h2 className="font-semibold text-base mb-3">Recent Transactions</h2>
        {txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : txList.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {txList.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                        tx.type === 'credit'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()} · {tx.reference}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold shrink-0 ${
                      tx.type === 'credit' ? 'text-accent' : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {tx.amount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
