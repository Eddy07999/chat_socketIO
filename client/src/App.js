import { useEffect, useMemo, useRef, useState } from 'react';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const SOCKET_IO_SCRIPT_URL = `${SOCKET_URL}/socket.io/socket.io.js`;

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function App() {
  const [username, setUsername] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const [socketError, setSocketError] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeUsers = useMemo(() => {
    const knownUsers = new Set(
      messages
        .map((message) => message.user)
        .filter((messageUser) => Boolean(messageUser && messageUser.trim()))
    );

    if (username.trim()) {
      knownUsers.add(username.trim());
    }

    return Array.from(knownUsers).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [messages, username]);

  useEffect(() => {
    let mounted = true;

    const initialiseSocket = () => {
      if (!mounted || !window.io) {
        return;
      }

      const socket = window.io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 10,
        timeout: 5000,
      });

      socketRef.current = socket;

      const markSystemMessage = (text) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `system-${Date.now()}-${Math.random()}`,
            text,
            user: 'Système',
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      };

      socket.on('connect', () => {
        setConnectionState('connected');
        setSocketError('');
        markSystemMessage('Connexion établie au serveur.');
      });

      socket.on('disconnect', (reason) => {
        setConnectionState('disconnected');
        markSystemMessage(`Connexion perdue (${reason}).`);
      });

      socket.io.on('reconnect_attempt', () => {
        setConnectionState('reconnecting');
      });

      socket.on('connect_error', (error) => {
        setConnectionState('error');
        setSocketError(error.message || 'Impossible de se connecter au serveur.');
      });

      socket.on('chat:message', (payload) => {
        if (!payload?.text) {
          return;
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: payload.id || `${payload.user}-${payload.timestamp}`,
            user: payload.user || 'Anonymous',
            text: payload.text,
            timestamp: payload.timestamp || Date.now(),
          },
        ]);
      });
    };

    if (window.io) {
      initialiseSocket();
    } else {
      const script = document.createElement('script');
      script.src = SOCKET_IO_SCRIPT_URL;
      script.async = true;
      script.onload = initialiseSocket;
      script.onerror = () => {
        setConnectionState('error');
        setSocketError("Impossible de charger le client Socket.IO.");
      };

      document.body.appendChild(script);
    }

    return () => {
      mounted = false;
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = connectionState === 'connected';

  const submitUsername = (event) => {
    event.preventDefault();
    const trimmedName = draftUsername.trim();

    if (!trimmedName) {
      return;
    }

    setUsername(trimmedName);
    setDraftUsername('');
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!socketRef.current || !isConnected || !username.trim() || !messageText.trim()) {
      return;
    }

    const outgoingMessage = {
      id: `${socketRef.current.id}-${Date.now()}`,
      user: username.trim(),
      text: messageText.trim(),
      timestamp: Date.now(),
    };

    socketRef.current.emit('chat:message', outgoingMessage);
    setMessageText('');
  };

  const connectionBadgeClass = {
    connected: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    connecting: 'bg-amber-100 text-amber-700 border-amber-300',
    reconnecting: 'bg-amber-100 text-amber-700 border-amber-300',
    disconnected: 'bg-rose-100 text-rose-700 border-rose-300',
    error: 'bg-rose-100 text-rose-700 border-rose-300',
  }[connectionState];

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Chat Socket.IO</h1>
          <p className="mt-1 text-sm text-slate-500">Serveur: {SOCKET_URL}</p>

          <div className={`mt-4 rounded-lg border px-3 py-2 text-sm font-medium ${connectionBadgeClass}`}>
            État: {connectionState}
          </div>

          {socketError && (
            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{socketError}</p>
          )}

          <form className="mt-4 space-y-2" onSubmit={submitUsername}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="username">
              Votre pseudo
            </label>
            <input
              id="username"
              type="text"
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              placeholder={username || 'ex: Marie'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {username ? 'Changer le pseudo' : 'Valider le pseudo'}
            </button>
          </form>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Utilisateurs actifs</h2>
            {activeUsers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucun utilisateur identifié pour le moment.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {activeUsers.map((user) => (
                  <li key={user} className="!px-0">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1">{user}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex h-[75vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-800">Messages</h2>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message. Commence la discussion 👋</p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                    message.isSystem
                      ? 'bg-slate-100 text-slate-600'
                      : message.user === username
                      ? 'ml-auto bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs opacity-80">
                    <strong>{message.user}</strong>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-4">
            <input
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={username ? 'Votre message...' : 'Choisissez un pseudo pour écrire'}
              disabled={!isConnected || !username}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!isConnected || !username || !messageText.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Envoyer
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default App;
