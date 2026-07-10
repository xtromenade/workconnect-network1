import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'workconnec-platform-bqlcnisu',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_9s0sD_9f5x_qd55P4O83PejVBnN-osbA',
  authRequired: false,
  auth: { mode: 'headless' },
})
