
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when location changes
  useEffect(() => setIsOpen(false), [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Virtual Preview', path: '/style-generator' },
    { name: 'About', path: '/about' },
  ];

  const goToStyleGenerator = () => {
    // If already on Home, smooth scroll. Otherwise navigate to Home and request scroll.
    if (location.pathname === '/') {
      document.getElementById('style-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/?scroll=style-generator');
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex flex-col items-center">
            <span className={`text-2xl font-serif tracking-widest uppercase transition-colors duration-500 ${isScrolled ? 'text-deep-charcoal' : 'text-white'}`}>Diosa Studio</span>
            <span className={`text-[10px] font-sans tracking-[0.3em] uppercase transition-colors duration-500 ${isScrolled ? 'text-divine-gold' : 'text-soft-champagne'}`}>Yorkville</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-12">
            <div className="flex space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`text-xs font-sans font-semibold uppercase tracking-widest transition-colors duration-500 hover:text-divine-gold ${isScrolled ? 'text-deep-charcoal' : 'text-white'}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <button onClick={goToStyleGenerator}>
              <Button
                size="sm"
                variant={isScrolled ? 'secondary' : 'outline'}
                className={!isScrolled ? 'border-white text-white hover:bg-white hover:text-deep-charcoal' : ''}
              >
                AI Style Preview
              </Button>
            </button>
            <Link to="/booking">
              <Button size="sm" variant={isScrolled ? 'primary' : 'outline'} className={!isScrolled ? 'border-white text-white hover:bg-white hover:text-deep-charcoal' : ''}>
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <Icon icon="fluent:navigation-24-regular" size={28} tone={isScrolled ? 'charcoal' : 'white'} />
          </button>
        </div>
      </nav>

      {/* Fullscreen Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-deep-charcoal z-[100] flex flex-col items-center justify-center p-8"
          >
            <button
              className="absolute top-8 right-8 text-white hover:text-divine-gold transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <Icon icon="fluent:dismiss-32-regular" size={32} tone="white" />
            </button>

            <div className="flex flex-col items-center space-y-8 mb-12">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link 
                    to={link.path}
                    className="text-3xl font-serif text-white hover:text-divine-gold transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center space-y-6"
            >
              <Link to="/style-generator" className="w-full">
                <Button fullWidth variant="secondary" size="lg">AI Style Preview</Button>
              </Link>
              <Link to="/booking" className="w-full">
                <Button fullWidth variant="primary" size="lg">Book Consultation</Button>
              </Link>
              <div className="flex space-x-6 text-white">
                <Icon icon="fluent-emoji:camera" size={24} />
                <Icon icon="fluent-emoji:blue-book" size={24} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
