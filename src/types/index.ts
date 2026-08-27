export interface Profile {
  id: string
  userId: string
  displayName: string
  role: 'worker' | 'customer'
  country: string
  city: string
  latitude: number | null
  longitude: number | null
  phone: string
  bio: string
  skills: string
  avatarUrl: string
  isOnboarded: string // SQLite boolean "0"/"1"
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  customerId: string
  title: string
  description: string
  category: string
  city: string
  latitude: number | null
  longitude: number | null
  budget: number
  currency: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  acceptedBidId: string | null
  workerId: string | null
  paymentMethod: 'cash' | 'wallet'
  workerCompletedAt: string | null // worker marked the work as finished, awaiting customer confirmation
  completedAt: string | null // customer confirmed — job is officially done
  createdAt: string
  updatedAt: string
  // joined
  customerName?: string
  customerAvatar?: string
  bidCount?: number
}

export interface Bid {
  id: string
  jobId: string
  workerId: string
  amount: number
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  // joined
  workerName?: string
  workerAvatar?: string
  workerSkills?: string
  jobTitle?: string
  jobStatus?: 'open' | 'in_progress' | 'completed' | 'cancelled'
  jobWorkerCompletedAt?: string | null
}

export interface Message {
  id: string
  jobId: string
  senderId: string
  receiverId: string
  content: string
  isRead: string // SQLite boolean "0"/"1"
  createdAt: string
  // joined
  senderName?: string
  senderAvatar?: string
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  walletId: string
  userId: string
  amount: number
  type: 'credit' | 'debit'
  reference: string
  description: string
  jobId: string | null
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: 'free_trial' | 'paid' | 'expired'
  startedAt: string
  expiresAt: string
  country: string
  amountPaid: number
  currency: string
  createdAt: string
}

export interface Review {
  id: string
  jobId: string
  reviewerId: string
  reviewedUserId: string
  rating: number
  comment: string
  createdAt: string
}

export type Currency = 'NGN' | 'USD'

// Account-activity notifications — bid updates, price change requests, job completion
// handshake — shown via the bell icon in the header for both workers and customers.
export interface Notification {
  id: string
  userId: string // who this notification is for
  title: string
  body: string
  link: string // route to navigate to when clicked, e.g. "/jobs/abc123"
  read: string // SQLite boolean "0"/"1"
  createdAt: string
}

// Private negotiation thread scoped to a single bid — separate from the main
// post-acceptance job chat, so each bidder's discussion with the customer stays
// between just the two of them, even though bid amounts themselves are visible to all.
export interface BidMessage {
  id: string
  jobId: string
  bidId: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
}

// A worker's request to change the agreed price after their bid was accepted (the job
// turned out to need more or less work than the original bid covered). The customer
// approves or declines; approving updates the job's budget to the new amount.
export interface PriceRequest {
  id: string
  jobId: string
  bidId: string
  requestedBy: string // workerId
  previousAmount: number
  requestedAmount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  resolvedAt: string | null
}
