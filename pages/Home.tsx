import React, { Suspense, useEffect, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { ImageSkeleton } from '../components/ui/Skeleton';
import {
  services,
  transformations,
  testimonials,
  trustBadges,
  processSteps,
  aftercareTips,
  googleReviewUrl,
  proofStats,
  seasonalOffers,
} from '../data/salonContent';
import { generatedImages } from '../data/generatedImages';

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

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Simple hero image background */}
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={generatedImages.hero?.src || '/generated/hero/1000.webp'}
            srcSet={generatedImages.hero?.srcSet}
            sizes="100vw"
            alt="Luxury hair extensions by Diosa Studio"
            className="w-full h-full object-cover"
          />
        </div>

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
              <span className="block mt-2 text-gray-700">Comfort-first installs. Rooted blends. Daylight-proof results.</span>
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

      {/* Seasonal Value-Adds */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Value</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Premium Extras</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We don’t discount quality. We add value—so your result stays luminous, comfortable, and long-lasting.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seasonalOffers.map((o) => (
              <AnimatedSection key={o.title} className="border border-gray-100 bg-goddess-white p-8">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{o.title}</div>
                <p className="text-gray-700 mt-4 leading-relaxed">{o.detail}</p>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12">
            <Link to="/booking">
              <Button size="lg" variant="primary">Book a Consultation</Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Proof */}
      <section className="py-24 bg-goddess-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Proof</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Trusted Results</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">Real transformations. Precision blending. A clear maintenance plan.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proofStats.map((s) => (
              <AnimatedSection key={s.label} className="border border-gray-100 bg-white p-8">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{s.label}</div>
                <div className="mt-3 text-xl font-serif uppercase tracking-widest text-deep-charcoal">{s.value}</div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12">
            <a href={googleReviewUrl} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="border-deep-charcoal text-deep-charcoal hover:bg-deep-charcoal hover:text-white">
                Write a Google Review
              </Button>
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* Transformations */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="font-accent text-3xl text-divine-gold mb-2">Results</p>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Before & After</h2>
          </AnimatedSection>

          {/* Simple grid of transformation results */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {transformations.map((t) => {
              const afterImg = generatedImages.transformations[`${t.id}_after`];
              return (
                <AnimatedSection key={t.id} className="group relative aspect-[3/4] overflow-hidden bg-gray-100 border border-gray-200 hover:border-divine-gold transition-colors">
                  <OptimizedImage
                    src={afterImg?.src || t.after}
                    srcSet={afterImg?.srcSet}
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    alt={t.method}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-xs font-sans uppercase tracking-wider">{t.method}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
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
