// POST /api/feedback: saves one feedback row in the Notion database
// "Volcano Explorer feedback". Runs on the server only, so NOTION_TOKEN never
// reaches the browser (it must NOT have a VITE_ prefix). Answers are anonymous:
// no name or email is collected.
//
// Env: NOTION_TOKEN, NOTION_FEEDBACK_DB_ID
// Optional email notification (Resend): RESEND_API_KEY, FEEDBACK_NOTIFY_TO and,
// once you verify a domain, FEEDBACK_NOTIFY_FROM. Without the first two, no
// email is sent. A failed email never fails the request: the row is already
// saved in Notion by then.
// Column names and option lists must match the Notion database and
// src/components/FeedbackDialog.jsx exactly (keep them in sync).

const NOTION_VERSION = '2022-06-28' // works with a single-data-source database
const LIKED = [
  'The 3D globe', 'How it looks', 'Moving between volcanoes', 'Comparing volcanoes',
  'Eruption data', 'Something else',
]
const WANTS = [
  'More data or volcanoes', 'Search and finding things', 'Understanding what I see',
  'Phone experience', 'Speed', 'Something else',
]
const FEATURES = ['Keyboard', 'Zoom or reflow', 'Screen reader', 'Reduced motion', 'Other']
const HELPFUL = ['Yes', 'Somewhat', 'No', 'Did not use them']
const MAX_TEXT = 1000 // Notion allows 2000 per text block; keep well under
const MAX_OTHER = 200 // the short "Something else" fields

// Keep tab / newline / carriage return, drop other control characters.
const stripControl = (s) =>
  [...s].filter((ch) => {
    const c = ch.charCodeAt(0)
    return c >= 32 || c === 9 || c === 10 || c === 13
  }).join('')

// Trim, drop control characters, cap the length.
const clean = (v, max = MAX_TEXT) => stripControl(String(v ?? '')).trim().slice(0, max)

// Keep only known values, once each.
const pick = (list, value) =>
  Array.isArray(value) ? [...new Set(value.filter((v) => list.includes(v)))] : []

const text = (s) => ({ rich_text: [{ text: { content: s } }] })

const list = (a) => (a.length ? a.join(', ') : '-')

// Plain-text email to the owner. Only the rating goes in the subject; everything
// else is in the body, as plain text (no HTML, so nothing to inject).
async function notifyByEmail(d) {
  const { RESEND_API_KEY, FEEDBACK_NOTIFY_TO, FEEDBACK_NOTIFY_FROM } = process.env
  if (!RESEND_API_KEY || !FEEDBACK_NOTIFY_TO) return
  const lines = [
    `Rating: ${d.rating}/5`,
    `Enjoys most: ${list(d.liked)}${d.likedOther ? ` (other: ${d.likedOther})` : ''}`,
    `Improve first: ${list(d.wants)}${d.wantsOther ? ` (other: ${d.wantsOther})` : ''}`,
    `Accessibility features: ${list(d.features)}`,
    `Did they help: ${d.helpful ?? '-'}`,
    `Viewport: ${d.viewport ? `${d.viewport}px` : '-'}`,
  ]
  if (d.url) lines.push('', `In Notion: ${d.url}`)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'volcano-explorer-feedback',
      },
      body: JSON.stringify({
        from: FEEDBACK_NOTIFY_FROM || 'Volcano Explorer <onboarding@resend.dev>',
        to: FEEDBACK_NOTIFY_TO,
        subject: `New Volcano Explorer feedback: ${d.rating}/5`,
        text: lines.join('\n'),
      }),
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) {
      // Status and Resend's error name only, never the feedback text.
      const err = await r.json().catch(() => ({}))
      console.error('feedback: email error', r.status, err.name)
    }
  } catch (e) {
    console.error('feedback: email request failed', e.name)
  }
}

function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return false
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  // Only our own pages can post (blocks casual cross-site abuse).
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' })

  const { NOTION_TOKEN, NOTION_FEEDBACK_DB_ID } = process.env
  if (!NOTION_TOKEN || !NOTION_FEEDBACK_DB_ID) {
    const missing = ['NOTION_TOKEN', 'NOTION_FEEDBACK_DB_ID'].filter((k) => !process.env[k])
    console.error('feedback: missing env var(s):', missing.join(', '))
    return res.status(500).json({ error: 'server_misconfigured' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = null }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'invalid_body' })

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (clean(body.website)) return res.status(200).json({ ok: true })

  const rating = body.rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'invalid_rating' })
  }

  const liked = pick(LIKED, body.liked)
  const wants = pick(WANTS, body.wants)
  const features = pick(FEATURES, body.features)
  const helpful = HELPFUL.includes(body.helpful) ? body.helpful : null
  // "Something else" text only counts if that option is actually selected.
  const likedOther = liked.includes('Something else') ? clean(body.likedOther, MAX_OTHER) : ''
  const wantsOther = wants.includes('Something else') ? clean(body.wantsOther, MAX_OTHER) : ''

  const viewport = Number.isInteger(body.viewport) && body.viewport > 0 && body.viewport < 10000
    ? body.viewport
    : null

  const gist = (wantsOther || wants.join(', ')).replace(/\s+/g, ' ').slice(0, 60)
  const title = gist ? `${rating}/5 · ${gist}` : `${rating}/5`

  const properties = {
    Name: { title: [{ text: { content: title } }] },
    Rating: { number: rating },
    'Liked most': { multi_select: liked.map((name) => ({ name })) },
    'Wants improved': { multi_select: wants.map((name) => ({ name })) },
    'A11y features used': { multi_select: features.map((name) => ({ name })) },
    Status: { select: { name: 'New' } },
  }
  if (likedOther) properties['Liked: other'] = text(likedOther)
  if (wantsOther) properties['Wants: other'] = text(wantsOther)
  if (helpful) properties['A11y helpful'] = { select: { name: helpful } }
  if (viewport) properties.Context = text(`Viewport ${viewport}px`)

  try {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: NOTION_FEEDBACK_DB_ID }, properties }),
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) {
      // Log only the status and Notion's error code, never the submitted text.
      const err = await r.json().catch(() => ({}))
      console.error('feedback: notion error', r.status, err.code)
      return res.status(502).json({ error: 'upstream_error' })
    }
    const page = await r.json().catch(() => ({}))
    await notifyByEmail({ rating, liked, likedOther, wants, wantsOther, features, helpful, viewport, url: page.url })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('feedback: request failed', e.name)
    return res.status(502).json({ error: 'upstream_error' })
  }
}
