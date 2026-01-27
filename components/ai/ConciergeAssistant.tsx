import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { Service } from '../../types';

export type ConciergeAnswers = {
  goal: 'Length' | 'Volume' | 'Both' | 'Not sure';
  hairType: 'Fine' | 'Medium' | 'Thick' | 'Not sure';
  lifestyle: 'Low maintenance' | 'Balanced' | 'High styling / updos';
  timeline: 'ASAP' | 'This month' | 'Just exploring';
};

const defaultAnswers: ConciergeAnswers = {
  goal: 'Both',
  hairType: 'Not sure',
  lifestyle: 'Balanced',
  timeline: 'This month',
};

type ConciergeApiResponse = {
  reply: string;
  quickReplies: string[];
  nextSteps: { label: string; action: 'BOOK' | 'SERVICES' | 'STYLE_GENERATOR'; href?: string }[];
};

function recommendService(answers: ConciergeAnswers, services: Service[]) {
  // Simple transparent scoring model (no external API): stable, explainable, safe.
  const scores = new Map<string, number>();
  for (const s of services) scores.set(s.id, 0);

  const bump = (id: string, by: number) => scores.set(id, (scores.get(id) || 0) + by);

  // Goal
  if (answers.goal === 'Volume') {
    bump('hand-tied', 3);
    bump('tape-in', 2);
  } else if (answers.goal === 'Length') {
    bump('keratin-bond', 3);
    bump('sew-in', 2);
  } else if (answers.goal === 'Both') {
    bump('hand-tied', 3);
    bump('keratin-bond', 2);
    bump('sew-in', 1);
  }

  // Hair type
  if (answers.hairType === 'Fine') {
    bump('tape-in', 3);
    bump('hand-tied', 1);
    bump('sew-in', -1);
  } else if (answers.hairType === 'Thick') {
    bump('hand-tied', 2);
    bump('sew-in', 2);
  }

  // Lifestyle
  if (answers.lifestyle === 'Low maintenance') {
    bump('keratin-bond', 2);
    bump('tape-in', 1);
  } else if (answers.lifestyle === 'High styling / updos') {
    bump('keratin-bond', 3);
    bump('hand-tied', 1);
    bump('tape-in', -1);
  }

  // Timeline
  if (answers.timeline === 'ASAP') {
    bump('tape-in', 2);
  }

  // Pick best
  let bestId = services[0]?.id;
  let bestScore = -Infinity;
  for (const [id, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  const bestService = services.find((s) => s.id === bestId) || services[0];

  return {
    bestService,
    rationale: {
      goal: answers.goal,
      hairType: answers.hairType,
      lifestyle: answers.lifestyle,
      timeline: answers.timeline,
    },
  };
}

export const ConciergeAssistant: React.FC<{ services: Service[]; onBook?: (serviceId: string) => void }> = ({ services, onBook }) => {
  const [mode, setMode] = useState<'match' | 'chat'>('match');

  // Match mode
  const [answers, setAnswers] = useState<ConciergeAnswers>(defaultAnswers);
  const rec = useMemo(() => recommendService(answers, services), [answers, services]);

  // Chat mode
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chat, setChat] = useState<ConciergeApiResponse | null>(null);

  async function askConcierge(text: string) {
    const msg = text.trim();
    if (!msg) return;

    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: {
            goal: answers.goal === 'Not sure' ? 'unsure' : answers.goal === 'Length' || answers.goal === 'Volume' || answers.goal === 'Both' ? 'extensions' : 'unsure',
            timeline: answers.timeline,
            maintenanceTolerance: answers.lifestyle === 'Low maintenance' ? 'low' : answers.lifestyle === 'High styling / updos' ? 'high' : 'medium',
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Concierge failed');
      setChat(json);
    } catch (e: any) {
      setChatError(e?.message || 'Something went wrong');
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="border border-gray-100 bg-white shadow-sm">
      <div className="p-8 md:p-10">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-divine-gold font-bold mb-2">AI-ASSISTED</p>
            <h3 className="text-2xl md:text-3xl font-serif uppercase tracking-widest">Concierge Match</h3>
            <p className="text-gray-600 mt-3 leading-relaxed max-w-2xl">
              Choose a quick match or ask the concierge. Your in-studio consultation confirms everything for hair integrity.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-divine-gold">
            <Icon icon="fluent-emoji:sparkles" size={22} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setMode('match')}
            className={`px-4 py-3 border-2 text-[11px] uppercase tracking-widest font-bold transition-all ${
              mode === 'match'
                ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                : 'bg-white border-gray-100 text-gray-500 hover:border-soft-champagne'
            }`}
          >
            Method Match
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-3 border-2 text-[11px] uppercase tracking-widest font-bold transition-all ${
              mode === 'chat'
                ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                : 'bg-white border-gray-100 text-gray-500 hover:border-soft-champagne'
            }`}
          >
            Ask Concierge
          </button>
        </div>

        {mode === 'match' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-7">
              <Question
                label="Your goal"
                value={answers.goal}
                options={['Length', 'Volume', 'Both', 'Not sure']}
                onChange={(v) => setAnswers((a) => ({ ...a, goal: v as ConciergeAnswers['goal'] }))}
              />
              <Question
                label="Hair type"
                value={answers.hairType}
                options={['Fine', 'Medium', 'Thick', 'Not sure']}
                onChange={(v) => setAnswers((a) => ({ ...a, hairType: v as ConciergeAnswers['hairType'] }))}
              />
              <Question
                label="Lifestyle"
                value={answers.lifestyle}
                options={['Low maintenance', 'Balanced', 'High styling / updos']}
                onChange={(v) => setAnswers((a) => ({ ...a, lifestyle: v as ConciergeAnswers['lifestyle'] }))}
              />
              <Question
                label="Timeline"
                value={answers.timeline}
                options={['ASAP', 'This month', 'Just exploring']}
                onChange={(v) => setAnswers((a) => ({ ...a, timeline: v as ConciergeAnswers['timeline'] }))}
              />
            </div>

            <div className="bg-goddess-white border border-gray-100 p-8 md:p-10">
              <div className="flex items-center gap-3 text-divine-gold mb-4">
                <Icon icon="fluent-emoji:magic-wand" size={18} />
                <p className="text-[10px] uppercase tracking-widest font-bold">Recommended method</p>
              </div>

              <h4 className="text-2xl font-serif uppercase tracking-widest mb-3">{rec.bestService.title}</h4>
              <p className="text-gray-600 leading-relaxed mb-8">{rec.bestService.description}</p>

              <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-widest text-gray-500 mb-10">
                <div className="flex items-center gap-2">
                  <Icon icon="fluent:shield-checkmark-20-regular" size={16} tone="gold" />
                  <span>Integrity-first</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="fluent:clock-20-regular" size={16} tone="gold" />
                  <span>{rec.bestService.longevity}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" onClick={() => onBook?.(rec.bestService.id)} className="flex-1">
                  Book Consultation
                </Button>
                <Button variant="ghost" onClick={() => setAnswers(defaultAnswers)} className="flex-1">
                  Reset
                </Button>
              </div>

              <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
                Tip: try Virtual Preview for inspiration, then bring your favorite reference to your consultation.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="border border-gray-100 bg-white p-6 md:p-8">
              <div className="flex items-center gap-2 text-divine-gold mb-4">
                <Icon icon="fluent:chat-24-regular" size={18} tone="gold" />
                <div className="text-[10px] uppercase tracking-widest font-bold">Ask a question</div>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed mb-4">
                Ask about timeline, maintenance, colour vs extensions, or what to prepare for your consultation.
              </div>

              <div className="flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., I want fuller hair but low maintenance—what should I book?"
                  className="flex-1 p-4 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold"
                />
                <Button
                  variant="primary"
                  disabled={chatLoading || !message.trim()}
                  onClick={() => {
                    const m = message;
                    setMessage('');
                    askConcierge(m);
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <Icon icon="fluent:send-20-regular" size={16} tone="white" />
                  Send
                </Button>
              </div>

              {chatError && <div className="text-sm text-red-600 mt-4">{chatError}</div>}

              {chat && (
                <div className="mt-6 border border-gray-100 bg-goddess-white p-5">
                  <div className="text-sm text-gray-700 leading-relaxed">{chat.reply}</div>

                  {chat.quickReplies?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {chat.quickReplies.map((q) => (
                        <button
                          key={q}
                          onClick={() => askConcierge(q)}
                          className="px-3 py-2 border border-gray-200 bg-white text-[11px] uppercase tracking-widest font-bold text-gray-600 hover:border-divine-gold"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {chat.nextSteps?.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {chat.nextSteps.map((s) => (
                        <a
                          key={s.label}
                          href={s.href || '/booking'}
                          className="text-center px-4 py-3 bg-white border border-gray-100 hover:border-divine-gold text-[11px] uppercase tracking-widest font-bold text-divine-gold"
                        >
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-gray-500 mt-4">
                    This assistant is AI-powered. For pricing and suitability, we confirm in consultation.
                  </div>
                </div>
              )}
            </div>

            <div className="bg-goddess-white border border-gray-100 p-6 md:p-8">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Quick context</div>
              <div className="text-sm text-gray-600 leading-relaxed mb-4">
                The concierge answers better with a little context. Use the quick match on the left to set your goals.
              </div>
              <div className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Current inputs</div>
              <div className="text-sm text-gray-700 mt-3 space-y-2">
                <div><span className="text-gray-500">Goal:</span> {answers.goal}</div>
                <div><span className="text-gray-500">Hair type:</span> {answers.hairType}</div>
                <div><span className="text-gray-500">Lifestyle:</span> {answers.lifestyle}</div>
                <div><span className="text-gray-500">Timeline:</span> {answers.timeline}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Question: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({
  label,
  value,
  options,
  onChange,
}) => {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">{label}</div>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-3 border-2 text-[11px] uppercase tracking-widest font-bold transition-all ${
              value === opt
                ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                : 'bg-white border-gray-100 text-gray-500 hover:border-soft-champagne'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
