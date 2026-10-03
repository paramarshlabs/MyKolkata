/* ==========================================================================
   "Something new in this chat", pushed over Supabase Realtime Broadcast so an
   open chat needn't keep asking. The nudge carries nothing — no message, no
   names — and the chat then fetches through its API, which checks that the
   reader is one of the two people in the match. So the channel can be a public
   one: anyone who knew a match id would learn only that a message was sent.
   ========================================================================== */

export const CHAT_EVENT = 'message'
export const chatTopic = (matchId: string) => `chat:${matchId}`

/* Server side, after a message is saved. Never throws: if Realtime is down,
   the other phone still finds the message on its next poll. */
export async function nudgeChat(matchId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return
  try {
    const res = await fetch(new URL('/realtime/v1/api/broadcast', url), {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic: chatTopic(matchId), event: CHAT_EVENT, payload: {}, private: false }] }),
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) console.warn('[chat] realtime nudge refused', res.status)
  } catch (err) {
    console.warn('[chat] realtime nudge failed', err instanceof Error ? err.message : err)
  }
}
