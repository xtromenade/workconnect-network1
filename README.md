# WorkConnect

The WorkConnect UI, now running on a real backend instead of a hosted BaaS. This started as
a [Blink.new](https://blink.new)-generated prototype (job marketplace UI, wired to Blink's
managed auth/database/realtime service). This version keeps the exact same UI and pages, but
replaces the Blink SDK underneath with a real Node/Express + Socket.io + SQLite backend
(the `artisanlink` project alongside this one) — adding real-time chat, WebRTC voice/video
calls, live location tracking, and the specific trial/pricing rules that Blink's generic
backend didn't have:

- **Workers**: 3 months free, no card required. After that — ₦5,000/year (Nigeria) or
  $7/year (everywhere else).
- **Customers**: 6 months free, no card required. After that — ₦3,000/year (Nigeria) or
  $5/year (everywhere else).

## What changed under the hood

Everything visual is untouched — same pages, same components, same `@blinkdotnew/ui` design
system. The only things that changed are the ~9 hook files that talk to a backend
(`src/hooks/*`), plus three new pieces:

- **`src/lib/apiTable.ts`** — a drop-in replacement for `blink.db.table<T>()`, with the exact
  same `list/get/create/update` shape. Most hooks (`useProfile`, `useJobs`, `useBids`,
  `useWallet`, `useReviews`, `useMessages`) needed only their import changed — the query logic
  itself is untouched.
- **`src/hooks/useAuth.ts`** and **`src/hooks/useSubscription.ts`** — rewritten to hit the real
  backend's auth and the real trial/pricing logic (`buildInitialSubscription` /
  `resolveStatus` in the backend), rather than a generic table.
- **`src/hooks/useRealtimeChat.ts`** — rewritten to use Socket.io's `room:join` /
  `room:message` / `room:presence` events instead of Blink's realtime channel. Same public
  interface, so the chat UI didn't need to change.
- **`src/context/CallContext.tsx`** + **`src/components/CallOverlay.tsx`** — brand new. The
  original UI had "Voice Call" / "Video Call" buttons that opened a "coming soon" modal; these
  now do real WebRTC calls, signaled over the same socket connection as chat.
- **`src/hooks/useLiveLocation.ts`**, **`src/components/LiveMap.tsx`**,
  **`src/components/GoLiveCard.tsx`** — brand new. Workers can go online from the dashboard and
  broadcast their live location; customers see it on an embedded map in the chat thread with
  that worker.

The backend's role/data model uses `artisan` / `customer` internally (matching pricing logic
named that way); this frontend uses `worker` / `customer`. The mapping happens once, in
`PATCH /api/users/me/finalize-role`.

## Running it locally

You need both the backend (`artisanlink/backend`) and this frontend running.

```bash
# Terminal 1 — backend
cd ../artisanlink/backend
npm install
cp .env.example .env
npm start          # http://localhost:4000

# Terminal 2 — this frontend
cd workconnect-network1
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
# Optional — only needed to test the Google sign-in button locally:
# echo "VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" >> .env
npm run dev
```

Email verification works out of the box in dev mode — signup logs the verification link to
the backend terminal (no `RESEND_API_KEY` needed to test it).

## Deploying

Same split as before: this frontend deploys to Netlify (config already in `netlify.toml`),
the backend deploys to Render (config in `../artisanlink/render.yaml`). See the main
`artisanlink/README.md` for the full deploy walkthrough, including the free-tier SQLite
caveat and how to add real Paystack/Stripe keys when you're ready to charge real money —
right now checkout runs in simulated mode.

One thing specific to this frontend: after deploying, set the `VITE_API_URL` environment
variable in Netlify's dashboard to your deployed backend's URL, then trigger a rebuild (Vite
bakes env vars in at build time, so this needs a fresh build, not just a page refresh).

## Completed jobs actually close out for the worker

