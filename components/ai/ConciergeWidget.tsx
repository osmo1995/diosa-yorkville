import React, { useEffect, useMemo, useRef, useState } from 'react';
import { emitAnalytics } from '../analytics/emit';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Send, Sparkles, X, Calendar } from 'lucide-react';

type NextStep = { label: string; action: 'BOOK' | 'SERVICES' | 'STYLE_GENERATOR'; href?: string };

type ConciergeApiResponse = {
  reply: string;
  quickReplies: string[];
  nextSteps: NextStep[];
};

type ChatTurn = { role: 'user' | 'assistant'; text: string };

type WidgetContext = {
  goal?: 'extensions' | 'color' | 'unsure';
  timeline?: string;
  maintenanceTolerance?: 'low' | 'medium' | 'high';
  hairHistory?: string;
  desiredLook?: string;
  intakeSummary?: string;
};

const STORAGE_KEY = 'diosa_concierge_widget_v2';

function loadState(): { turns: ChatTurn[]; ctx: WidgetContext } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { turns: [], ctx: { goal: 'unsure' } };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed.turns) ? parsed.turns.slice(-10) : [],
      ctx: parsed.ctx || { goal: 'unsure' },
    };
  } catch {
    return { turns: [], ctx: { goal: 'unsure' } };
  }
}

function saveState(turns: ChatTurn[], ctx: WidgetContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ turns: turns.slice(-10), ctx }));
  } catch {
    // ignore
  }
}

