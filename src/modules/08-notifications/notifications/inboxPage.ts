// Inbox page (FR-19): lists the user's notifications, newest first.
// Filled in the browser from GET /api/users/me/notifications; clicking an unread one marks it read.
import { escapeHtml } from '../../../core/pages'

const BASE = '/08-notifications'

export function inboxPage(userId: string): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notifications</title>
<style>
  :root { --gold: #bd8f4d; --dark: #262626; --light: #ececea; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         background: var(--dark); color: var(--gold); font-family: system-ui, sans-serif; }
  header { display: flex; align-items: center; background: var(--light);
           padding: 8px 20px; border-bottom: 2px solid #bbb; }
  header img { height: 36px; }
  main { flex: 1; padding: 40px 56px; max-width: 800px; width: 100%; }
  h1 { font-weight: 500; font-size: 1.4rem; margin: 0 0 20px; }
  .item { border: 1px solid #555; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; }
  .item.unread { border-left: 4px solid var(--gold); cursor: pointer; }
  .item.unread .subject { font-weight: 700; }
  .meta { font-size: 0.75rem; color: #999; margin-top: 6px; }
  .message { color: #ddd; margin-top: 4px; }
  #empty { color: #ccc; }
  footer { padding: 16px 56px 28px; }
  footer a { color: var(--gold); margin-right: 16px; font-size: 0.85rem; }
</style>
</head>
<body>
<header><img src="${BASE}/assets/logo.png" alt="C3L"></header>
<main>
  <h1>Notifications</h1>
  <p class="meta">Signed in as ${escapeHtml(userId)}</p>
  <div id="list"><p id="empty">Loading...</p></div>
</main>
<footer>
  <a href="${BASE}">Notifications home</a>
  <a href="/">Site home</a>
</footer>
<script>
  const BASE = '${BASE}'
  const list = document.getElementById('list')

  function markRead(id) {
    return fetch(BASE + '/api/notifications/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
  }

  // textContent everywhere so notification text can't inject HTML
  function addItem(n) {
    const div = document.createElement('div')
    div.className = 'item' + (n.read_at === null ? ' unread' : '')

    const subject = document.createElement('div')
    subject.className = 'subject'
    subject.textContent = n.content.subject

    const message = document.createElement('div')
    message.className = 'message'
    message.textContent = n.content.message

    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.textContent = n.event_type + ' · ' + (n.course_id ?? 'no course') + ' · ' +
      new Date(n.created_at).toLocaleString()

    div.append(subject, message, meta)
    if (n.read_at === null) {
      div.addEventListener('click', async () => {
        const res = await markRead(n.notification_id)
        if (res.ok) div.className = 'item'
      }, { once: true })
    }
    list.appendChild(div)
  }

  async function load() {
    try {
      const res = await fetch(BASE + '/api/users/me/notifications?limit=100')
      if (!res.ok) throw new Error()
      const notifications = await res.json()
      list.innerHTML = ''
      if (notifications.length === 0) {
        list.innerHTML = '<p id="empty">No notifications yet.</p>'
        return
      }
      notifications.forEach(addItem)
    } catch {
      list.innerHTML = '<p id="empty">Could not load notifications.</p>'
    }
  }

  load()
</script>
</body>
</html>`
}