Fixed a bug where the dashboard's "Active Jobs" count and list only checked whether a
worker's *bid* was accepted — not whether the *job itself* was still in progress. Since a
bid's status never changes back after acceptance, a job the customer had already confirmed
complete weeks ago was still counting as "active" forever.

Now `useMyBids` joins in the underlying job's status, so:
- **Active Jobs** only counts bids where the job is still `in_progress` (and shows "Awaiting
  confirmation" instead of "Active" once the worker's marked it done but the customer hasn't
  confirmed yet).
- **Completed Jobs** is a new, separate count — once the customer confirms, the job moves out
  of the active list and into its own "Completed Jobs" section, so the count is still
  browsable, not just a number.
- Message history for a completed job stays visible to the customer too (previously it
  vanished the moment a job closed) — only the *active-jobs* view should hide completed work,
  not the conversation history.

## Bid counts at a glance, and account activity notifications

- **Bid counts on posted job cards** — a customer's "Your Recent Jobs" card on the dashboard
  now shows how many bids each job has received directly on the card (e.g. "3 bids"), with a
  highlighted border on open jobs that have pending bids — no need to open each job to check.
  `useMyJobs` enriches each job with a live count via the `bids` table.
- **Notification bell** — a bell icon with an unread badge lives in the sidebar header,
  visible on every page for both workers and customers. Clicking it opens recent activity
  with click-to-navigate and a "mark all read" option. It's wired into every meaningful
  lifecycle event: new bid submitted, bid accepted/rejected, worker marks a job complete,
  customer confirms completion, price change requested, and price change approved/declined.
  Notifications push live over the socket connection the moment they're created (not just on
  page refresh) — the backend's generic records API emits a `notification:new` event to the
  target user's room whenever a row is created in the `notifications` table specifically.

## Negotiating during bidding, and price changes after acceptance

Two more pieces on the job detail page:

- **Per-bid negotiation chat** — each bid on a job has its own private "Discuss this bid"
  thread, expandable inline on the bid card. Only the customer and that specific bidder can
  see and use it — other workers who've also bid on the same job (bid amounts are visible to
  everyone, matching how the marketplace already worked) don't see this conversation. Built
  the same way the main post-acceptance chat works: Socket.io for live delivery, REST
  (`bidMessages` table) for persistence — just scoped to a `bid-<id>` room instead of
  `job-<id>`, so it doesn't interfere with the main chat.
- **Price change requests** — once a bid's accepted, the worker can request a different
  amount (found extra work, or less than expected) with an optional reason. The customer sees
  it as an approve/decline card; approving updates the job's actual budget to the new amount
  immediately, declining leaves it untouched. Only one request can be pending at a time per
  job — the "Request Price Change" button doesn't reappear for the worker until the current
  one's resolved. Full history is kept (`priceRequests` table), even after resolution.

I tested both directly against the backend before shipping: a full negotiation exchange over
the isolated `bid-<id>` socket room, then a bid accepted at ₦3,000 → worker requests ₦4,500
with a reason → customer approves → job budget updates to ₦4,500, then a second request for
₦6,000 that gets declined and correctly leaves the budget at ₦4,500.

## Track record at the point of bidding

On the job detail page, each side sees the other's history before committing:

- **Customer, on each bid**: the worker's average rating (and how many reviews it's based
  on), how many bids they've had accepted, how many of those jobs actually got completed, and
  a completion rate (`completed ÷ accepted`, color-coded — green ≥80%, amber ≥50%, red below
  that). A worker who's never had a bid accepted just shows no completion rate yet, rather
  than a misleading 0%.
- **Worker, on the job itself**: the customer's total spend across their completed jobs and
  how many times they've hired someone (accepted a bid) — so a worker can gauge whether a
  customer follows through before spending time on a bid.

Both are computed live from the `jobs`, `bids`, and `reviews` tables (`src/hooks/useStats.ts`)
— no new backend endpoints needed, since the generic records API already supports the
`where` filters these need.

