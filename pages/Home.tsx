import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { services, transformations, testimonials, trustBadges, processSteps, aftercareTips } from '../data/salonContent';
import { generatedImages } from '../data/generatedImages';
import { OptimizedImage } from '../components/ui/OptimizedImage';

// Lazy load heavier AI components to reduce initial bundle weight.
const ConciergeAssistant = React.lazy(() =>
  import('../components/ai/ConciergeAssistant').then((m) => ({ default: m.ConciergeAssistant }))
);
const StyleGenerator = React.lazy(() => import('../components/ai/StyleGenerator').then((m) => ({ default: m.StyleGenerator })));
const HeroScene = React.lazy(() => import('../components/3d/HeroScene').then((m) => ({ default: m.HeroScene })));

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

  // Load 3D only on capable devices and after idle.
  const [show3d, setShow3d] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = mql.matches;

    const isSmall = window.matchMedia('(max-width: 767px)').matches;
    const cores = (navigator as any).hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 4;
    const lowPower = cores <= 4 || mem <= 4;

    // Network-aware gating: don't load 3D on Save-Data or very slow connections.
    const conn = (navigator as any).connection as undefined | { saveData?: boolean; effectiveType?: string };
    const saveData = Boolean(conn?.saveData);
    const effective = String(conn?.effectiveType || '');
    const isVerySlow = effective === 'slow-2g' || effective === '2g';
    const isSlow = isVerySlow || effective === '3g';

    // User override: allow opting in/out of 3D.
    const prefRaw = localStorage.getItem('diosa_3d_enabled');
    const pref = prefRaw === 'true' ? true : prefRaw === 'false' ? false : null;

    // Default: enable on capable devices, but disable on 3g/2g/save-data unless user explicitly opts in.
    if (pref === false) return;
    if (isReduced || isSmall || lowPower || saveData) return;
    if (isSlow && pref !== true) return;

    const run = () => setShow3d(true);
    // Prefer idle time; fall back to a short delay.
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
    if (ric) {
      const id = ric(run, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }

    const t = window.setTimeout(run, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const nextTransformation = () => {
    setActiveTransformation((prev) => (prev + 1) % transformations.length);
  };

  const prevTransformation = () => {
    setActiveTransformation((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  const active = transformations[activeTransformation];
  const beforeAsset = generatedImages.transformations[`${active.id}_before`];
  const afterAsset = generatedImages.transformations[`${active.id}_after`];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={generatedImages.hero.src}
            srcSet={generatedImages.hero.srcSet}
            sizes="100vw"
            alt="Luxury hair extensions in Yorkville"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Premium 3D accent layer (lazy + capability gated) */}
        {show3d && (
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        )}

        <div className="absolute inset-0 bg-deep-charcoal/40 z-10" />

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
              <button
                type="button"
                className="border border-white/20 px-3 py-2 hover:border-divine-gold hover:text-divine-gold transition-colors"
                onClick={() => {
                  const cur = localStorage.getItem('diosa_3d_enabled');
                  const next = cur === 'true' ? 'false' : 'true';
                  localStorage.setItem('diosa_3d_enabled', next);
                  // Refresh state by reloading (simple + reliable for now)
                  window.location.reload();
                }}
              >
                Toggle 3D Hero
              </button>
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
                      View <ArrowRight size={14} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-100 bg-goddess-white p-6">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Before</div>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={beforeAsset?.src || active.before}
                    srcSet={beforeAsset?.srcSet}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="border border-gray-100 bg-goddess-white p-6">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">After</div>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={afterAsset?.src || active.after}
                    srcSet={afterAsset?.srcSet}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button onClick={prevTransformation} className="p-3 border border-gray-200 hover:border-divine-gold transition-colors">
                <ChevronLeft />
              </button>
              <div className="text-center">
                <div className="text-sm text-gray-700 font-serif uppercase tracking-widest">{active.method}</div>
              </div>
              <button onClick={nextTransformation} className="p-3 border border-gray-200 hover:border-divine-gold transition-colors">
                <ChevronRight />
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
                    <Star key={i} size={14} />
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
