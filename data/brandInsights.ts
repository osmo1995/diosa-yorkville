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
