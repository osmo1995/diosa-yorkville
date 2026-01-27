import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { OptimizedImage } from '../ui/OptimizedImage';
import { stylePreviews, extensionStylePreviews } from '../../data/stylePreviews';
import { extensionColorOptionsFull, extensionLengthOptions, extensionPreviewColorIds } from '../../data/brandInsights';

type Category = 'extensions' | 'color';

type StylePreset = {
  id: string;
  category: Category;
  name: string;
  description: string;
};

const PRESETS: StylePreset[] = [
  // EXTENSIONS
  {
    id: 'extensions-natural-blend',
    category: 'extensions',
    name: 'Natural Blend',
    description: 'Subtle density and length—seamless, undetectable finish.',
  },
  {
    id: 'extensions-volume-set',
    category: 'extensions',
    name: 'Volume Set',
    description: 'Noticeable fullness through the mid-lengths and ends, still natural.',
  },
  {
    id: 'extensions-length-set',
    category: 'extensions',
    name: 'Length Set',
    description: 'Add length with a soft, blended perimeter and healthy shine.',
  },
  {
    id: 'extensions-glam-density',
    category: 'extensions',
    name: 'Glam Density',
    description: 'High-density, camera-ready hair with a luxe finish (no color change).',
  },
  {
    id: 'extensions-sleek-straight',
    category: 'extensions',
    name: 'Sleek Straight Extensions',
    description: 'Ultra-smooth, polished finish with seamless extension blending.',
  },
  {
    id: 'extensions-soft-waves',
    category: 'extensions',
    name: 'Soft Waves + Extensions',
    description: 'Soft S-waves with blended length and natural movement.',
  },
  {
    id: 'extensions-glam-waves',
    category: 'extensions',
    name: 'Glam Waves + Extensions',
    description: 'Defined, luxurious waves with a high-end, camera-ready finish.',
  },
  {
    id: 'extensions-bouncy-blowout',
    category: 'extensions',
    name: 'Bouncy Blowout + Extensions',
    description: 'A voluminous blowout look with soft bend and premium shine.',
  },

  // COLOR
  {
    id: 'color-neutral-gloss',
    category: 'color',
    name: 'Neutral Gloss',
    description: 'A polished gloss refresh—healthy shine and refined tone (no length change).',
  },
  {
    id: 'color-caramel-bronde',
    category: 'color',
    name: 'Caramel Bronde',
    description: 'Warm caramel dimension with a natural, luxe finish.',
  },
  {
    id: 'color-cool-ash-brunette',
    category: 'color',
    name: 'Cool Ash Brunette',
    description: 'Cool-toned brunette refinement with shine and softness.',
  },
  {
    id: 'color-champagne-balayage',
    category: 'color',
    name: 'Champagne Balayage',
    description: 'Bright, dimensional champagne tones with a natural root.',
  },
  {
    id: 'color-copper-glow',
    category: 'color',
    name: 'Copper Glow',
    description: 'Rich copper warmth with salon-realistic dimension and gloss.',
  },
  {
    id: 'color-espresso-depth',
    category: 'color',
    name: 'Espresso Depth',
    description: 'Deeper brunette richness with mirror gloss (no added length).',
  },
];

const EXTENSION_PRESETS = PRESETS.filter((p) => p.category === 'extensions');
const COLOR_PRESETS = PRESETS.filter((p) => p.category === 'color');

// Extensions controls
const EXT_DENSITY = ['natural', 'full', 'glam'] as const;
const EXT_FINISH = ['straight', 'soft-waves', 'glam-waves'] as const;

type ExtInches = (typeof extensionLengthOptions)[number]['id'];
type ExtDensity = (typeof EXT_DENSITY)[number];
type ExtFinish = (typeof EXT_FINISH)[number];

// Color controls
const COLOR_TONE = ['cool', 'neutral', 'warm'] as const;
const COLOR_BRIGHTNESS = ['minimal', 'moderate'] as const;
const COLOR_DIMENSION = ['subtle', 'medium', 'bold'] as const;
const COLOR_ROOT = ['keep-natural', 'root-melt'] as const;

