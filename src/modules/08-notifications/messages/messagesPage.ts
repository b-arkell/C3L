// FR-19c — Direct messaging HTML page
// The surrounding LMS layout is provided by page() in ../views.

export function messagesPage(): string {
  return String.raw`
<style>
  .dm-layout { display:grid; grid-template-columns: 240px minmax(0,1fr); min-height:65vh; border:1px solid #d8d8d8; border-radius:10px; overflow:hidden; background:#252525; color:#f7f7f7; }
  .dm-sidebar { background:#eee9e9; color:#242424; border-right:1px solid #d1cccc; }
  .dm-sidebar h2 { margin:0; padding:18px; font-size:1.1rem; background:#c7c2c2; }
  .dm-conversations { display:flex; flex-direction:column; }
  .dm-conversation { width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:13px 14px; border:0; background:transparent; color:inherit; text-align:left; cursor:pointer; font:inherit; }
  .dm-conversation:hover,.dm-conversation[aria-current="true"] { background:#d9d2d2; }
  .dm-conversation-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dm-unread { width:10px; height:10px; flex:0 0 10px; border-radius:50%; background:#bb7700; }
  .dm-main { display:flex; flex-direction:column; min-width:0; min-height:65vh; }
  .dm-heading { background:#f0d877; color:#1d1d1d; padding:15px 20px; font-size:1.3rem; font-weight:600; text-align:center; }
  .dm-messages { display:flex; flex:1; flex-direction:column; gap:12px; padding:22px; overflow-y:auto; max-height:60vh; min-height:300px; }
  .dm-message { max-width:min(75%,600px); padding:12px 16px; border-radius:18px; background:#f2c20e; color:#151515; overflow-wrap:anywhere; align-self:flex-start; }
  .dm-message.mine { align-self:flex-end; background:#f0d877; }
  .dm-sender { display:block; font-size:.75rem; font-weight:600; margin-bottom:5px; }
  .dm-compose { display:flex; gap:10px; align-items:flex-end; padding:16px; background:#343434; }
  .dm-compose textarea { box-sizing:border-box; width:100%; min-height:55px; max-height:160px; resize:vertical; padding:12px; border-radius:12px; border:1px solid #bbb; font:inherit; }
  .dm-compose button { border:0; border-radius:20px; background:#f2c20e; color:#171717; font:inherit; font-weight:600; padding:12px 18px; cursor:pointer; }
  .dm-compose button:disabled { opacity:.55; cursor:not-allowed; }
  .dm-notice { padding:12px 18px; color:#e9e9e9; }
  .dm-error { color:#ffb9b9; }
  .dm-links { display:flex; gap:16px; margin-bottom:14px; }
  @media (max-width:650px) { .dm-layout { grid-template-columns:1fr; } .dm-sidebar { border-right:0; border-bottom:1px solid #bbb; } .dm-conversations { max-height:200px; overflow:auto; } .dm-main { min-height:55vh; } }
</style>
<nav class="dm-links" aria-label="Messaging navigation">
  <a href="/">LMS home</a>
  <a href="/modules/08-notifications">Notifications home</a>
</nav>
<section class="dm-layout" aria-label="Direct messages">
  <aside class="dm-sidebar" aria-label="Conversations">
    <h2>Conversations</h2>
    <div id="dm-conversations" class="dm-conversations"><p class="dm-notice">Loading conversations…</p></div>
  </aside>
  <section class="dm-main" aria-label="Selected conversation">
    <header id="dm-heading" class="dm-heading">Select a conversation</header>
    <div id="dm-messages" class="dm-messages" role="log" aria-live="polite">
      <p>Select a conversation on the left to view its messages.</p>
    </div>
    <form id="dm-compose" class="dm-compose">
      <textarea id="dm-input" maxlength="280" required placeholder="Type a message (up to 280 characters)…" aria-label="Message" disabled></textarea>
      <button id="dm-send" type="submit" disabled>Send</button>
    </form>
  </section>
</section>
<script>
(() => {
  const listElement = document.getElementById('dm-conversations');
  const heading = document.getElementById('dm-heading');
  const messagesElement = document.getElementById('dm-messages');
  const form = document.getElementById('dm-compose');
  const input = document.getElementById('dm-input');
  const sendButton = document.getElementById('dm-send');
  let conversations = [];
  let activeId = null;
  let activeRequest = 0;

  function showMessage(text, isError = false) {
    messagesElement.replaceChildren();
    const p = document.createElement('p');
    p.textContent = text;
    if (isError) p.className = 'dm-error';
    messagesElement.appendChild(p);
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Request failed (' + response.status + ')');
    }
    return response.json();
  }

  function conversationLabel(conversation) {
    // A 1:1 conversation has no name in the current API.
    // Replace this fallback when the users module exposes participant display names.
    return conversation.name || 'Direct conversation ' + conversation.id.slice(0, 8);
  }

  function renderConversations() {
    listElement.replaceChildren();
    if (!conversations.length) {
      const p = document.createElement('p');
      p.className = 'dm-notice';
      p.textContent = 'No conversations yet.';
      listElement.appendChild(p);
      return;
    }
    for (const conversation of conversations) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dm-conversation';
      button.setAttribute('aria-current', String(conversation.id === activeId));
      const name = document.createElement('span');
      name.className = 'dm-conversation-name';
      name.textContent = conversationLabel(conversation);
      button.appendChild(name);
      if (conversation.has_unread === 1) {
        const indicator = document.createElement('span');
        indicator.className = 'dm-unread';
        indicator.title = 'Unread messages';
        indicator.setAttribute('aria-label', 'Unread messages');
        button.appendChild(indicator);
      }
      button.addEventListener('click', () => openConversation(conversation.id));
      listElement.appendChild(button);
    }
  }

  async function refreshConversations() {
    conversations = await requestJson('/08-notifications/api/me/conversations');
    renderConversations();
  }

  function renderMessages(messages) {
    messagesElement.replaceChildren();
    if (!messages.length) {
      showMessage('No messages yet. Start the conversation!');
      return;
    }
    // The API returns newest first; display oldest first.
    for (const message of [...messages].reverse()) {
      const bubble = document.createElement('div');
      bubble.className = 'dm-message';
      const sender = document.createElement('span');
      sender.className = 'dm-sender';
      sender.textContent = message.sender_id;
      const body = document.createElement('span');
      body.textContent = message.body;
      bubble.append(sender, body);
      messagesElement.appendChild(bubble);
    }
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  async function openConversation(id) {
    activeId = id;
    const requestId = ++activeRequest;
    const selected = conversations.find(c => c.id === id);
    heading.textContent = selected ? conversationLabel(selected) : 'Conversation';
    input.disabled = false;
    sendButton.disabled = false;
    renderConversations();
    showMessage('Loading messages…');
    try {
      const messages = await requestJson('/08-notifications/api/me/conversations/' + encodeURIComponent(id));
      if (requestId !== activeRequest) return;
      renderMessages(messages);
      await requestJson('/08-notifications/api/me/conversations/' + encodeURIComponent(id) + '/read', { method: 'PATCH' });
      if (requestId !== activeRequest) return;
      await refreshConversations();
    } catch (error) {
      if (requestId === activeRequest) showMessage('Could not open conversation: ' + error.message, true);
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!activeId || !text || text.length > 280) return;
    const conversationId = activeId;
    sendButton.disabled = true;
    try {
      await requestJson('/08-notifications/api/directMessage/' + encodeURIComponent(conversationId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      input.value = '';
      if (activeId === conversationId) await openConversation(conversationId);
      else await refreshConversations();
    } catch (error) {
      showMessage('Could not send message: ' + error.message, true);
    } finally {
      sendButton.disabled = !activeId;
    }
  });

  refreshConversations().catch(error => {
    listElement.textContent = 'Could not load conversations: ' + error.message;
  });
})();
</script>`;
}
