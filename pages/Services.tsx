import React from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { services } from '../data/salonContent';
import { generatedImages } from '../data/generatedImages';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const comparison = [
  {
    id: 'tape-in',
    bestFor: 'Fine to medium hair, seamless volume, faster install',
    wear: '6–8 weeks',
    maintenance: 'Move-up every 6–8 weeks',
  },
  {
    id: 'keratin-bond',
    bestFor: 'Maximum versatility, long wear, 360° movement',
    wear: '3–5 months',
    maintenance: 'Removal + re-install seasonally',
  },
  {
    id: 'hand-tied',
    bestFor: 'High density, damage-minimizing volume, luxury fullness',
    wear: '8–12 weeks',
    maintenance: 'Move-up every 8–10 weeks',
  },
  {
    id: 'sew-in',
    bestFor: 'Classic glamour, strong hold, even weight distribution',
    wear: '6–10 weeks',
    maintenance: 'Move-up every 6–10 weeks',
  },
];

export const Services: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="font-accent text-3xl text-divine-gold mb-2">Methods</p>
          <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">Methods & Maintenance</h1>
          <p className="text-gray-500 max-w-3xl mx-auto leading-relaxed">
            If you’ve ever worried extensions will look obvious or feel heavy, you’re not alone. We match method, weight, and placement to your hair integrity—then give you a maintenance cadence that keeps everything seamless.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {services.map((s) => (
            <AnimatedSection key={s.id} className="border border-gray-100 shadow-sm">
              <div id={s.id} className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-[360px] md:h-full">
                  <OptimizedImage
                    src={generatedImages.services[s.id]?.src}
                    srcSet={generatedImages.services[s.id]?.srcSet}
                    sizes="(min-width: 768px) 40vw, 100vw"
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-10">
                  <h2 className="text-2xl font-serif uppercase tracking-widest mb-3">{s.title}</h2>
                  <p className="text-gray-600 leading-relaxed mb-6">{s.longDescription}</p>
                  <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-widest text-gray-500 mb-6">
                    <div>
                      <div className="font-bold text-divine-gold">Price</div>
                      <div className="normal-case tracking-normal text-gray-700">{s.price}</div>
                    </div>
                    <div>
                      <div className="font-bold text-divine-gold">Duration</div>
                      <div className="normal-case tracking-normal text-gray-700">{s.duration}</div>
                    </div>
                    <div>
                      <div className="font-bold text-divine-gold">Longevity</div>
                      <div className="normal-case tracking-normal text-gray-700">{s.longevity}</div>
                    </div>
                    <div>
                      <div className="font-bold text-divine-gold">Consult</div>
                      <div className="normal-case tracking-normal text-gray-700">Complimentary</div>
                    </div>
                  </div>
                  {(s.bestFor?.length || s.moveUpCadence || s.wearTime || s.notes) && (
                    <div className="border-t border-gray-100 pt-6 mt-6">
                      {s.bestFor?.length ? (
                        <div className="mb-4">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Who it’s for</div>
                          <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                            {s.bestFor.slice(0, 3).map((b) => (
                              <li key={b} className="flex gap-2">
                                <span className="text-divine-gold">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {s.moveUpCadence ? (
                          <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Maintenance</div>
                            <div className="mt-2 text-gray-700 text-sm">{s.moveUpCadence}</div>
                          </div>
                        ) : null}
                        {s.wearTime ? (
                          <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Wear</div>
                            <div className="mt-2 text-gray-700 text-sm">{s.wearTime}</div>
                          </div>
                        ) : null}
                      </div>

                      {s.notes ? (
                        <div className="mt-4 text-gray-600 text-sm leading-relaxed">{s.notes}</div>
                      ) : null}
                    </div>
                  )}

                  <Link to="/booking">
                    <Button variant="secondary" className="w-full">Book a Consultation</Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mb-20">
          <h2 className="text-3xl font-serif uppercase tracking-widest mb-8 text-center">Method Comparison</h2>
          <div className="overflow-x-auto border border-gray-100">
            <table className="min-w-[800px] w-full text-left">
              <thead className="bg-goddess-white">
                <tr>
                  <th className="p-5 text-[10px] uppercase tracking-widest text-gray-400">Method</th>
                  <th className="p-5 text-[10px] uppercase tracking-widest text-gray-400">Best For</th>
                  <th className="p-5 text-[10px] uppercase tracking-widest text-gray-400">Wear</th>
                  <th className="p-5 text-[10px] uppercase tracking-widest text-gray-400">Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => {
                  const s = services.find((x) => x.id === row.id);
                  return (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="p-5 font-serif text-lg">{s?.title || row.id}</td>
                      <td className="p-5 text-gray-600">{row.bestFor}</td>
                      <td className="p-5 text-gray-600">{row.wear}</td>
                      <td className="p-5 text-gray-600">{row.maintenance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnimatedSection>

        <AnimatedSection className="text-center">
          <h2 className="text-3xl font-serif uppercase tracking-widest mb-4">Your Yorkville Process</h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            Consultation → Colour match → Installation → Blending cut & aftercare plan. We keep everything seamless, comfortable, and obsessively natural.
          </p>
          <Link to="/booking">
            <Button size="lg" variant="primary">Reserve a Consultation</Button>
          </Link>
        </AnimatedSection>
      </div>
    </div>
  );
};
