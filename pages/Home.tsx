import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../components/ui/Icon';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { services, transformations, testimonials, trustBadges, processSteps, aftercareTips } from '../data/salonContent';
import { generatedImages } from '../data/generatedImages';
import { BeforeAfterSlider } from '../components/ui/BeforeAfterSlider';

// Lazy load heavier AI components to reduce initial bundle weight.
const ConciergeAssistant = React.lazy(() =>
  import('../components/ai/ConciergeAssistant').then((m) => ({ default: m.ConciergeAssistant }))
);
const StyleGenerator = React.lazy(() => import('../components/ai/StyleGenerator').then((m) => ({ default: m.StyleGenerator })));

function useNearViewport(offsetPx = 200) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const onScroll = () => {
      const y = window.scrollY + window.innerHeight;
      const threshold = document.documentElement.scrollHeight - offsetPx;
      if (y >= threshold) {
        setEnabled(true);
        window.removeEventListener('scroll', onScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled, offsetPx]);

  return enabled;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTransformation, setActiveTransformation] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scroll = params.get('scroll');
    if (scroll === 'style-generator') {
      setTimeout(() => {
        document.getElementById('style-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [location.search]);

  // Load concierge late (after main content).
  const loadConcierge = useNearViewport(800);

  const nextTransformation = () => {
    setActiveTransformation((prev) => (prev + 1) % transformations.length);
  };

  const prevTransformation = () => {
    setActiveTransformation((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  const setTransformation = (idx: number) => {
    setActiveTransformation(((idx % transformations.length) + transformations.length) % transformations.length);
  };

  // Auto-rotate every 10 seconds; pause on interaction and when tab is hidden.
  const [autoRotatePaused, setAutoRotatePaused] = useState(false);

  useEffect(() => {
    if (autoRotatePaused) return;
    if (transformations.length <= 1) return;

    const onVis = () => {
      if (document.hidden) setAutoRotatePaused(true);
    };
    document.addEventListener('visibilitychange', onVis);

    const t = window.setInterval(() => {
      setActiveTransformation((prev) => (prev + 1) % transformations.length);
    }, 10_000);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(t);
    };
  }, [autoRotatePaused]);

  const active = transformations[activeTransformation];
  const beforeAsset = generatedImages.transformations[`${active.id}_before`];
  const afterAsset = generatedImages.transformations[`${active.id}_after`];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative h-screen w-full flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setAutoRotatePaused(true)}
        onFocusCapture={() => setAutoRotatePaused(true)}
        onMouseLeave={() => setAutoRotatePaused(false)}
      >
        <div className="absolute inset-0 z-0">
          <BeforeAfterSlider
            before={{ src: beforeAsset?.src || active.before, srcSet: beforeAsset?.srcSet, alt: 'Before result' }}
            after={{ src: afterAsset?.src || active.after, srcSet: afterAsset?.srcSet, alt: 'After result' }}
            className="h-full w-full"
            initialRatio={0.42}
            autoSweep
            onUserInteract={() => setAutoRotatePaused(true)}
          />
        </div>

        {/* Keep 3D disabled in the new hero to prioritize photoreal transformations + performance.
            (We can re-introduce as a subtle layer later if desired.) */}

        <div className="absolute inset-0 bg-deep-charcoal/45 z-10" />

        <div className="container relative z-20 mx-auto px-6 text-center">
          <AnimatedSection>
            <p className="font-accent text-4xl md:text-5xl text-divine-gold mb-4">Diosa Studio</p>
            <h1 className="text-4xl md:text-7xl font-serif text-white uppercase tracking-widest mb-6">Yorkville Extension Specialists</h1>
            <p className="text-lg md:text-xl text-soft-champagne/90 max-w-2xl mx-auto mb-10 font-sans tracking-wide">
              Luxury hair extensions and hair colour—integrity-first methods, precision matching, and maintenance that keeps results seamless.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/booking">
                <Button size="lg" className="bg-white text-deep-charcoal hover:bg-divine-gold hover:text-white border-none">
                  Book Your Consultation
                </Button>
              </Link>
              <Link to="/style-generator">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-deep-charcoal">
                  Try Virtual Preview
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-white/70 text-[10px] uppercase tracking-widest font-bold">
              <div className="inline-flex flex-wrap items-center gap-3 border border-white/20 px-3 py-2">
                <span>
                  Real results • {active.method} • {activeTransformation + 1}/{transformations.length}
                </span>
                <button
                  type="button"
                  className="text-white/80 hover:text-divine-gold transition-colors"
                  onClick={() => {
                    setAutoRotatePaused((p) => !p);
                  }}
                >
                  {autoRotatePaused ? 'Play' : 'Pause'}
                </button>
              </div>

              {/* Dots navigation (shows all 10 variations clearly) */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {transformations.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-label={`Show result ${idx + 1}: ${t.method}`}
                    className={`h-2.5 w-2.5 rounded-full border transition-colors ${idx === activeTransformation ? 'bg-divine-gold border-divine-gold' : 'bg-transparent border-white/30 hover:border-divine-gold/80'}`}
                    onClick={() => {
                      setAutoRotatePaused(true);
                      setTransformation(idx);
                    }}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustBadges.map((badge) => (
              <AnimatedSection key={badge.title} className="border border-gray-100 p-8 bg-goddess-white">
                <div className="text-[10px] uppercase tracking-widest text-divine-gold font-bold">{badge.subtitle}</div>
                <div className="text-2xl font-serif uppercase tracking-widest mt-3">{badge.title}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Methods</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Extensions & Colour</h2>
            <p className="text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Method selection is about integrity and lifestyle. We match weight, placement, and maintenance cadence—so your result stays seamless.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <AnimatedSection key={service.id} className="border border-gray-100 bg-white shadow-sm">
                <div className="relative h-[220px]">
                  <OptimizedImage
                    src={generatedImages.services[service.id]?.src || service.imageUrl}
                    srcSet={generatedImages.services[service.id]?.srcSet}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-serif uppercase tracking-widest mb-3">{service.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-divine-gold text-[10px] uppercase tracking-widest font-bold">{service.price}</span>
                    <button
                      className="text-divine-gold text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2"
                      onClick={() => navigate(`/services#${service.id}`)}
                    >
                      View <Icon icon="fluent:chevron-right-16-regular" size={14} tone="gold" />
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-goddess-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Process</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Concierge Consultation</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Consultation → colour match → installation → blending cut & aftercare plan.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((s) => (
              <AnimatedSection key={s.title} className="border border-gray-100 bg-white p-8">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{s.title}</div>
                <p className="text-gray-700 mt-4 leading-relaxed">{s.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Transformations */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Results</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Before & After</h2>
          </AnimatedSection>

          <div className="max-w-5xl mx-auto">
            <div className="border border-gray-100 bg-goddess-white p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Drag to compare</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Before / After</div>
              </div>
              <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                <BeforeAfterSlider
                  before={{ src: beforeAsset?.src || active.before, srcSet: beforeAsset?.srcSet, alt: 'Before' }}
                  after={{ src: afterAsset?.src || active.after, srcSet: afterAsset?.srcSet, alt: 'After' }}
                  className="h-full w-full"
                  initialRatio={0.5}
                  onUserInteract={() => setAutoRotatePaused(true)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button onClick={prevTransformation} className="p-3 border border-gray-200 hover:border-divine-gold transition-colors" aria-label="Previous transformation">
                <Icon icon="fluent:chevron-left-24-regular" size={22} tone="charcoal" />
              </button>
              <div className="text-center">
                <div className="text-sm text-gray-700 font-serif uppercase tracking-widest">{active.method}</div>
              </div>
              <button onClick={nextTransformation} className="p-3 border border-gray-200 hover:border-divine-gold transition-colors" aria-label="Next transformation">
                <Icon icon="fluent:chevron-right-24-regular" size={22} tone="charcoal" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-goddess-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Reviews</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Client Love</h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <AnimatedSection key={t.name} className="bg-white border border-gray-100 p-8">
                <div className="flex items-center gap-1 text-divine-gold mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Icon key={i} icon="fluent-emoji:glowing-star" size={14} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">{t.content}</p>
                <div className="mt-6 text-[11px] uppercase tracking-widest font-bold text-gray-500">{t.name}</div>
                <div className="text-[11px] text-gray-400 mt-1">{t.role}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* AI Style Generator (lazy loaded) */}
      <section id="style-generator" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <Suspense fallback={<div className="text-center text-gray-500">Loading virtual preview…</div>}>
              <StyleGenerator />
            </Suspense>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={generatedImages.cta.src}
            srcSet={generatedImages.cta.srcSet}
            sizes="100vw"
            alt="Luxury consultation"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-deep-charcoal/60 z-10" />
        <div className="container relative z-20 mx-auto px-6 text-center text-white">
          <AnimatedSection>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 max-w-3xl mx-auto">Ready for a Seamless Result?</h2>
            <p className="text-lg text-soft-champagne/80 mb-12 max-w-xl mx-auto font-sans tracking-wide">
              A consultation-first process with integrity checks, precision matching, and a clear maintenance cadence.
            </p>
            <Link to="/booking">
              <Button size="lg" className="bg-white text-deep-charcoal hover:bg-divine-gold hover:text-white border-none">
                Book Your Consultation
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Concierge (late-loaded) */}
      {loadConcierge && (
        <Suspense fallback={null}>
          <ConciergeAssistant
            services={services}
            onBook={(serviceId) => {
              // Conversion-first: route to booking with context.
              navigate(`/booking?service=${encodeURIComponent(serviceId)}`);
            }}
          />
        </Suspense>
      )}

      {/* Aftercare */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Aftercare</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Maintain the Seam</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your result stays flawless when care is consistent. Here are the essentials.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aftercareTips.map((t) => (
              <AnimatedSection key={t.title} className="border border-gray-100 bg-goddess-white p-8">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{t.title}</div>
                <p className="text-gray-700 mt-4 leading-relaxed">{t.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
