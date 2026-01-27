// Structured insights distilled from well-known North American hair extension brands/studios.
// Sources sampled via quick scraping of primary brand sites (Great Lengths, Bellami Professional, HairtalkUSA, Siutse,
// Covet & Mane Collective) plus industry/common luxury patterns.
// NOTE: This file is intended as internal guidance for copy/IA decisions.

export type BrandSource = {
  name: string;
  url: string;
  notes: string[];
};

export type Pattern = {
  id: string;
  label: string;
  whyItWorks: string;
  implementationNotes: string[];
};

export const brandSources: BrandSource[] = [
  {
    name: 'Great Lengths',
    url: 'https://www.greatlengths.com/',
    notes: [
      'Heritage/authority positioning ("excellence" / longevity).',
      'Craft + sourcing story (Italian manufacturing).',
      'Clear method taxonomy (tapes / keratin / wefts).',
      'Ethics & mission / sustainability trust signals.',
    ],
  },
  {
    name: 'Bellami Professional',
    url: 'https://www.bellamiprofessional.com/',
    notes: [
      'Strong brand promise and "difference" framing.',
      'Product + method collections; education angle.',
      'Upsell via consultation + professional quality cues.',
    ],
  },
  {
    name: 'Hairtalk (USA)',
    url: 'https://hairtalkusa.com/',
    notes: [
      'Simple: method → benefits → maintenance cadence.',
      'Before/after proof and shade matching language.',
    ],
  },
  {
    name: 'Siutse Hair Extensions',
    url: 'https://siutsehairextensions.com/',
    notes: [
      'Luxury editorial positioning + transformation proof.',
      'Dedicated pages per method and strong booking CTA.',
    ],
  },
  {
    name: 'Covet & Mane Collective',
    url: 'https://collective.covetandmane.com/',
    notes: [
      'Membership/collective credibility and social proof.',
      'Clear promise: quality + technique + results.',
    ],
  },
];

export const extensionLengthOptions = [
  { id: '14', inches: 14, label: '14 in (collarbone)', promptDescriptor: '14-inch length (collarbone)' },
  { id: '18', inches: 18, label: '18 in (below bra strap)', promptDescriptor: '18-inch length (below bra strap)' },
  { id: '22', inches: 22, label: '22 in (bottom of ribcage)', promptDescriptor: '22-inch length (bottom of ribcage)' },
  { id: '24', inches: 24, label: '24 in (above hips)', promptDescriptor: '24-inch length (just above hips)' },
] as const;

// Full selectable salon shade library (named-only for consistent, safe prompting).
// Users can pick any of these for their generation; only a curated subset is pre-rendered for instant previews.
export const extensionColorOptionsFull = [
  // BLONDES (wide spectrum)
  { id: 'platinum-icy', label: 'Icy Platinum', family: 'blonde', hex: '#EDE7DF', promptDescriptor: 'icy platinum blonde, cool-toned, pearly silver undertone, salon-toned' },
  { id: 'champagne', label: 'Champagne Blonde', family: 'blonde', hex: '#E7D6B3', promptDescriptor: 'champagne blonde, neutral-beige with soft gold reflect, rooted blend' },
  { id: 'beige', label: 'Beige Blonde', family: 'blonde', hex: '#E2CFB1', promptDescriptor: 'beige blonde, neutral lived-in blonde, natural dimension' },
  { id: 'ash', label: 'Ash Blonde', family: 'blonde', hex: '#D7CAB4', promptDescriptor: 'ash blonde, cool smoky undertone, soft shadow root' },
  { id: 'old-money', label: 'Old Money Blonde', family: 'blonde', hex: '#E6D5B8', promptDescriptor: 'old money blonde, ultra-soft neutral blonde, expensive blend, subtle root melt' },
  { id: 'creme-brulee', label: 'Crème Brûlée Blonde', family: 'blonde', hex: '#E6C08E', promptDescriptor: 'crème brûlée blonde, warm-neutral creamy blonde with caramel ribbons, rooted dimension' },
  { id: 'honey', label: 'Honey Blonde', family: 'blonde', hex: '#D9B277', promptDescriptor: 'honey blonde, warm golden blonde with soft glow, salon finish' },
  { id: 'caramel', label: 'Caramel Blonde', family: 'blonde', hex: '#C79A63', promptDescriptor: 'caramel blonde, deeper golden blonde, rich dimension' },

  // BRONDES
  { id: 'bronde', label: 'Bronde Blend', family: 'bronde', hex: '#B28A64', promptDescriptor: 'bronde (brown-blonde blend), seamless rooted transition, lived-in dimension' },

  // BRUNETTES
  { id: 'espresso', label: 'Espresso Brunette', family: 'brunette', hex: '#2B1F1B', promptDescriptor: 'espresso brunette, deep rich brown with glossy finish' },
  { id: 'expensive-brunette', label: 'Expensive Brunette', family: 'brunette', hex: '#4A3328', promptDescriptor: 'expensive brunette, multi-dimensional chocolate-espresso tones, glassy gloss' },

  // REDS
  { id: 'copper', label: 'Copper Glow', family: 'red', hex: '#B65A3A', promptDescriptor: 'rich salon copper, soft auburn dimension, glossy' },

  // BLACKS
  { id: 'soft-black', label: 'Soft Black', family: 'black', hex: '#1A1412', promptDescriptor: 'soft natural black, not blue-black, healthy shine' },
] as const;

