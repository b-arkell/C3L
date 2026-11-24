// DEMO ONLY: pages for the guided demo (start page + one page per section).
// The real pages are shown inside an iframe, so nothing in them changes for the demo.

const IDENTITY = '/01-identity-users'
const DEMO_COURSE = 'course-101' // one of the stub courses in ../notifications/courses.ts

export const SECTIONS = {
    inbox: { title: 'Inbox', path: '/inbox' },
    preferences: { title: 'Preferences', path: '/preferences' },
    messages: { title: 'Messaging', path: '/messages' },
} as const

export type Section = keyof typeof SECTIONS

// Shared look: same dark / gold / light colours as the preferences page
function shell(base: string, title: string, body: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { --gold: #bd8f4d; --dark: #262626; --light: #ececea; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         background: var(--dark); color: var(--gold); font-family: system-ui, sans-serif; }
  header { display: flex; align-items: center; gap: 20px; background: var(--light);
           padding: 8px 20px; border-bottom: 2px solid #bbb; }
  header img { height: 36px; }
  header .tag { margin-left: auto; color: #555; font-size: 0.8rem; }
  .btn { background: var(--gold); color: var(--dark); border: 0; border-radius: 4px;
         padding: 10px 22px; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; }
  .btn:disabled { opacity: 0.5; cursor: default; }
  #status { font-size: 0.9rem; min-height: 1.2em; }
</style>
</head>
<body>
<header>
  <a href="${base}"><img src="${base}/assets/logo.png" alt="C3L"></a>
  <span class="tag">Demo mode</span>
</header>
${body}
</body>
</html>`
}

// Step 1: one button that registers a demo user, then the three section boxes
export function demoStartPage(base: string): string {
    const boxes = Object.entries(SECTIONS)
        .map(([key, s]) => `<a class="box" href="${base}/demo/${key}">${s.title}</a>`)
        .join('')

    return shell(
        base,
        'Notifications demo',
        `<style>
  main { flex: 1; display: flex; flex-direction: column; align-items: center;
         justify-content: center; gap: 18px; text-align: center; padding: 20px; }
  h1 { font-weight: 500; margin: 0; }
  .boxes { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
  .boxes[hidden] { display: none; }
  .box { width: 180px; height: 120px; display: flex; align-items: center; justify-content: center;
         border: 2px solid var(--gold); border-radius: 8px; color: var(--gold);
         font-size: 1.2rem; text-decoration: none; }
  .box:hover { background: var(--gold); color: var(--dark); }
</style>
<main>
  <h1>Notifications &amp; Messaging demo</h1>
  <div id="start">
    <p>Creates a demo account through Module 1, then walks through our pages.</p>
    <button id="register" class="btn" type="button">Register demo user</button>
  </div>
  <div id="sections" class="boxes" hidden>${boxes}</div>
  <p id="status"></p>
</main>
<script>
  const start = document.getElementById('start')
  const sections = document.getElementById('sections')
  const status = document.getElementById('status')
  const button = document.getElementById('register')

  function showSections() {
    start.hidden = true
    sections.hidden = false
  }

  // Already signed in (for example after a refresh)? Skip straight to the boxes.
  fetch('${IDENTITY}/api/me').then((res) => { if (res.ok) showSections() })

  // Register through Module 1. It signs the new user in by setting the login cookie.
  button.addEventListener('click', async () => {
    button.disabled = true
    status.textContent = 'Registering...'
    const res = await fetch('${IDENTITY}/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo Student',
        email: 'demo-' + Date.now() + '@c3l.test',
        password: 'demo-password-123',
      }),
    })
    if (res.ok) {
      status.textContent = 'Signed in as Demo Student.'
      showSections()
    } else {
      status.textContent = 'Registration failed (' + res.status + '). Is Module 1 running?'
      button.disabled = false
    }
  })
</script>`,
    )
}

// What the demo button does on each section page (runs in the browser)
const ACTIONS: Record<Section, { label: string; script: string }> = {
    inbox: {
        label: 'Send a grade event',
        script: `
      const res = await sendEvent('grade', 'Assignment graded', 'Your Assignment 2 grade is posted.')
      return res.ok ? 'Grade notification sent.' : 'Event failed (' + res.status + ').'`,
    },
    preferences: {
        label: `Send an announcement to ${DEMO_COURSE}`,
        script: `
      const before = await countNotifications()
      const res = await sendEvent('announcement', 'Class cancelled Friday', 'No lecture this Friday.')
      if (!res.ok) return 'Event failed (' + res.status + ').'
      const after = await countNotifications()
      return after > before
        ? 'Delivered: announcements are ON for ${DEMO_COURSE}. Check the bell.'
        : 'Not delivered: announcements are muted for ${DEMO_COURSE}.'`,
    },
    messages: {
        label: 'Get a message from a classmate',
        script: `
      const res = await fetch(BASE + '/api/demo/message', { method: 'POST' })
      return res.ok ? 'New message from demo-classmate.' : 'Message failed (' + res.status + ').'`,
    },
}

// Step 2: the real page in an iframe, with a demo bar on top
export function demoSectionPage(base: string, section: Section, userId: string): string {
    const current = SECTIONS[section]
    const action = ACTIONS[section]
    const tabs = Object.entries(SECTIONS)
        .map(
            ([key, s]) =>
                `<a href="${base}/demo/${key}"${key === section ? ' aria-current="page"' : ''}>${s.title}</a>`,
        )
        .join('')

    return shell(
        base,
        `Demo: ${current.title}`,
        `<style>
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 12px 20px;
         border-bottom: 1px solid #444; }
  .bar nav { display: flex; gap: 14px; }
  .bar nav a { color: var(--gold); }
  .bar nav a[aria-current] { font-weight: 700; text-decoration: none; }
  .bar .action { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  iframe { flex: 1; width: 100%; border: 0; background: #fff; }
</style>
<div class="bar">
  <nav><a href="${base}/demo">Demo home</a>${tabs}</nav>
  <div class="action">
    <span id="status"></span>
    <button id="action" class="btn" type="button">${action.label}</button>
  </div>
</div>
<iframe id="frame" src="${base}${current.path}" title="${current.title}"></iframe>
<script>
  const BASE = '${base}'
  const ME = ${JSON.stringify(userId).replace(/</g, '\\u003c')}
  const frame = document.getElementById('frame')
  const status = document.getElementById('status')
  const button = document.getElementById('action')

  // Same call another module would make: POST /api/notifications/events
  function sendEvent(eventType, subject, message) {
    return fetch(BASE + '/api/notifications/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        course_id: '${DEMO_COURSE}',
        user_ids: [ME],
        content: { subject, message },
      }),
    })
  }

  async function countNotifications() {
    const res = await fetch(BASE + '/api/users/me/notifications?limit=100')
    return res.ok ? (await res.json()).length : 0
  }

  async function runAction() {${action.script}
  }

  button.addEventListener('click', async () => {
    button.disabled = true
    try {
      status.textContent = await runAction()
    } catch {
      status.textContent = 'Could not reach the server.'
    }
    frame.contentWindow.location.reload() // show the result in the real page
    button.disabled = false
  })
</script>`,
    )
}