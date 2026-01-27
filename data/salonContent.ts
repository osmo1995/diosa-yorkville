
import { Service, Transformation, GalleryItem, Testimonial, TrustBadge, ProcessStep, AftercareTip } from '../types';
import { generatedImages } from './generatedImages';

// Copy refresh aligned to GTA top-salon patterns:
// - Outcome-led specialties
// - Integrity + comfort + maintenance transparency
// - Booking-forward language

export const services: Service[] = [
  {
    id: 'tape-in',
    title: 'Tape-In Extensions',
    description: 'Seamless volume and length with a lightweight feel—ideal for fine to medium hair.',
    longDescription:
      'Tape-ins are ideal if you want a seamless boost in volume and length without a long appointment. We use ultra-flat, medical-grade adhesive tabs and match placement to your natural density—so the blend looks effortless and feels lightweight. You’ll leave with a clear move-up cadence to keep everything tidy and comfortable.',
    price: 'From $400',
    duration: '1.5 - 2 Hours',
    longevity: '6-8 Weeks',
    imageUrl: '',
    bestFor: ['Fine to medium hair', 'Fast installs', 'Seamless volume + length without bulk'],
    moveUpCadence: 'Move-up every 6–8 weeks',
    wearTime: 'Wear 6–8 weeks per install',
    notes: 'Comfort-first placement with weight-balanced sections for a clean grow-out.',
  },
  {
    id: 'keratin-bond',
    title: 'Keratin Bond (K-Tips)',
    description: 'Long-wear, versatile, and discreet—made for styling freedom and extended wear.',
    longDescription:
      'K-Tips are the long-wear option when you want maximum styling freedom. Individual strands are bonded with low heat for discreet, 360° movement—ideal for updos and an active schedule. We prioritize hair integrity, bond sizing, and weight distribution so the result is comfortable, natural, and consistent from week one to removal.',
    price: 'From $600',
    duration: '3 - 5 Hours',
    longevity: '3-5 Months',
    imageUrl: '',
    bestFor: ['Updos + styling freedom', 'Long wear', 'Discreet strand-by-strand movement'],
    moveUpCadence: 'Removal + reinstall seasonally',
    wearTime: 'Wear ~3–5 months',
    notes: 'Bond sizing and weight distribution are customized to protect integrity.',
  },
  {
    id: 'hand-tied',
    title: 'Hand-Tied Wefts',
    description: 'High-density fullness with a comfort-first install and a clean blend.',
    longDescription:
      'Hand-tied wefts are our go-to for high-impact density with a comfort-first feel. We place silicone-lined beads thoughtfully and stitch in hand-tied wefts for a full, luxurious result—without harsh tension. You’ll get maximum fullness with a maintenance cadence that keeps the grow-out clean and your natural hair protected.',
    price: 'From $800',
    duration: '3 - 4 Hours',
    longevity: '8-12 Weeks (Maintenance)',
    imageUrl: '',
    bestFor: ['High density + luxury fullness', 'Comfort-first installs', 'Clean blend + tidy grow-out'],
    moveUpCadence: 'Move-up every 8–10 weeks',
    wearTime: 'Wear 8–12 weeks between move-ups',
    notes: 'Silicone-lined beads + thoughtful spacing to minimize tension.',
  },
  {
    id: 'sew-in',
    title: 'Invisible Sew-In',
    description: 'Glamour and density with even weight distribution and secure wear.',
    longDescription:
      'Our invisible sew-in is a refined classic: secure wear, even weight distribution, and a glamorous finish that still reads natural. We tailor the foundation to your density and lifestyle, then blend the perimeter so the result looks like your own hair—only better.',
    price: 'From $500',
    duration: '2.5 - 4 Hours',
    longevity: '6-10 Weeks',
    imageUrl: '',
    bestFor: ['Classic glamour + strong hold', 'Even weight distribution', 'Secure wear with a refined finish'],
    moveUpCadence: 'Move-up every 6–10 weeks',
    wearTime: 'Wear 6–10 weeks between move-ups',
    notes: 'Foundation + perimeter blending tuned to your density and lifestyle.',
  }
];

// Results pairs used for Home "Before & After" and the rotating hero.
// Assets come from generatedImages.transformations[`${id}_before|after`].
export const transformations: Transformation[] = [
  { id: 'r1', before: '', after: '', method: 'Hand-Tied Wefts • 22in • Champagne Blonde', category: 'extensions' },
  { id: 'r2', before: '', after: '', method: 'Tape-Ins • 18in • Beige Blonde', category: 'extensions' },
  { id: 'r3', before: '', after: '', method: 'Keratin Bonds (K-Tips) • 22in • Espresso Brunette Gloss', category: 'extensions' },
  { id: 'r4', before: '', after: '', method: 'Invisible Sew-In • 24in • Warm Honey Blonde', category: 'extensions' },
  { id: 'r5', before: '', after: '', method: 'Hand-Tied Wefts • 18in • Bronde Babylights', category: 'extensions' },

  { id: 'r6', before: '', after: '', method: 'Balayage • Old Money Blonde (rooted)', category: 'color' },
  { id: 'r7', before: '', after: '', method: 'Gloss + Dimension • Expensive Brunette', category: 'color' },
  { id: 'r8', before: '', after: '', method: 'Highlights • Icy Platinum (toned)', category: 'color' },
  { id: 'r9', before: '', after: '', method: 'Balayage • Crème Brûlée Blonde', category: 'color' },
  { id: 'r10', before: '', after: '', method: 'Colour Melt • Copper Glow', category: 'color' },
];