## Job completion handshake

A two-step confirmation on the job detail page, once a bid's been accepted and the job is
`in_progress`:

1. **Worker clicks "Mark Job Complete"** — the job stays `in_progress`, but now shows
   `workerCompletedAt` set, so the customer sees "The worker marked this job complete."
2. **Customer clicks "Confirm Completed"** — this is what actually closes the job
   (`status: 'completed'`). If the job's payment method is `wallet`, this also settles the
   payment: debits the customer's wallet, credits the worker's (creating the worker's wallet
   if they don't have one yet), and logs both sides as transactions. If the customer's wallet
   balance is too low, the job still completes — you get a toast saying to settle payment
   outside the app (e.g. cash) rather than a hard failure.

Once completed, the customer gets an inline star-rating + comment box to review the worker
(one review per job — hidden after they've submitted).

Neither button appears to the wrong party — the worker only sees "Mark Complete" if their bid
was actually accepted for that job, and the customer only sees "Confirm" if it's their job.

## Account type switching, email verification, Google sign-in

Three more pieces since the initial integration:

- **Switch between worker and customer anytime** — from Settings, not just at onboarding.
  Each role keeps its own independent subscription (trial or paid), so switching back and
  forth never resets a trial you've already started, and switching to a role for the first
  time starts a fresh one. Backend: `PATCH /api/users/me/switch-role`.
- **Email verification** — every signup gets a verification link (`GET
  /api/auth/verify-email?token=...`, landing on the new `/verify-email` page). Without a
  `RESEND_API_KEY` set, the email is logged to the backend's console instead of actually
  sent — enough to test the full flow locally by copying the link from the terminal. Add a
  free [Resend](https://resend.com) API key to send real emails. Settings shows a "verify
  your email" banner with a resend button until confirmed; nothing else is blocked on it.
- **Google sign-in** — a "Continue with Google" button appears on the login page once
  `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend, same value) are set.
  Leave them unset and the button just doesn't render — email/password auth is unaffected.
  Get credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  (OAuth client type: "Web application"; add your site's URL to Authorized JavaScript
  origins). Google accounts are automatically marked email-verified, since Google already
  confirmed ownership.

## Known limitations / next steps

- **Calls need a TURN server for reliability in production.** The current setup uses a public
  STUN server (fine for most direct connections), but calls between people on strict
  corporate/mobile NATs may fail to connect. Add a TURN server in
  `src/context/CallContext.tsx` (`ICE_SERVERS`) before relying on this for real users.
- **The generic `/api/records` API has no per-owner permission checks** — any authenticated
  user can read/write any record in the allow-listed tables (`profiles`, `jobs`, `bids`,
  `messages`, `wallets`, `transactions`, `reviews`). This mirrors how the original
  Blink-backed prototype behaved (client-trusted), which is fine for a prototype but should
  get proper authorization rules added before handling real users' data.
- **Payments are simulated** until real Paystack/Stripe keys are added to the backend.
- **Email verification doesn't block anything yet** — people can use the app fully before
  verifying. That's a deliberate default (harsh enough to annoy real users, and there's no
  guarantee a real email provider is configured), but if you want it enforced, the obvious
  place is `useAuth.ts` / route guards in `_app.tsx`: check `user.emailVerified` and redirect
  unverified users to a "please verify" screen for whichever actions you want gated.
- **The Google sign-in button needs matching origins configured in Google Cloud Console.**
  If it renders but clicking it errors out, the most common cause is the site's URL not being
  added to "Authorized JavaScript origins" for your OAuth client — add both your local dev
  URL (`http://localhost:5173`) and your deployed Netlify URL there.
- **Verification links point at `CLIENT_URL`** (a backend env var) — if that's stale after
  you change domains, verification emails will link to the wrong place. Update it in Render's
  dashboard whenever your frontend URL changes.
