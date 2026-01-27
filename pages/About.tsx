import React from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { generatedImages } from '../data/generatedImages';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const About: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="font-accent text-3xl text-divine-gold mb-2">Our Studio</p>
          <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Diosa Studio Yorkville</h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A Yorkville extension studio built around one principle: your hair should look like yoursonly fuller, longer, and more confident.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center mb-20">
          <AnimatedSection>
            <div className="relative h-[520px] overflow-hidden">
              <OptimizedImage
                src={generatedImages.hero.src}
                srcSet={generatedImages.hero.srcSet}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt="Diosa Studio Yorkville"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <h2 className="text-3xl font-serif uppercase tracking-widest mb-6">Specialist Work, With Real Reassurance</h2>
            <div className="space-y-5 text-gray-600 leading-relaxed">
              <p>
                Yorkville clients expect more than beautiful hair—they expect discretion, comfort, and a process that respects the health of their natural hair.
              </p>
              <p>
                We specialize in damage-minimizing extension methods, meticulous colour matching, and seamless blending cuts that make the result look effortless.
              </p>
              <p>
                Our promise: premium quality, transparent maintenance planning, and results that hold up under daylight, camera flash, and close conversation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {[
                { title: 'Ethically Sourced Hair', desc: 'Premium feel, natural movement, long wear.' },
                { title: 'Damage-Minimizing Methods', desc: 'Comfort-first application with careful weight distribution.' },
                { title: 'Colour Matching', desc: 'Multi-tone matching for an invisible blend.' },
                { title: 'Concierge Maintenance', desc: 'A plan tailored to your lifestyle and growth cycle.' },
              ].map((x) => (
                <div key={x.title} className="border border-gray-100 bg-goddess-white p-6">
                  <div className="text-[10px] uppercase tracking-widest text-divine-gold font-bold mb-2">{x.title}</div>
                  <div className="text-gray-600">{x.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link to="/booking">
                <Button size="lg" variant="secondary">Book a Consultation</Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-serif uppercase tracking-widest mb-4">Yorkville-Level Service</h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            From your first consultation to your maintenance visits, every step is curated: timing, comfort, discretion, and flawless finish.
          </p>
        </AnimatedSection>
      </div>
    </div>
  );
};