// The 12 shades we will pre-render for instant extension previews.
export const extensionPreviewColorIds = [
  'platinum-icy',
  'champagne',
  'beige',
  'ash',
  'old-money',
  'creme-brulee',
  'honey',
  'caramel',
  'bronde',
  'espresso',
  'expensive-brunette',
  'copper',
] as const;

export const highConvertingPatterns: Pattern[] = [
  {
    id: 'hero-value-prop',
    label: 'Hero: hyper-specific luxury positioning + one primary CTA',
    whyItWorks: 'Top studios immediately state who they serve, where, and what outcome they deliver; reduces bounce and increases booking intent.',
    implementationNotes: [
      'Use Yorkville/Toronto in the headline or subhead.',
      'Primary CTA should be "Complimentary Consultation" (luxury wording).',
      'Secondary CTA: Gallery / Results.',
    ],
  },
  {
    id: 'trust-strip',
    label: 'Trust strip above the fold',
    whyItWorks: 'Luxury services need fast reassurance: quality, expertise, sourcing, and comfort.',
    implementationNotes: [
      'Add 3–5 badges: Ethically sourced hair, Damage-minimizing techniques, Colour matching, Certified methods, Concierge booking.',
      'Keep copy short and scannable.',
    ],
  },
  {
    id: 'method-taxonomy',
    label: 'Method taxonomy: tapes / keratin / wefts with who it’s for',
    whyItWorks: 'Consumers shop by method or by outcome; clear comparison reduces friction.',
    implementationNotes: [
      'Services page should include a comparison table (duration, wear, maintenance, best for).',
      'Home can preview 3 methods + link to full services.',
    ],
  },
  {
    id: 'process-steps',
    label: 'Signature process steps (Consult → Colour Match → Install → Maintenance)',
    whyItWorks: 'Sets expectations and communicates professionalism; reduces anxiety about extensions.',
    implementationNotes: [
      'Add a 4-step section with short descriptions.',
      'Mention consultation, strand/row mapping, blending haircut, aftercare plan.',
    ],
  },
  {
    id: 'proof',
    label: 'Proof section: before/after + numbers',
    whyItWorks: 'Extensions are outcome-driven; proof is the conversion lever.',
    implementationNotes: [
      'Keep transformations carousel; add “Maintenance cadence” microcopy.',
      'Add light stats: years experience, transformations, repeat clients.',
    ],
  },
  {
    id: 'aftercare',
    label: 'Aftercare + maintenance reassurance',
    whyItWorks: 'Addresses common objection: "Will this damage my hair?" and sets retention expectations.',
    implementationNotes: [
      'Add 3–5 aftercare bullets with gentle language.',
      'Mention maintenance appointment cadence per method.',
    ],
  },
];
