import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { adminSocketUrl, publicChatFetch } from '../utils/adminChatApi.js'

const QUICK_OPTIONS = [
  { id: 'apply', label: 'How to apply?', icon: '📝' },
  { id: 'rates', label: 'Ask about rates', icon: '💰' },
  { id: 'products', label: 'Loan products', icon: '📋' },
  { id: 'agent', label: 'Talk to an agent', icon: '👤' },
]

function detectLang() {
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  const base = String(nav || '').toLowerCase().split(/[-_]/)[0]
  if (base === 'tl' || base === 'fil') return 'fil'
  if (['en', 'es'].includes(base)) return base
  return 'en'
}

function newConvoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return `lending-${crypto.randomUUID()}`
    } catch {
      /* ignore */
    }
  }
  return `lending-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function getConvoId() {
  try {
    const key = 'al_lending_convo_id'
    const current = sessionStorage.getItem(key)
    if (current) return current
    const next = newConvoId()
    sessionStorage.setItem(key, next)
    return next
  } catch {
    return newConvoId()
  }
}

function formatTime(value) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function LendingChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('al_lending_chat_lang') || detectLang()
    } catch {
      return detectLang()
    }
  })
  const [unread, setUnread] = useState(0)
  const [leadCapture, setLeadCapture] = useState(null)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, name: '', email: '', comment: '' })
  const [showFeedback, setShowFeedback] = useState(false)
  const [agentStep, setAgentStep] = useState(null)
  const [agentForm, setAgentForm] = useState({ name: '', email: '', concern: '' })

  const socketRef = useRef(null)
  const convoId = useRef(getConvoId())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const sourcePage = useMemo(
    () => (typeof window !== 'undefined' ? window.location.pathname || '/' : '/'),
    [],
  )

  const resetChat = useCallback(() => {
    const next = newConvoId()
    try {
      sessionStorage.setItem('al_lending_convo_id', next)
    } catch {
      /* ignore */
    }
    convoId.current = next
    setMessages([])
    setInput('')
    setTyping(false)
    setLeadCapture(null)
    setLeadForm({ name: '', email: '', phone: '', company: '' })
    setFeedbackForm({ rating: 0, name: '', email: '', comment: '' })
    setShowFeedback(false)
    setAgentStep(null)
    setAgentForm({ name: '', email: '', concern: '' })
    socketRef.current?.emit('visitor:join', {
      conversationId: next,
      source_page: sourcePage,
      lang,
    })
  }, [sourcePage, lang])

  useEffect(() => {
    const socket = io(adminSocketUrl(), { autoConnect: false, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('chat:history', (rows) => {
      if (!Array.isArray(rows)) return
      setMessages(rows.map((m) => ({ ...m, time: m.created_at })))
    })

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, { ...msg, time: msg.created_at }])
      setTyping(false)
      if (!open && msg.sender !== 'user') setUnread((n) => n + 1)
    })

    socket.on('chat:typing', () => setTyping(true))
    socket.on('chat:typingStop', () => setTyping(false))
    socket.on('chat:requestLeadDetails', ({ inquiry_message }) => {
      setLeadCapture({ inquiry_message: inquiry_message || '' })
      setLeadForm({ name: '', email: '', phone: '', company: '' })
    })
    socket.on('chat:leadCaptured', () => {
      setLeadCapture(null)
      setLeadForm({ name: '', email: '', phone: '', company: '' })
    })

    socket.connect()
    socket.emit('visitor:join', { conversationId: convoId.current, source_page: sourcePage, lang })
    return () => socket.disconnect()
  }, [lang, open, sourcePage])

  useEffect(() => {
    if (!open) return
    setUnread(0)
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, leadCapture, showFeedback])

  useEffect(() => {
    try {
      localStorage.setItem('al_lending_chat_lang', lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const sendMessage = useCallback(
    (textInput = input) => {
      const text = String(textInput || '').trim()
      if (!text) return
      socketRef.current?.emit('visitor:message', {
        conversationId: convoId.current,
        content: text,
        source_page: sourcePage,
        lang,
      })
      setInput('')
    },
    [input, lang, sourcePage],
  )

  const handleQuickOption = useCallback(
    (id) => {
      if (id === 'agent') {
        setAgentStep('form')
        return
      }
      const prompts = {
        apply: 'How do I apply for a loan?',
        rates: 'Can you explain your rates and terms?',
        products: 'What loan products are available?',
      }
      sendMessage(prompts[id] || '')
    },
    [sendMessage],
  )

  const submitAgentRequest = useCallback(
    (e) => {
      e.preventDefault()
      if (!agentForm.name.trim() || !agentForm.email.trim() || !agentForm.concern.trim()) return
      socketRef.current?.emit('visitor:requestAgent', {
        conversationId: convoId.current,
        name: agentForm.name.trim(),
        email: agentForm.email.trim(),
        concern: agentForm.concern.trim(),
        source_page: sourcePage,
      })
      setAgentStep(null)
      setAgentForm({ name: '', email: '', concern: '' })
    },
    [agentForm, sourcePage],
  )

  const submitLead = useCallback(
    (e) => {
      e.preventDefault()
      if (!leadForm.name.trim() || !leadForm.email.trim()) return
      socketRef.current?.emit('visitor:leadDetails', {
        conversationId: convoId.current,
        name: leadForm.name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim(),
        company: leadForm.company.trim(),
        inquiry_message: leadCapture?.inquiry_message || '',
        source_page: sourcePage,
        lang,
      })
      setLeadCapture(null)
      setLeadForm({ name: '', email: '', phone: '', company: '' })
    },
    [leadForm, leadCapture, sourcePage, lang],
  )

  const submitFeedback = useCallback(
    async (e) => {
      e.preventDefault()
      if (!feedbackForm.rating || !feedbackForm.comment.trim()) return
      try {
        await publicChatFetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convoId.current,
            rating: feedbackForm.rating,
            name: feedbackForm.name.trim() || 'Anonymous',
            email: feedbackForm.email.trim() || null,
            comment: feedbackForm.comment.trim(),
          }),
        })
      } catch {
        /* ignore */
      }
      setShowFeedback(false)
      setFeedbackForm({ rating: 0, name: '', email: '', comment: '' })
    },
    [feedbackForm],
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[520px] w-[380px] max-h-[calc(100vh-6rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-brand-primary/30 bg-white shadow-2xl sm:bottom-24 sm:right-6 sm:h-[560px]">
          <div className="flex items-center gap-2 border-b border-brand-primary/30 bg-brand-primary px-3 py-3 text-white">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={resetChat}
                className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                title="Back to menu"
                aria-label="Back to menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <img src="/amalgated-lending-logo.png" alt="" className="h-9 w-9 rounded-full bg-white/20 object-contain p-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Amalgated Lending Assistant</p>
              <p className="text-xs text-white/70">Loan support</p>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="hidden rounded-lg bg-white/15 px-2 py-1 text-[11px] font-semibold text-white outline-none ring-1 ring-white/20 backdrop-blur sm:block"
              aria-label="Language"
            >
              <option value="en" className="text-slate-900">English</option>
              <option value="fil" className="text-slate-900">Filipino</option>
              <option value="es" className="text-slate-900">Espanol</option>
            </select>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          </div>

          <div className="chat-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <img src="/amalgated-lending-logo.png" alt="" className="h-16 w-16 rounded-full object-contain" />
                <div>
                  <p className="text-base font-semibold text-[#3A3F45]">Welcome to Amalgated Lending!</p>
                  <p className="mt-1 text-sm text-[#3A3F45]/80">How can we help you today?</p>
                </div>
                <div className="mt-2 flex w-full flex-col gap-2">
                  {QUICK_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-medium text-brand-text transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
                      onClick={() => handleQuickOption(o.id)}
                    >
                      <span className="text-lg">{o.icon}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={`${m.id || i}`} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender === 'user'
                      ? 'rounded-br-md bg-brand-primary text-white'
                      : m.sender === 'admin'
                        ? 'rounded-bl-md border border-emerald-200 bg-emerald-50 text-[#3A3F45]'
                        : 'rounded-bl-md border border-black/10 bg-[#F8F8F8] text-brand-text'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`mt-1 text-right text-[10px] ${m.sender === 'user' ? 'text-white/60' : 'text-[#3A3F45]/40'}`}>
                    {formatTime(m.time)}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#C9CED4]/30 bg-[#F4F6F8] px-4 py-3">
                  <span className="chat-dot h-2 w-2 rounded-full bg-brand-primary/60" />
                  <span className="chat-dot h-2 w-2 rounded-full bg-brand-primary/60 [animation-delay:0.15s]" />
                  <span className="chat-dot h-2 w-2 rounded-full bg-brand-primary/60 [animation-delay:0.3s]" />
                </div>
              </div>
            )}

            {leadCapture && (
              <form onSubmit={submitLead} className="w-full max-w-[90%] space-y-2.5 rounded-2xl rounded-bl-md border border-[#C9CED4]/30 bg-[#F4F6F8] p-4">
                <p className="text-xs text-[#3A3F45]/70">Share your details so we can follow up:</p>
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <button type="submit" className="w-full rounded-lg bg-brand-primary py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover">
                  Submit
                </button>
              </form>
            )}

            {agentStep === 'form' && (
              <form onSubmit={submitAgentRequest} className="w-full max-w-[90%] space-y-2.5 rounded-2xl rounded-bl-md border border-[#C9CED4]/30 bg-[#F4F6F8] p-4">
                <p className="text-xs text-[#3A3F45]/70">Please share your details and concern so an agent can assist you.</p>
                <input
                  type="text"
                  placeholder="Your name *"
                  required
                  value={agentForm.name}
                  onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <input
                  type="email"
                  placeholder="Your email *"
                  required
                  value={agentForm.email}
                  onChange={(e) => setAgentForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <textarea
                  rows={2}
                  placeholder="What do you need help with? *"
                  required
                  value={agentForm.concern}
                  onChange={(e) => setAgentForm((f) => ({ ...f, concern: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-lg bg-brand-primary py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover">
                    Connect to agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentStep(null)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black/70 transition hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showFeedback && (
              <form onSubmit={submitFeedback} className="w-full max-w-[90%] space-y-3 rounded-2xl rounded-bl-md border border-[#C9CED4]/30 bg-[#F4F6F8] p-4">
                <p className="text-xs font-semibold text-[#3A3F45]/70">How would you rate your experience?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm((f) => ({ ...f, rating: star }))}
                      className={`text-2xl transition-transform hover:scale-110 ${feedbackForm.rating >= star ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="Your feedback"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-text outline-none placeholder:text-black/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <button type="submit" className="w-full rounded-lg bg-brand-primary py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover">
                  Submit Feedback
                </button>
              </form>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#C9CED4]/30 bg-white px-3 py-3">
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFeedback((v) => !v)}
                className="rounded-md border border-black/10 px-2 py-1 text-xs text-black/70 transition hover:bg-black/5"
              >
                {showFeedback ? 'Hide Feedback' : 'Customer Feedback'}
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Type your message..."
                className="max-h-24 flex-1 resize-none rounded-xl border border-black/10 bg-[#F8F8F8] px-4 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-black/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-[#3A3F45]/40">Powered by AI - Responses may not always be accurate</p>
          </div>
        </div>
      )}
    </>
  )
}

