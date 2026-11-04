import { escapeHtml } from '../../../core/pages'
import { EVENT_TYPES } from './eventTypes'

// Module base path (used for links and API calls inside the page)
const BASE = '/08-notifications'

// Builds the notification preferences page (FR-19).
// The table is filled in the browser from FR-08; Save calls FR-06 (subscribe) / FR-07 (unsubscribe).
export function preferencesPage(userId: string): string {
    const headerCells = EVENT_TYPES.map((type) => `<th>${escapeHtml(type)}</th>`).join('')

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notification settings</title>
<style>
  :root { --gold: #bd8f4d; --dark: #262626; --light: #ececea; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         background: var(--dark); color: var(--gold); font-family: system-ui, sans-serif; }

  header { display: flex; align-items: center; justify-content: space-between;
           background: var(--light); padding: 8px 20px; border-bottom: 2px solid #bbb; }
  header img { height: 36px; }
  .icons { display: flex; gap: 14px; }
  .icons button { background: none; border: 0; padding: 4px; cursor: pointer; color: #222; }

  main { flex: 1; padding: 40px 56px; overflow-x: auto; }
  h1 { font-weight: 500; font-size: 1.4rem; margin: 0 0 20px; }
  h1 span { border-left: 2px solid var(--gold); padding-left: 8px; margin-left: 6px; }

  table { border-collapse: collapse; }
  th { font-weight: 500; font-size: 0.75rem; text-transform: capitalize; padding: 0 18px 10px; }
  td { padding: 8px 18px; text-align: center; }
  td.course { text-align: left; font-size: 0.85rem; padding-left: 0; white-space: nowrap; }
  #message { display: flex; align-items: center; justify-content: center;
             min-height: 50vh; font-size: 1.1rem; text-align: center; }
  #message[hidden] { display: none; }
  input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--gold); cursor: pointer; }

  footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 56px 28px; }
  footer a { color: var(--gold); margin-right: 16px; font-size: 0.85rem; }
  #status { font-size: 0.85rem; margin-right: 14px; }
  #save { background: var(--gold); color: var(--dark); border: 0; border-radius: 4px;
          padding: 8px 22px; font-weight: 600; cursor: pointer; }
  #save:disabled { opacity: 0.5; cursor: default; }
</style>
</head>
<body>
<header>
  <img src="${BASE}/assets/logo.png" alt="C3L">
  <div class="icons">
    <!-- Not connected yet -->
    <button type="button" aria-label="Notifications">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    </button>
    <button type="button" aria-label="Settings">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>
</header>

<main>
  <h1>Courses<span>Notification</span></h1>
  <p hidden>Signed in as ${escapeHtml(userId)}</p>
  <table>
    <thead><tr><th></th>${headerCells}</tr></thead>
    <tbody id="rows"><tr><td class="course">Loading...</td></tr></tbody>
  </table>
  <div id="message" hidden></div>
</main>

<footer>
  <nav>
    <a href="${BASE}">Notifications home</a>
    <a href="/">Site home</a>
  </nav>
  <div>
    <span id="status"></span>
    <button id="save" type="button">Save</button>
  </div>
</footer>

<script>
  const BASE = '${BASE}'
  const EVENT_TYPES = ${JSON.stringify(EVENT_TYPES)}
  const rows = document.getElementById('rows')
  const status = document.getElementById('status')
  const saveButton = document.getElementById('save')

  // Initial state from FR-08: each course lists the event types that are OFF (muted).
  // Checked box = receiving that type. textContent is used so course IDs can't inject HTML.
  const message = document.getElementById('message')
  const table = document.querySelector('table')

  // Hides the table and shows a message in the middle of the page
  function showMessage(text) {
    table.hidden = true
    message.textContent = text
    message.hidden = false
    saveButton.disabled = true
  }

  async function loadPreferences() {
    let courses
    try {
      const res = await fetch(BASE + '/api/users/me/notificationPreferences')
      if (!res.ok) throw new Error()
      courses = await res.json()
    } catch {
      showMessage('Could not load your settings. Try again later.')
      return
    }
    rows.innerHTML = ''
    if (courses.length === 0) {
      showMessage('You are not enrolled in any courses.')
      return
    }
    for (const course of courses) {
      const tr = document.createElement('tr')
      tr.dataset.courseId = course.course_id

      const name = document.createElement('td')
      name.className = 'course'
      name.textContent = course.course_id
      tr.appendChild(name)

      for (const type of EVENT_TYPES) {
        const td = document.createElement('td')
        const box = document.createElement('input')
        box.type = 'checkbox'
        box.value = type
        box.checked = !course.event_types.includes(type)
        box.setAttribute('aria-label', course.course_id + ' ' + type)
        td.appendChild(box)
        tr.appendChild(td)
      }
      rows.appendChild(tr)
    }
  }

  function send(method, path, courseId, eventTypes) {
    return fetch(BASE + '/api/notifications/' + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, event_type: eventTypes }),
    })
  }

  // Save: checked types -> FR-06 subscribe, unchecked -> FR-07 unsubscribe.
  // Empty lists are skipped because both routes reject an empty event_type with 400.
  async function save() {
    saveButton.disabled = true
    status.textContent = 'Saving...'
    const requests = []
    for (const tr of rows.querySelectorAll('tr[data-course-id]')) {
      const boxes = [...tr.querySelectorAll('input[type=checkbox]')]
      const on = boxes.filter((b) => b.checked).map((b) => b.value)
      const off = boxes.filter((b) => !b.checked).map((b) => b.value)
      if (on.length > 0) requests.push(send('POST', 'subscribe', tr.dataset.courseId, on))
      if (off.length > 0) requests.push(send('PATCH', 'unsubscribe', tr.dataset.courseId, off))
    }
    try {
      const results = await Promise.all(requests)
      status.textContent = results.every((r) => r.ok) ? 'Saved.' : 'Some changes did not save.'
    } catch {
      status.textContent = 'Could not reach the server.'
    }
    saveButton.disabled = false
  }

  saveButton.addEventListener('click', save)
  loadPreferences()
</script>
</body>
</html>`
}