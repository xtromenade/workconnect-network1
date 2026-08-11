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
npm run dev
```

## Deploying

Same split as before: this frontend deploys to Netlify (config already in `netlify.toml`),
the backend deploys to Render (config in `../artisanlink/render.yaml`). See the main
`artisanlink/README.md` for the full deploy walkthrough, including the free-tier SQLite
caveat and how to add real Paystack/Stripe keys when you're ready to charge real money —
right now checkout runs in simulated mode.

One thing specific to this frontend: after deploying, set the `VITE_API_URL` environment
variable in Netlify's dashboard to your deployed backend's URL, then trigger a rebuild (Vite
bakes env vars in at build time, so this needs a fresh build, not just a page refresh).

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
