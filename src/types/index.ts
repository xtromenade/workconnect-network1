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
