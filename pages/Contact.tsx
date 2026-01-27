
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/ui/Icon';
import { emitAnalytics } from '../components/analytics/emit';
import { Button } from '../components/ui/Button';
import { AnimatedSection } from '../components/ui/AnimatedSection';

type RecommendResponse = {
  summary: string;
  recommendations: { title: string; why: string; maintenance: string }[];
  prepChecklist: string[];
  questionsToAsk: string[];
};

const AIIntake: React.FC<{ bookingContact: { name: string; email: string; phone: string } }> = ({ bookingContact }) => {
  const [goal, setGoal] = useState<'extensions' | 'color'>('extensions');
  const [desiredLook, setDesiredLook] = useState('');
  const [maintenanceTolerance, setMaintenanceTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [timeline, setTimeline] = useState('');
  const [hairHistory, setHairHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

  const [sendConsent, setSendConsent] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    emitAnalytics('intake_generate', { goal });

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, desiredLook, maintenanceTolerance, timeline, hairHistory }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'AI intake failed');
      setResult(json);
      emitAnalytics('intake_success', { goal, recs: json.recommendations?.length || 0 });

      // Persist non-PII intake context for the floating concierge widget.
      try {
        const raw = localStorage.getItem('diosa_concierge_widget_v2');
        const prev = raw ? JSON.parse(raw) : {};
        const ctx = {
          ...(prev.ctx || {}),
          goal,
          timeline,
          maintenanceTolerance,
          hairHistory,
          desiredLook,
          intakeSummary: json.summary,
        };
        localStorage.setItem('diosa_concierge_widget_v2', JSON.stringify({ ...(prev || {}), ctx }));
      } catch {
        // ignore
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      emitAnalytics('intake_error', { message: e?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Goal</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`p-4 border-2 text-left transition-all ${goal === 'extensions' ? 'bg-divine-gold/10 border-divine-gold text-divine-gold' : 'bg-white border-gray-100 hover:border-soft-champagne'}`}
              onClick={() => setGoal('extensions')}
              type="button"
            >
              <div className="text-[11px] uppercase tracking-widest font-bold">Extensions</div>
              <div className="text-sm mt-2 text-gray-600">Length / volume outcomes</div>
            </button>
            <button
              className={`p-4 border-2 text-left transition-all ${goal === 'color' ? 'bg-divine-gold/10 border-divine-gold text-divine-gold' : 'bg-white border-gray-100 hover:border-soft-champagne'}`}
              onClick={() => setGoal('color')}
              type="button"
            >
              <div className="text-[11px] uppercase tracking-widest font-bold">Colour</div>
              <div className="text-sm mt-2 text-gray-600">Tone / dimension outcomes</div>
            </button>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Desired look</div>
          <textarea
            value={desiredLook}
            onChange={(e) => setDesiredLook(e.target.value)}
            rows={4}
            className="w-full p-4 bg-goddess-white border border-gray-100 outline-none focus:border-divine-gold"
            placeholder="e.g., blended length to mid-back, soft waves; or caramel bronde balayage with root melt"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Maintenance</div>
            <select
              value={maintenanceTolerance}
              onChange={(e) => setMaintenanceTolerance(e.target.value as any)}
              className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Timeline</div>
            <input
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
              placeholder="e.g., ASAP / this month"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Hair history</div>
            <input
              value={hairHistory}
              onChange={(e) => setHairHistory(e.target.value)}
              className="w-full p-3 bg-white border border-gray-100 outline-none focus:border-divine-gold text-sm"
              placeholder="e.g., bleach 6mo ago"
            />
          </div>
        </div>

        <Button variant="primary" onClick={onGenerate} disabled={loading} className="inline-flex items-center gap-2">
          {loading ? (
            <>
              <Icon icon="fluent:spinner-ios-20-regular" size={16} tone="gold" className="animate-spin" />
              Generating notes…
            </>
          ) : (
            'Generate consultation notes'
          )}
        </Button>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="border border-gray-100 bg-goddess-white p-6">
        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Your notes</div>

        {!result ? (
          <div className="text-sm text-gray-600 leading-relaxed">Generate a checklist and we’ll summarize your best next steps for the consultation.</div>
        ) : (
          <div className="space-y-5">
            <div className="text-sm text-gray-700 leading-relaxed">{result.summary}</div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Recommendations</div>
              <div className="space-y-3">
                {result.recommendations?.map((r) => (
                  <div key={r.title} className="border border-gray-100 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-divine-gold">{r.title}</div>
                    <div className="text-sm text-gray-700 mt-2">{r.why}</div>
                    <div className="text-[11px] text-gray-500 mt-2">Maintenance: {r.maintenance}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Prep checklist</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.prepChecklist?.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Questions to ask</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.questionsToAsk?.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-100 bg-white p-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Send these notes</div>
              <div className="text-sm text-gray-600 leading-relaxed">
                If you’d like, you can send this brief to our concierge team so we’re prepared before we reply.
              </div>

              <label className="flex items-start gap-2 text-[11px] text-gray-600 mt-3">
                <input type="checkbox" checked={sendConsent} onChange={(e) => setSendConsent(e.target.checked)} className="mt-1" />
                I consent to be contacted by Diosa Studio about my request.
              </label>

              <button
                type="button"
                disabled={sendStatus === 'sending' || !sendConsent || !bookingContact.name || !bookingContact.email || !bookingContact.phone}
                onClick={async () => {
                  setSendStatus('sending');
                  setSendError(null);

                  try {
                    emitAnalytics('intake_send_notes_attempt');
                    const res = await fetch('/api/lead', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: bookingContact.name,
                        email: bookingContact.email,
                        phone: bookingContact.phone,
                        consent: true,
                        message: `AI Intake Summary: ${result.summary}`,
                        context: {
                          goal,
                          desiredLook,
                          maintenanceTolerance,
                          timeline,
                          hairHistory,
                          recommendations: result.recommendations,
                          prepChecklist: result.prepChecklist,
                          questionsToAsk: result.questionsToAsk,
                        },
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      if (res.status === 501) {
                        setSendStatus('error');
                        setSendError('Sending notes is temporarily unavailable. Please book directly and bring your notes to the consultation.');
                        emitAnalytics('intake_send_notes_error', { status: 501 });
                        return;
                      }
                      throw new Error(json?.error || 'Failed to send');
                    }

                    setSendStatus('sent');
                    emitAnalytics('intake_send_notes_success');
                  } catch (e: any) {
                    setSendStatus('error');
                    setSendError(e?.message || 'Failed to send');
                    emitAnalytics('intake_send_notes_error', { message: e?.message });
                  }
                }}
                className="mt-3 w-full px-4 py-3 bg-deep-charcoal text-white border border-white/10 hover:bg-divine-gold disabled:opacity-50 text-[11px] uppercase tracking-widest font-bold"
              >
                {sendStatus === 'sending' ? 'Sending…' : sendStatus === 'sent' ? 'Sent' : 'Send to concierge'}
              </button>

              {sendStatus === 'error' && <div className="text-sm text-red-600 mt-3">{sendError}</div>}
              {sendStatus === 'sent' && <div className="text-sm text-green-700 mt-3">Sent. We’ll follow up shortly.</div>}

              <div className="text-[10px] text-gray-400 mt-3">We only send when you explicitly consent.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const styleId = searchParams.get('styleId');
  const styleName = searchParams.get('styleName');
  const [formData, setFormData] = useState({
    service: '',
    length: '',
    date: '',
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const s = searchParams.get('serviceId') || searchParams.get('service');
    if (!s) return;

    // Accept either service IDs (tape-in, keratin-bond, etc.) or human labels.
    const map: Record<string, string> = {
      'tape-in': 'Tape-In Extensions',
      'keratin-bond': 'Keratin Bond Extensions',
      'hand-tied': 'Hand-Tied Wefts',
      'sew-in': 'Maintenance & Styling',
    };

    setFormData((prev) => ({
      ...prev,
      service: map[s] || s,
    }));
  }, [searchParams]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const steps = [
    { title: 'Selection', icon: 'fluent-emoji:scissors' },
    { title: 'Profile', icon: 'fluent-emoji:sparkles' },
    { title: 'Date', icon: 'fluent:calendar-20-regular' },
    { title: 'Details', icon: 'fluent:person-20-regular' }
  ];

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
          {styleName && (
            <div className="mb-8 border border-divine-gold/20 bg-divine-gold/10 px-6 py-4 text-left">
              <div className="flex items-center gap-2 text-divine-gold font-bold text-[10px] uppercase tracking-widest mb-2">
                <Icon icon="fluent-emoji:sparkles" size={14} />
                Inspired by your AI preview
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">Selected style:</span> {styleName}
              </div>
              <div className="text-[11px] text-gray-600 mt-2">
                Bring this reference to your consultationwell translate it into the best method and colour match for your hair integrity.
              </div>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Complimentary Consultation</h1>

          <div className="mt-10 border border-gray-100 bg-white p-6 md:p-8 text-left">
            <div className="flex items-center gap-2 text-divine-gold font-bold text-[10px] uppercase tracking-widest mb-3">
              <Icon icon="fluent-emoji:sparkles" size={14} />
              AI Intake Assistant
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Answer a few details and we’ll generate a prep checklist and consultation notes you can bring to your appointment.
            </p>

            <AIIntake bookingContact={{ name: formData.name, email: formData.email, phone: formData.phone }} />
          </div>
          <p className="text-gray-500 font-sans tracking-wide">Tell us your goal and timeline—we’ll respond with next steps, method options, and a maintenance cadence built for your hair integrity.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="border border-gray-100 bg-white p-5">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">What happens next</div>
              <div className="text-sm text-gray-700 mt-2">We confirm suitability, recommend method (extensions) or plan (colour), then book your in-studio consultation.</div>
            </div>
            <div className="border border-gray-100 bg-white p-5">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">What to prepare</div>
              <div className="text-sm text-gray-700 mt-2">Bring your hair history (recent colour, bleach, keratin) and inspiration photos. Natural-light photos help most.</div>
            </div>
            <div className="border border-gray-100 bg-white p-5">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Maintenance cadence</div>
              <div className="text-sm text-gray-700 mt-2">Extensions typically move up every 6–10 weeks. Colour refreshes vary—toners/glosses are usually 6–8 weeks.</div>
            </div>
          </div>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          {/* Step Progress */}
          <div className="flex justify-between items-center mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-10" />
            {steps.map((s, i) => {
              const isActive = step >= i + 1;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isActive ? 'bg-divine-gold border-divine-gold text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                    <Icon icon={s.icon} size={20} />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest mt-3 font-bold ${isActive ? 'text-divine-gold' : 'text-gray-300'}`}>{s.title}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-goddess-white p-8 md:p-12 shadow-xl border border-gray-100 min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 flex-1"
                >
                  <h2 className="text-2xl font-serif text-deep-charcoal mb-8">What service are you looking for?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Tape-In Extensions', 'Keratin Bond Extensions', 'Hand-Tied Wefts', 'Maintenance & Styling'].map((serv) => (
                      <button
                        key={serv}
                        onClick={() => setFormData({...formData, service: serv})}
                        className={`p-6 text-left border-2 transition-all duration-300 ${formData.service === serv ? 'bg-divine-gold/10 border-divine-gold text-divine-gold' : 'bg-white border-transparent hover:border-soft-champagne'}`}
                      >
                        <span className="font-sans font-semibold tracking-wide">{serv}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 flex-1"
                >
                  <h2 className="text-2xl font-serif text-deep-charcoal mb-8">Desired Length & Volume?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Subtle Volume', 'Natural Length', 'Full Transformation'].map((len) => (
                      <button
                        key={len}
                        onClick={() => setFormData({...formData, length: len})}
                        className={`p-6 text-center border-2 transition-all duration-300 ${formData.length === len ? 'bg-divine-gold/10 border-divine-gold text-divine-gold' : 'bg-white border-transparent hover:border-soft-champagne'}`}
                      >
                        <span className="font-sans font-semibold tracking-wide block mb-2">{len}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Select Plan</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 flex-1"
                >
                  <h2 className="text-2xl font-serif text-deep-charcoal mb-8">When would you like to visit?</h2>
                  <input 
                    type="date" 
                    className="w-full p-4 border-2 border-transparent bg-white focus:border-divine-gold outline-none font-sans"
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex-1"
                >
                  <h2 className="text-2xl font-serif text-deep-charcoal mb-8">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-100 outline-none focus:border-divine-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-100 outline-none focus:border-divine-gold"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-100 outline-none focus:border-divine-gold"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div 
                  key="step5" 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 bg-divine-gold text-white rounded-full flex items-center justify-center mx-auto mb-8">
                    <Icon icon="fluent-emoji:check-mark-button" size={40} />
                  </div>
                  <h2 className="text-3xl font-serif text-deep-charcoal mb-4 uppercase tracking-widest">Consultation Request Received</h2>
                  <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">Thank you, {formData.name || 'Guest'}. Our booking concierge will contact you shortly to finalize your transformation appointment.</p>
                  <Button variant="secondary" className="mt-12" onClick={() => setStep(1)}>New Request</Button>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 5 && (
              <div className="mt-12 flex justify-between border-t border-gray-100 pt-8">
                <Button 
                  variant="ghost" 
                  onClick={prevStep} 
                  disabled={step === 1}
                  className="disabled:opacity-0"
                >
                  Back
                </Button>
                <Button 
                  variant="primary" 
                  onClick={nextStep}
                  disabled={step === 1 && !formData.service || step === 2 && !formData.length}
                >
                  {step === 4 ? 'Confirm Reservation' : 'Continue'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
