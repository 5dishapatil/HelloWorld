import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);

const API_BASE = '/api/scam-sessions';
const USER_ID_KEY = 'guardian-path-user-id';
const SESSION_ID_KEY = 'guardian-path-active-session';
const DESKTOP_BREAKPOINT = 1080;
const DEFAULT_INPUT_OPTIONS = {
  allowTextReply: true,
  quickReplies: [
    { value: 'Yes, tell me more.', label: 'Yes, tell me more.' },
    { value: "No, I won't do that.", label: "No, I won't do that." },
  ],
};
const SCAM_OPTIONS = [
  { value: 'random', label: 'Random scenario' },
  { value: 'bank_impersonation', label: 'Bank impersonation' },
  { value: 'delivery_fraud', label: 'Delivery fraud' },
  { value: 'tech_support', label: 'Tech support' },
  { value: 'relational_scam', label: 'Relational scam' },
];

function createBrowserId() {
  if (window.crypto?.randomUUID) {
    return `demo-${window.crypto.randomUUID()}`;
  }

  return `demo-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

function loadOrCreateUserId() {
  const saved = window.localStorage.getItem(USER_ID_KEY);
  if (saved) return saved;

  const generated = createBrowserId();
  window.localStorage.setItem(USER_ID_KEY, generated);
  return generated;
}

function formatScenarioName(value) {
  if (!value) return 'Unknown';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTimestamp(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
}

function getMessageText(message) {
  if (!Array.isArray(message?.parts)) return '';

  return message.parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n');
}

function createPendingMessage(text, inputMode, quickReply) {
  return {
    id: `pending-${Date.now()}`,
    role: 'user',
    parts: [{ text }],
    inputMode,
    quickReply,
    pending: true,
  };
}

async function apiRequest(path, userId, options = {}) {
  const { method = 'GET', body } = options;
  const headers = {
    'x-user-id': userId,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Request failed.');
  }

  return payload;
}

function App() {
  const [userId] = React.useState(loadOrCreateUserId);
  const [selectedScamType, setSelectedScamType] = React.useState('random');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(
    () => window.innerWidth > DESKTOP_BREAKPOINT
  );
  const [sessionId, setSessionId] = React.useState(
    () => window.localStorage.getItem(SESSION_ID_KEY) || ''
  );
  const [sessionMeta, setSessionMeta] = React.useState({
    scamType: '',
    state: 'idle',
    turnCount: 0,
    trapAttempts: 0,
    successfulDefenses: 0,
    refusalCount: 0,
    riskScore: 0,
    isCompleted: false,
    resultReason: '',
  });
  const [messages, setMessages] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [inputOptions, setInputOptions] = React.useState(DEFAULT_INPUT_OPTIONS);
  const [messageText, setMessageText] = React.useState('');
  const [pendingMessage, setPendingMessage] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isStarting, setIsStarting] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingSession, setIsLoadingSession] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const endOfMessagesRef = React.useRef(null);

  const hasActiveSession = Boolean(sessionId);
  const visibleMessages = pendingMessage ? [...messages, pendingMessage] : messages;
  const currentQuickReplies = inputOptions?.quickReplies || [];
  const canCompose =
    hasActiveSession && !sessionMeta.isCompleted && !isSending && !isStarting && !isLoadingSession;
  const waitingForReply = isStarting || isSending || isLoadingSession;
  const latestHistory = history.slice(0, 8);

  React.useEffect(() => {
    function syncSidebarForViewport() {
      setIsSidebarOpen(window.innerWidth > DESKTOP_BREAKPOINT);
    }

    window.addEventListener('resize', syncSidebarForViewport);
    return () => window.removeEventListener('resize', syncSidebarForViewport);
  }, []);

  React.useEffect(() => {
    refreshHistory();
  }, []);

  React.useEffect(() => {
    if (!sessionId) return;
    loadSession(sessionId);
  }, []);

  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, waitingForReply]);

  function persistSession(nextSessionId) {
    if (nextSessionId) {
      window.localStorage.setItem(SESSION_ID_KEY, nextSessionId);
    } else {
      window.localStorage.removeItem(SESSION_ID_KEY);
    }
  }

  function updateMeta(source) {
    setSessionMeta({
      scamType: source?.scamType || '',
      state: source?.state || 'idle',
      turnCount: Number(source?.turnCount || 0),
      trapAttempts: Number(source?.trapAttempts || 0),
      successfulDefenses: Number(source?.successfulDefenses || 0),
      refusalCount: Number(source?.refusalCount || 0),
      riskScore: Number(source?.riskScore || 0),
      isCompleted: Boolean(source?.isCompleted),
      resultReason: source?.resultReason || '',
    });
  }

  function closeSidebarOnSmallScreens() {
    if (window.innerWidth <= DESKTOP_BREAKPOINT) {
      setIsSidebarOpen(false);
    }
  }

  function applyStartResponse(payload) {
    const session = payload.session;
    const nextSessionId = session?.id || '';

    setSessionId(nextSessionId);
    persistSession(nextSessionId);
    setMessages(Array.isArray(session?.messages) ? session.messages : []);
    setInputOptions(session?.inputOptions || DEFAULT_INPUT_OPTIONS);
    updateMeta(session);
  }

  function applyExistingSession(payload) {
    const session = payload.session;
    const nextSessionId = session?._id || '';

    setSessionId(nextSessionId);
    persistSession(nextSessionId);
    setMessages(Array.isArray(session?.messages) ? session.messages : []);
    setInputOptions(payload.inputOptions || DEFAULT_INPUT_OPTIONS);
    updateMeta(session);
  }

  function applyMessageResponse(payload) {
    const data = payload.data;
    const nextSessionId = data?.sessionId || '';

    setSessionId(nextSessionId);
    persistSession(nextSessionId);
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
    setInputOptions(data?.inputOptions || DEFAULT_INPUT_OPTIONS);
    updateMeta(data);
    setNotice(data?.noticeMessage || (data?.showPraiseBanner ? data?.praiseMessage || '' : ''));
  }

  async function refreshHistory() {
    setIsLoadingHistory(true);

    try {
      const payload = await apiRequest(`${API_BASE}/history`, userId);
      setHistory(Array.isArray(payload.sessions) ? payload.sessions : []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function loadSession(targetSessionId) {
    if (!targetSessionId) return;

    setIsLoadingSession(true);
    setErrorMessage('');
    setNotice('');

    try {
      const payload = await apiRequest(`${API_BASE}/${targetSessionId}`, userId);
      applyExistingSession(payload);
      closeSidebarOnSmallScreens();
    } catch (error) {
      setErrorMessage(error.message);
      setSessionId('');
      persistSession('');
      setMessages([]);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleStartSession() {
    setIsStarting(true);
    setErrorMessage('');
    setNotice('');
    setPendingMessage(null);

    try {
      const body = selectedScamType === 'random' ? {} : { scamType: selectedScamType };
      const payload = await apiRequest(`${API_BASE}/start`, userId, {
        method: 'POST',
        body,
      });

      applyStartResponse(payload);
      setMessageText('');
      closeSidebarOnSmallScreens();
      await refreshHistory();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsStarting(false);
    }
  }

  async function sendPayload(body, optimisticText, inputMode, quickReply = null) {
    if (!sessionId) return;

    setIsSending(true);
    setErrorMessage('');
    setNotice('');
    setPendingMessage(createPendingMessage(optimisticText, inputMode, quickReply));

    try {
      const payload = await apiRequest(`${API_BASE}/${sessionId}/message`, userId, {
        method: 'POST',
        body,
      });

      applyMessageResponse(payload);
      setMessageText('');
      await refreshHistory();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setPendingMessage(null);
      setIsSending(false);
    }
  }

  async function handleTextSubmit(event) {
    event.preventDefault();

    const trimmed = messageText.trim();
    if (!trimmed || !canCompose) return;

    await sendPayload({ message: trimmed }, trimmed, 'text');
  }

  async function handleQuickReply(reply) {
    if (!canCompose) return;

    const quickReplyText = String(reply?.value || '').trim();
    const quickReplyLabel = String(reply?.label || quickReplyText).trim();
    if (!quickReplyText) return;

    await sendPayload(
      { quickReply: quickReplyText },
      quickReplyLabel,
      'quick_reply',
      quickReplyLabel
    );
  }

  async function handleEndSession() {
    if (!sessionId || isLoadingSession) return;

    setErrorMessage('');
    setNotice('');

    try {
      const payload = await apiRequest(`${API_BASE}/${sessionId}/end`, userId, {
        method: 'PATCH',
      });

      applyExistingSession({
        session: payload.session,
        inputOptions: DEFAULT_INPUT_OPTIONS,
      });
      await refreshHistory();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleTextareaKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleTextSubmit(event);
    }
  }

  return html`
    <div className="app-shell">
      <div
        className=${`mobile-sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
        onClick=${() => setIsSidebarOpen(false)}
      ></div>

      <div className="layout">
        <aside className=${`panel sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-topbar">
            <div>
              <div className="badge-row">
                <span className="badge">Browser React frontend</span>
                <span className="badge">User ${userId.slice(0, 18)}...</span>
              </div>
              <h1 className="title">Guardian Path</h1>
              <p className="subtitle">
                Start a scam simulation, inspect every turn, and confirm whether the reply path
                came from normal text or the dedicated Yes/No buttons.
              </p>
            </div>
            <button
              className="icon-btn sidebar-close"
              type="button"
              onClick=${() => setIsSidebarOpen(false)}
              aria-label="Hide sidebar"
            >
              X
            </button>
          </div>

          <section className="card">
            <h3 className="section-title">Start A Simulation</h3>
            <label className="control-label" htmlFor="scam-type">Scenario</label>
            <select
              id="scam-type"
              className="select"
              value=${selectedScamType}
              onChange=${(event) => setSelectedScamType(event.target.value)}
              disabled=${isStarting}
            >
              ${SCAM_OPTIONS.map(
                (option) => html`
                  <option key=${option.value} value=${option.value}>${option.label}</option>
                `
              )}
            </select>
            <div className="btn-row" style=${{ marginTop: '14px' }}>
              <button className="btn btn-primary" onClick=${handleStartSession} disabled=${isStarting}>
                ${isStarting ? 'Starting...' : 'Start New Session'}
              </button>
              <button
                className="btn btn-secondary"
                onClick=${refreshHistory}
                disabled=${isLoadingHistory}
              >
                ${isLoadingHistory ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title">Session Signals</h3>
            <div className="stat-grid">
              <div className="stat">
                <span className="stat-label">State</span>
                <span className="stat-value">${sessionMeta.state || 'idle'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Risk Score</span>
                <span className="stat-value">${sessionMeta.riskScore}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Turns</span>
                <span className="stat-value">${sessionMeta.turnCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Defenses</span>
                <span className="stat-value">${sessionMeta.successfulDefenses}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title">Recent Sessions</h3>
            <div className="history-list">
              ${
                latestHistory.length
                  ? latestHistory.map(
                      (item) => html`
                        <button
                          key=${item._id}
                          className=${`history-item ${item._id === sessionId ? 'active' : ''}`}
                          onClick=${() => loadSession(item._id)}
                        >
                          <strong>${formatScenarioName(item.scamType)}</strong>
                          <span>
                            ${item.state} | risk ${item.riskScore} | ${formatTimestamp(
                              item.updatedAt
                            )}
                          </span>
                        </button>
                      `
                    )
                  : html`<p className="subtitle">No sessions yet. Start one to populate history.</p>`
              }
            </div>
          </section>
        </aside>

        <main className="panel chat-panel">
          <header className="chat-header">
            <div className="chat-header-main">
              <div className="chat-header-title-row">
                <button
                  className="icon-btn"
                  type="button"
                  onClick=${() => setIsSidebarOpen((current) => !current)}
                  aria-label=${isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                  |||
                </button>
                <div>
                  <h2>${hasActiveSession ? formatScenarioName(sessionMeta.scamType) : 'Scam Chat'}</h2>
                  <p>
                    ${
                      hasActiveSession
                        ? `Session ${sessionId.slice(0, 8)}... | trap attempts ${sessionMeta.trapAttempts}`
                        : 'Start a session from the sidebar to begin the simulation.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <span className="badge">Completed: ${sessionMeta.isCompleted ? 'Yes' : 'No'}</span>
              <button
                className="btn btn-danger"
                onClick=${handleEndSession}
                disabled=${!hasActiveSession || sessionMeta.isCompleted}
              >
                End Session
              </button>
            </div>
          </header>

          <div className="status-strip">
            ${notice ? html`<div className="status-note">${notice}</div>` : null}
            ${errorMessage ? html`<div className="status-note error">${errorMessage}</div>` : null}
            ${
              sessionMeta.resultReason
                ? html`<div className="status-note">Result reason: ${sessionMeta.resultReason}</div>`
                : null
            }
          </div>

          <section className="messages">
            ${
              visibleMessages.length
                ? visibleMessages.map(
                    (message, index) => html`
                      <div
                        key=${message.id || `${message.role}-${index}`}
                        className=${`message-row ${message.role}`}
                      >
                        <article className="message-bubble">
                          <div className="message-meta">
                            <span className="message-role">
                              ${message.role === 'model'
                                ? message.speakerLabel || 'Scammer'
                                : 'You'}
                            </span>
                            ${
                              message.inputMode
                                ? html`
                                    <span className="input-mode">
                                      ${message.inputMode === 'yes_no' ||
                                      message.inputMode === 'quick_reply'
                                        ? `button: ${message.quickReply || ''}`
                                        : 'typed text'}
                                    </span>
                                  `
                                : null
                            }
                            ${message.pending ? html`<span>sending...</span>` : null}
                          </div>
                          <div className="message-text">${getMessageText(message)}</div>
                        </article>
                      </div>
                    `
                  )
                : html`
                    <div className="empty-state">
                      <h3>Everything will appear here</h3>
                      <p>
                        The full conversation, including fallback errors and successful scammer
                        turns, will stream into this chat window once a session starts.
                      </p>
                    </div>
                  `
            }

            ${
              waitingForReply
                ? html`
                    <div className="message-row model">
                      <article className="message-bubble">
                        <div className="message-meta">
                          <span className="message-role">Scammer</span>
                          <span>typing...</span>
                        </div>
                        <div className="typing-bubble">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </article>
                    </div>
                  `
                : null
            }

            <div ref=${endOfMessagesRef}></div>
          </section>

          <section className="composer-wrap">
            ${
              currentQuickReplies.length && hasActiveSession && !sessionMeta.isCompleted
                ? html`
                    <div className="quick-reply-row">
                      ${currentQuickReplies.map(
                        (reply) => html`
                          <button
                            key=${reply.value}
                            className="quick-reply-btn"
                            onClick=${() => handleQuickReply(reply)}
                            disabled=${!canCompose}
                          >
                            ${reply.label}
                          </button>
                        `
                      )}
                    </div>
                  `
                : null
            }

            <form className="composer" onSubmit=${handleTextSubmit}>
              <textarea
                placeholder=${hasActiveSession
                  ? 'Type your message here. Press Enter to send.'
                  : 'Start a session first to chat.'}
                value=${messageText}
                onInput=${(event) => setMessageText(event.target.value)}
                onKeyDown=${handleTextareaKeyDown}
                disabled=${!canCompose || !inputOptions.allowTextReply}
              ></textarea>
              <div className="composer-footer">
                <span className="helper-text">
                  The chat stays pinned to the screen while messages scroll inside this panel.
                </span>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled=${!canCompose || !messageText.trim()}
                >
                  ${isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  `;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
