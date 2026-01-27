import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Route-level code splitting
const Home = React.lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Gallery = React.lazy(() => import('./pages/Gallery').then((m) => ({ default: m.Gallery })));
const Contact = React.lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const StyleGeneratorPage = React.lazy(() => import('./pages/StyleGeneratorPage').then((m) => ({ default: m.StyleGeneratorPage })));
const Services = React.lazy(() => import('./pages/Services').then((m) => ({ default: m.Services })));
const About = React.lazy(() => import('./pages/About').then((m) => ({ default: m.About })));

const ConciergeWidget = React.lazy(() => import('./components/ai/ConciergeWidget').then((m) => ({ default: m.ConciergeWidget })));

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const RouteFallback: React.FC = () => (
  <div className="pt-32 pb-24 bg-white min-h-screen">
    <div className="container mx-auto px-6">
      <div className="text-center text-gray-500 text-sm">Loading…</div>
    </div>
  </div>
);

const LazyAfterIdle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
    if (ric) {
      const id = ric(() => setShow(true), { timeout: 1500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }

    const t = window.setTimeout(() => setShow(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  return show ? <>{children}</> : null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/style-generator" element={<StyleGeneratorPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={<Contact />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>
        <Footer />

        <Suspense fallback={null}>
          <LazyAfterIdle>
            <ConciergeWidget />
          </LazyAfterIdle>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
