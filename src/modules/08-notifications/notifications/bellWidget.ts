export function bellWidget(base: string): string {
  return `
<button
  id="bell-button"
  type="button"
  aria-label="Notifications"
  style="position: relative;"
>
  <svg
    id="bell"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>

  <span id="bell-dot" hidden></span>
</button>

<div id="widget" hidden>
  <div id="widget-notifications">
    Loading...
  </div>
</div>

<style>
  #bell-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #cc3333;
  }

  #bell-dot[hidden] {
    display: none;
  }

  #widget {
    position: fixed;
    top: 60px;
    right: 20px;

    width: 350px;
    max-height: 500px;

    overflow-y: auto;

    background: #333;
    border: 1px solid #666;
    border-radius: 8px;

    padding: 12px;

    z-index: 1000;
  }

  #widget[hidden] {
    display: none;
  }

  .notification {
    border: 1px solid #555;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    background: #333;
    color: #bd8f4d;
  }

  .notification.unread {
    border-left: 4px solid #bd8f4d;
    font-weight: bold;
  }

  .subject {
    margin-bottom: 6px;
  }

  .message {
    font-weight: normal;
  }
</style>

<script>
(() => {

  const BASE = '${base}'

  const bellButton =
    document.getElementById('bell-button')

  const bellDot =
    document.getElementById('bell-dot')

  const widget =
    document.getElementById('widget')

  const container =
    document.getElementById('widget-notifications')

  bellButton.addEventListener(
    'click',
    () => {
      widget.hidden = !widget.hidden
    },
  )

  document.addEventListener(
    'click',
    event => {

      if (
        !widget.contains(event.target)
        && !bellButton.contains(event.target)
      ) {
        widget.hidden = true
      }
    },
  )

  async function markRead(notificationId) {

    await fetch(
      BASE + '/api/notifications/' + notificationId,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          read: true
        }),
      },
    )
  }

  function updateBell(notifications) {

    const hasUnread =
      notifications.some(
        n => n.read_at === null,
      )

    bellDot.hidden = !hasUnread
  }

  async function loadNotifications() {

    let notifications

    try {

      const response =
        await fetch(
          BASE + '/api/users/me/notifications'
        )

      if (!response.ok) {
        throw new Error()
      }

      notifications =
        await response.json()

    } catch {

      container.textContent =
        'Unable to load notifications.'

      return
    }

    updateBell(notifications)

    if (notifications.length === 0) {

      container.textContent =
        'No notifications.'

      return
    }

    container.innerHTML = ''

    for (const notification of notifications) {

      const div =
        document.createElement('div')

      div.className =
        'notification' +
        (notification.read_at === null
          ? ' unread'
          : '')

      const subject =
        document.createElement('div')

      subject.className = 'subject'
      subject.textContent =
        notification.content.subject

      const message =
        document.createElement('div')

      message.className = 'message'
      message.textContent =
        notification.content.message

      div.appendChild(subject)
      div.appendChild(message)

      div.addEventListener(
        'click',
        async () => {

          if (notification.read_at === null) {

            await markRead(
              notification.notification_id,
            )

            notification.read_at =
              new Date().toISOString()

            div.classList.remove(
              'unread',
            )

            updateBell(
              notifications,
            )
          }
        },
      )

      container.appendChild(div)
    }
  }

  loadNotifications()

})()
</script>
`
}