const pexelsGallery = generatedImages.gallery;

export const galleryItems: GalleryItem[] = [
  { id: 'g1', url: pexelsGallery.Blonde[0]?.src || '', asset: pexelsGallery.Blonde[0], category: 'Blonde', title: 'Icy Platinum Blend' },
  { id: 'g2', url: pexelsGallery.Volume[0]?.src || '', asset: pexelsGallery.Volume[0], category: 'Volume', title: 'Caramel Balayage Volume' },
  { id: 'g3', url: pexelsGallery.Length[0]?.src || '', asset: pexelsGallery.Length[0], category: 'Length', title: 'Seamless Length Blend' },
  { id: 'g4', url: pexelsGallery.Blonde[1]?.src || '', asset: pexelsGallery.Blonde[1], category: 'Blonde', title: 'Honey Blonde Wefts' },
  { id: 'g5', url: pexelsGallery.Volume[1]?.src || '', asset: pexelsGallery.Volume[1], category: 'Volume', title: 'Signature Volume Set' },
  { id: 'g6', url: pexelsGallery.Length[1]?.src || '', asset: pexelsGallery.Length[1], category: 'Length', title: 'Hollywood Glamour Length' },
  { id: 'g7', url: pexelsGallery.Blonde[2]?.src || '', asset: pexelsGallery.Blonde[2], category: 'Blonde', title: 'Soft Champagne Blonde' },
  { id: 'g8', url: pexelsGallery.Volume[2]?.src || '', asset: pexelsGallery.Volume[2], category: 'Volume', title: 'Editorial Volume Waves' },
  { id: 'g9', url: pexelsGallery.Length[2]?.src || '', asset: pexelsGallery.Length[2], category: 'Length', title: 'Signature Length Gloss' },
];

export const googleReviewUrl = 'https://www.google.com/search?q=diosa+studio+yorkville+reviews';

export const proofStats = [
  { label: 'Transformations', value: '500+ (studio-proven)' },
  { label: 'Signature methods', value: 'Tape • K-Tip • Weft • Sew-In' },
  { label: 'Integrity-first', value: 'Weight-balanced + comfort checks' },
] as const;

export const seasonalOffers = [
  {
    title: 'Complimentary Clear Gloss',
    detail: 'With any colour service — adds luminous shine and protects vibrancy.',
  },
  {
    title: 'Extension-Safe Brush',
    detail: 'With new install — the right brush makes the blend last longer.',
  },
  {
    title: '7–10 Day Comfort Check',
    detail: 'A quick follow-up to keep tension perfect and prevent matting early.',
  },
] as const;

export const trustBadges: TrustBadge[] = [
  { title: 'Specialist Methods', subtitle: 'Tape-ins, K-tips, hand-tied & sew-in—done properly' },
  { title: 'Integrity-First', subtitle: 'Weight-balanced installs that respect your natural hair' },
  { title: 'Precision Colour Match', subtitle: 'Multi-tone blending for an invisible finish' },
  { title: 'Concierge Maintenance', subtitle: 'Clear move-up cadence so results stay flawless' },
];

export const processSteps: ProcessStep[] = [
  { title: 'Consultation', description: 'We assess your hair integrity, your goal, and your lifestyle—then recommend the right method.' },
  { title: 'Colour Match', description: 'Multi-tone match + placement map so the blend reads natural in daylight and flash.' },
  { title: 'Installation', description: 'Precision application with comfort-first tension and weight distribution.' },
  { title: 'Maintenance Plan', description: 'You leave with a move-up cadence, aftercare guidance, and a plan that protects your hair.' },
];

export const aftercareTips: AftercareTip[] = [
  { title: 'Brush with intention', description: 'Use a soft extension-safe brush and support the root to avoid tension.' },
  { title: 'Wash smart', description: 'Clean scalp, conditioned mids/ends, and gentle drying to maintain bonds and wefts.' },
  { title: 'Heat protection', description: 'Always protect before styling and keep tools moving to preserve shine and longevity.' },
  { title: 'Maintenance matters', description: 'Book your move-up cadence to prevent matting and keep extensions weight-balanced.' },
];

export const testimonials: Testimonial[] = [
  {
    name: 'Alexandra Sterling',
    role: 'Loyal Client',
    content: 'The most luxurious experience in Yorkville. My extensions look and feel like my natural hair. The attention to detail is unmatched.',
    rating: 5
  },
  {
    name: 'Julianne Moore',
    role: 'Fashion Consultant',
    content: 'Diosa Studio is the only place I trust with my hair. Their keratin bonds are invisible and have lasted perfectly through my travels.',
    rating: 5
  }
];