export const ConciergeWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [ctx, setCtx] = useState<WidgetContext>({ goal: 'unsure' });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ConciergeApiResponse | null>(null);

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [lead, setLead] = useState({ name: '', email: '', phone: '', consent: false });

  const [contextOpen, setContextOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = loadState();
    setTurns(s.turns);
    setCtx(s.ctx);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    saveState(turns, ctx);
  }, [turns, ctx]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, turns.length, loading]);

  type Chip =
    | { label: string; ctx: Partial<WidgetContext> }
    | { label: string; action: 'BOOK' };

  const chips = useMemo<Chip[]>(
    () => [
      { label: 'Extensions', ctx: { goal: 'extensions' } },
      { label: 'Colour', ctx: { goal: 'color' } },
      { label: 'Low maintenance', ctx: { maintenanceTolerance: 'low' } },
      { label: 'Book consultation', action: 'BOOK' },
    ],
    []
  );

  async function ask(message: string) {
    const m = message.trim();
    if (!m) return;

    setError(null);
    setLoading(true);
    emitAnalytics('widget_message_send', { chars: m.length, goal: ctx.goal, maintenance: ctx.maintenanceTolerance });
    setTurns((t) => [...t, { role: 'user', text: m }]);
    setInput('');

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: m, context: ctx }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Concierge failed');

      setLastResponse(json);
      setTurns((t) => [...t, { role: 'assistant', text: json.reply }]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function sendLead() {
    setLeadStatus('sending');
    setLeadError(null);
    emitAnalytics('lead_submit_attempt');

    try {
      const lastUser = [...turns].reverse().find((t) => t.role === 'user')?.text || '';
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          message: lastUser,
          context: { ctx, turns: turns.slice(-6), lastResponse },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Friendly fallback when SMTP isn't configured.
        if (res.status === 501) {
          setLeadStatus('error');
          setLeadError('Callback requests are temporarily unavailable. Please book directly and our concierge will confirm next steps.');
          emitAnalytics('lead_submit_error', { status: 501 });
          return;
        }
        throw new Error(json?.error || 'Failed to send');
      }
      setLeadStatus('sent');
      emitAnalytics('lead_submit_success');
    } catch (e: any) {
      setLeadStatus('error');
      setLeadError(e?.message || 'Failed to send');
      emitAnalytics('lead_submit_error', { message: e?.message });
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Launcher */}
      <button
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            emitAnalytics(next ? 'widget_open' : 'widget_close');
            return next;
          });
        }}
        className="w-14 h-14 rounded-full bg-deep-charcoal text-white shadow-xl flex items-center justify-center border border-white/10 hover:bg-divine-gold transition-colors"
        aria-label={open ? 'Close concierge' : 'Open concierge'}
      >
        {open ? <X size={20} /> : <MessageSquareText size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute bottom-16 right-0 w-[340px] sm:w-[380px] bg-white border border-gray-100 shadow-2xl"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-divine-gold">
                <Sparkles size={16} />
                <div className="text-[10px] uppercase tracking-widest font-bold">AI Concierge</div>
              </div>
              <a
                href="/booking"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-divine-gold hover:opacity-80"
              >
                <Calendar size={14} />
                Book
              </a>
            </div>

            <div className="p-4 max-h-[380px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setContextOpen((v) => {
                      emitAnalytics('widget_context_toggle', { open: !v });
                      return !v;
                    });
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-divine-gold"
                >
                  {contextOpen ? 'Hide context' : 'Context'}
                </button>
                {(ctx.goal && ctx.goal !== 'unsure') || ctx.timeline || ctx.maintenanceTolerance ? (
                  <div className="text-[10px] uppercase tracking-widest font-bold text-divine-gold">Context applied</div>
                ) : null}
              </div>

              {contextOpen && (
                <div className="border border-gray-100 bg-goddess-white p-4 mb-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Goal</div>
                      <select
                        value={ctx.goal || 'unsure'}
                        onChange={(e) => setCtx((p) => ({ ...p, goal: e.target.value as any }))}
                        className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                      >
                        <option value="unsure">Unsure</option>
                        <option value="extensions">Extensions</option>
                        <option value="color">Colour</option>
                      </select>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Maintenance</div>
                      <select
                        value={ctx.maintenanceTolerance || ''}
                        onChange={(e) => setCtx((p) => ({ ...p, maintenanceTolerance: (e.target.value || undefined) as any }))}
                        className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                      >
                        <option value="">Not set</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Timeline</div>
                      <input
                        value={ctx.timeline || ''}
                        onChange={(e) => setCtx((p) => ({ ...p, timeline: e.target.value }))}
                        placeholder="e.g., ASAP / this month"
                        className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                      />
                    </div>

                    <div className="text-[10px] text-gray-400">
                      Context stays on your device (localStorage). Only your message + context is sent to the concierge endpoint.
                    </div>
                  </div>
                </div>
              )}

              {turns.length === 0 && (
                <div className="text-sm text-gray-600 leading-relaxed">
                  Tell me your goal (extensions or colour) and timeline, and I’ll guide you to the best next step.
                </div>
              )}

              <div className="space-y-3 mt-3">
                {turns.map((t, idx) => (
                  <div
                    key={idx}
                    className={`text-sm leading-relaxed ${t.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <span
                      className={`inline-block px-3 py-2 border ${
                        t.role === 'user'
                          ? 'bg-divine-gold/10 border-divine-gold/20 text-deep-charcoal'
                          : 'bg-goddess-white border-gray-100 text-gray-700'
                      }`}
                    >
                      {t.text}
                    </span>
                  </div>
                ))}

                {loading && <div className="text-sm text-gray-500">Thinking…</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}

                {lastResponse?.quickReplies?.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {lastResponse.quickReplies.slice(0, 5).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          emitAnalytics('widget_quick_reply', { q });
                          ask(q);
                        }}
                        className="px-3 py-2 border border-gray-200 bg-white text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:border-divine-gold"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                ) : null}

                {lastResponse?.nextSteps?.length ? (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {lastResponse.nextSteps.slice(0, 3).map((s) => (
                      <a
                        key={s.label}
                        href={s.href || '/booking'}
                        className="text-center px-3 py-3 bg-white border border-gray-100 hover:border-divine-gold text-[10px] uppercase tracking-widest font-bold text-divine-gold"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>
            </div>

            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about maintenance, timeline, prep…"
                  className="flex-1 p-3 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                />
                <button
                  onClick={() => ask(input)}
                  disabled={loading || !input.trim()}
                  className="px-4 bg-deep-charcoal text-white border border-white/10 hover:bg-divine-gold disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {chips.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      if ('action' in c && c.action === 'BOOK') {
                        window.location.href = '/booking';
                        return;
                      }
                      if ('ctx' in c) setCtx((prev) => ({ ...prev, ...c.ctx }));
                    }}
                    className="px-3 py-2 border border-gray-200 bg-white text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:border-divine-gold"
                  >
                    {c.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setLeadOpen((v) => {
                      emitAnalytics('lead_form_open', { open: !v });
                      return !v;
                    });
                    setLeadStatus('idle');
                    setLeadError(null);
                  }}
                  className="px-3 py-2 border border-gray-200 bg-white text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:border-divine-gold"
                >
                  Request callback
                </button>
              </div>

              {leadOpen && (
                <div className="mt-4 border border-gray-100 bg-white p-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Send to concierge</div>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      value={lead.name}
                      onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Name"
                      className="p-3 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                    />
                    <input
                      value={lead.email}
                      onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      className="p-3 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                    />
                    <input
                      value={lead.phone}
                      onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone"
                      className="p-3 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
                    />

                    <label className="flex items-start gap-2 text-[11px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={lead.consent}
                        onChange={(e) => setLead((p) => ({ ...p, consent: e.target.checked }))}
                        className="mt-1"
                      />
                      I consent to be contacted by Diosa Studio about my request.
                    </label>

                    <button
                      type="button"
                      onClick={sendLead}
                      disabled={leadStatus === 'sending' || !lead.consent || !lead.name || !lead.email || !lead.phone}
                      className="w-full px-4 py-3 bg-deep-charcoal text-white border border-white/10 hover:bg-divine-gold disabled:opacity-50 text-[11px] uppercase tracking-widest font-bold"
                    >
                      {leadStatus === 'sending' ? 'Sending…' : leadStatus === 'sent' ? 'Sent' : 'Send'}
                    </button>

                    {leadStatus === 'error' && <div className="text-sm text-red-600">{leadError}</div>}
                    {leadStatus === 'sent' && <div className="text-sm text-green-700">Sent. We’ll reach out soon.</div>}

                    <div className="text-[10px] text-gray-400">
                      We never store your contact details in the widget. This sends a one-time request.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {ctx.intakeSummary ? (
                  <button
                    type="button"
                    onClick={() => {
                      const preset = `Use my intake notes. Goal: ${ctx.goal || 'unsure'}. Timeline: ${ctx.timeline || ''}. Maintenance: ${ctx.maintenanceTolerance || ''}.\nSummary: ${ctx.intakeSummary}\n\nMy question: `;
                      setInput(preset);
                      emitAnalytics('widget_intake_autofill');
                    }}
                    className="px-3 py-2 border border-gray-200 bg-white text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:border-divine-gold"
                  >
                    Use my intake notes
                  </button>
                ) : null}
              </div>

              <div className="text-[10px] text-gray-400 mt-3">
                AI assistant. For pricing/suitability we confirm in consultation.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