type ColorTone = (typeof COLOR_TONE)[number];
type ColorBrightness = (typeof COLOR_BRIGHTNESS)[number];
type ColorDimension = (typeof COLOR_DIMENSION)[number];
type ColorRoot = (typeof COLOR_ROOT)[number];

function humanize(v: string) {
  return v
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export const StyleGenerator: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [category, setCategory] = useState<Category>('extensions');
  const [styleId, setStyleId] = useState<string>(EXTENSION_PRESETS[0].id);
  const [intensity, setIntensity] = useState(0.6);

  // Extensions options
  const [extInches, setExtInches] = useState<ExtInches>('18');
  const [extColorId, setExtColorId] = useState<string>('keep-natural');
  const [extDensity, setExtDensity] = useState<ExtDensity>('full');
  const [extFinish, setExtFinish] = useState<ExtFinish>('soft-waves');

  // Color options
  const [colorTone, setColorTone] = useState<ColorTone>('neutral');
  const [colorBrightness, setColorBrightness] = useState<ColorBrightness>('minimal');
  const [colorDimension, setColorDimension] = useState<ColorDimension>('medium');
  const [colorRoot, setColorRoot] = useState<ColorRoot>('keep-natural');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'removing' | 'generating' | null>(null);
  const loadingPhaseTimerRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{ styleId: string; styleName: string } | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const selectedPreset = PRESETS.find((p) => p.id === styleId) || EXTENSION_PRESETS[0];

  function switchCategory(next: Category) {
    setCategory(next);
    const nextPreset = next === 'extensions' ? EXTENSION_PRESETS[0] : COLOR_PRESETS[0];
    setStyleId(nextPreset.id);
    setResultUrl(null);
    setResultMeta(null);
    setError(null);
  }

  async function onGenerate() {
    if (!file) return;

    if (loadingPhaseTimerRef.current) {
      window.clearTimeout(loadingPhaseTimerRef.current);
      loadingPhaseTimerRef.current = null;
    }

    setIsLoading(true);
    setLoadingPhase('removing');
    setError(null);
    setResultUrl(null);

    loadingPhaseTimerRef.current = window.setTimeout(() => {
      setLoadingPhase((prev) => (prev ? 'generating' : prev));
      loadingPhaseTimerRef.current = null;
    }, 1200);

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('styleId', styleId);
      fd.append('intensity', String(intensity));
      fd.append('category', category);

      if (category === 'extensions') {
        fd.append('extInches', extInches);
        fd.append('extColorId', extColorId);
        fd.append('extDensity', extDensity);
        fd.append('extFinish', extFinish);
      } else { 
        fd.append('colorTone', colorTone);
        fd.append('colorBrightness', colorBrightness);
        fd.append('colorDimension', colorDimension);
        fd.append('colorRoot', colorRoot);
      }

      const res = await fetch('/api/style', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Style generation failed.');

      const dataUrl = `data:${json.mimeType};base64,${json.imageBase64}`;
      setResultUrl(dataUrl);
      setResultMeta({ styleId: json.styleId || styleId, styleName: json.styleName || selectedPreset.name });
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      if (loadingPhaseTimerRef.current) {
        window.clearTimeout(loadingPhaseTimerRef.current);
        loadingPhaseTimerRef.current = null;
      }
      setIsLoading(false);
      setLoadingPhase(null);
    }
  }

  return (
    <div className="border border-gray-100 bg-white shadow-sm">
      <div className="p-8 md:p-10">
        <div className="flex items-start justify-between gap-8 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-divine-gold font-bold mb-2">AI STYLE GENERATOR</p>
            <h3 className="text-2xl md:text-3xl font-serif uppercase tracking-widest">Extensions & Colour Preview</h3>
            <p className="text-gray-600 mt-3 leading-relaxed max-w-2xl">
              Upload a headshot and preview either an <span className="font-semibold">extensions</span> outcome or a <span className="font-semibold">hair colour</span> outcome.
              We keep these looks separate: extensions presets do not change colour, and colour presets do not add length/density.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-4">
              <Icon icon="fluent:lock-closed-16-regular" size={14} tone="gold" />
              <span>Privacy-first: your photo is processed in-memory and not stored.</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-divine-gold">
            <Icon icon="fluent-emoji:magic-wand" size={22} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Controls */}
          <div className="space-y-8">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Headshot</div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Button variant="secondary" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2">
                  <Icon icon="fluent:arrow-upload-20-regular" size={16} tone="gold" />
                  Upload photo
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setResultUrl(null);
                    setResultMeta(null);
                    setError(null);
                  }}
                />
                <div className="text-sm text-gray-600">
                  {file ? <span className="font-semibold">{file.name}</span> : <span>No file selected</span>}
                  <div className="text-[11px] text-gray-500 mt-1">Best results: front-facing, neutral light.</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Category</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => switchCategory('extensions')}
                  className={`p-4 border-2 text-left transition-all ${
                    category === 'extensions'
                      ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                      : 'bg-white border-gray-100 hover:border-soft-champagne'
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-widest font-bold">Extensions</div>
                  <div className={`text-sm mt-2 ${category === 'extensions' ? 'text-divine-gold/80' : 'text-gray-600'}`}>
                    Length + volume outcomes (no colour change)
                  </div>
                </button>

                <button
                  onClick={() => switchCategory('color')}
                  className={`p-4 border-2 text-left transition-all ${
                    category === 'color'
                      ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                      : 'bg-white border-gray-100 hover:border-soft-champagne'
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-widest font-bold">Colour</div>
                  <div className={`text-sm mt-2 ${category === 'color' ? 'text-divine-gold/80' : 'text-gray-600'}`}>
                    Tone + dimension outcomes (no added length)
                  </div>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Choose a look</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(category === 'extensions' ? EXTENSION_PRESETS : COLOR_PRESETS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setStyleId(p.id)}
                    className={`p-4 border-2 text-left transition-all ${
                      styleId === p.id
                        ? 'bg-divine-gold/10 border-divine-gold text-divine-gold'
                        : 'bg-white border-gray-100 hover:border-soft-champagne'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-gray-100 overflow-hidden shrink-0">
                        {(() => {
                          const isExtensions = p.category === 'extensions';
                          const variant = isExtensions
                            ? extensionStylePreviews?.[p.id]?.[extColorId]?.[extInches]
                            : null;
                          const fallback = stylePreviews[p.id];
                          const asset = variant || fallback;
                          return asset?.src ? (
                            <OptimizedImage
                              alt={`${p.name} preview`}
                              src={asset.src}
                              srcSet={asset.srcSet}
                              sizes="56px"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">Preview</div>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-widest font-bold">{p.name}</div>
                        <div className={`text-sm mt-2 ${styleId === p.id ? 'text-divine-gold/80' : 'text-gray-600'}`}>{p.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Scroll indicator - only show if preset is selected */}
              {selectedPreset && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 pb-4 animate-bounce">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">More options below</div>
                  <svg className="w-5 h-5 text-divine-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Intensity</div>
                <div className="text-[11px] text-gray-500">{Math.round(intensity * 100)}%</div>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-[11px] text-gray-500 mt-2">Tip: 50–70% looks most natural for previews.</div>
            </div>

            {/* Category-specific customization */}
            {category === 'extensions' ? (
              <div className="border border-gray-100 p-5 bg-goddess-white">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">Extensions customization</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Colour match</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        className={`border px-3 py-2 text-xs text-left ${extColorId === 'keep-natural' ? 'border-divine-gold bg-divine-gold/10' : 'border-gray-200 hover:border-divine-gold/60'}`}
                        onClick={() => setExtColorId('keep-natural')}
                      >
                        <div className="font-semibold">Keep Natural</div>
                        <div className="text-[10px] text-gray-500">Best realism</div>
                      </button>
                      {extensionColorOptionsFull.map((c) => {
                        const previewable = (extensionPreviewColorIds as readonly string[]).includes(c.id);
                        const active = extColorId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`border px-3 py-2 text-xs text-left ${active ? 'border-divine-gold bg-divine-gold/10' : 'border-gray-200 hover:border-divine-gold/60'}`}
                            onClick={() => setExtColorId(c.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full border" style={{ background: c.hex || '#eee' }} />
                              <span className="font-semibold">{c.label}</span>
                            </div>
                            {previewable ? (
                              <div className="mt-1 text-[10px] text-gray-500">Instant preview</div>
                            ) : (
                              <div className="mt-1 text-[10px] text-gray-400">Applied on generate</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                      Choose a shade to preview. Only popular shades show instant previews; any shade can be used for your final generation.
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Length (inches)</div>
                    <select
                      value={extInches}
                      onChange={(e) => setExtInches(e.target.value as ExtInches)}
                      className="w-full border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {extensionLengthOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Density</div>
                    <select value={extDensity} onChange={(e) => setExtDensity(e.target.value as ExtDensity)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {EXT_DENSITY.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Finish</div>
                    <select value={extFinish} onChange={(e) => setExtFinish(e.target.value as ExtFinish)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {EXT_FINISH.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                  These controls affect <span className="font-semibold">length/volume/finish only</span>. Colour remains unchanged.
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 p-5 bg-goddess-white">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">Colour customization</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Tone</div>
                    <select value={colorTone} onChange={(e) => setColorTone(e.target.value as ColorTone)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {COLOR_TONE.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Brightness</div>
                    <select value={colorBrightness} onChange={(e) => setColorBrightness(e.target.value as ColorBrightness)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {COLOR_BRIGHTNESS.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Dimension</div>
                    <select value={colorDimension} onChange={(e) => setColorDimension(e.target.value as ColorDimension)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {COLOR_DIMENSION.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Root</div>
                    <select value={colorRoot} onChange={(e) => setColorRoot(e.target.value as ColorRoot)} className="w-full border border-gray-200 bg-white px-3 py-2 text-sm">
                      {COLOR_ROOT.map((v) => (
                        <option key={v} value={v}>
                          {humanize(v)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                  These controls affect <span className="font-semibold">tone/dimension only</span>. No added length/density.
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 border border-red-100 bg-red-50 text-red-700">
                <Icon icon="fluent:warning-20-regular" size={18} tone="gold" className="mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            )}

            <Button variant="primary" disabled={!file || isLoading} onClick={onGenerate} className="w-full flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Icon icon="fluent:spinner-ios-20-regular" size={18} tone="gold" className="animate-spin" />
                  {loadingPhase === 'removing' ? 'Removing background…' : 'Generating…'}
                </>
              ) : (
                'Generate Preview'
              )}
            </Button>

            <div className="text-[11px] text-gray-500 leading-relaxed">
              This preview is an estimate for inspiration. Your complimentary consultation confirms method, colour match, and what will look best for your hair integrity.
            </div>
          </div>

          {/* Preview */}
          <div className="bg-goddess-white border border-gray-100 p-6 md:p-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">Preview</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Original</div>
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} className="w-full h-full object-cover" alt="Original upload" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Upload a headshot</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Result</div>
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  {resultUrl ? (
                    <img src={resultUrl} className="w-full h-full object-cover" alt={`${selectedPreset.name} result`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      {isLoading ? (loadingPhase === 'removing' ? 'Removing background…' : 'Generating…') : 'Generate a preview'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <span className="font-semibold">Selected:</span> {selectedPreset.name}
              <div className="text-[11px] text-gray-500 mt-2">
                Tip: try a few presets and save your favorite preview to show your colourist/extension specialist.
              </div>
            </div>

            {resultUrl && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href={resultUrl} download={`diosa-preview-${resultMeta?.styleId || styleId}.png`} className="flex-1">
                  <Button variant="secondary" className="w-full inline-flex items-center justify-center gap-2">
                    <Icon icon="fluent:arrow-download-20-regular" size={16} tone="gold" />
                    Download
                  </Button>
                </a>

                <Button
                  variant="ghost"
                  className="flex-1 inline-flex items-center justify-center gap-2"
                  onClick={async () => {
                    const url = `${window.location.origin}/booking?styleId=${encodeURIComponent(resultMeta?.styleId || styleId)}&styleName=${encodeURIComponent(resultMeta?.styleName || selectedPreset.name)}`;
                    await navigator.clipboard.writeText(url);
                  }}
                >
                  <Icon icon="fluent:link-20-regular" size={16} tone="gold" />
                  Copy booking link
                </Button>

                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    navigate(`/booking?styleId=${encodeURIComponent(resultMeta?.styleId || styleId)}&styleName=${encodeURIComponent(resultMeta?.styleName || selectedPreset.name)}`);
                  }}
                >
                  Book this look
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
