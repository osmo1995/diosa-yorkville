
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-charcoal text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-3xl font-serif tracking-widest uppercase">Diosa Studio</span>
              <p className="text-[10px] font-sans tracking-[0.4em] uppercase text-divine-gold">Yorkville</p>
            </Link>
            <p className="text-soft-champagne/70 text-sm leading-relaxed max-w-xs">
              Yorkville hair extensions with a concierge process: precision colour matching, integrity-first methods, and maintenance that keeps results flawless.
            </p>
            <div className="flex space-x-4">
              <Link to="/booking" className="hover:text-divine-gold transition-colors" aria-label="Book a consultation">
                <Icon icon="fluent-emoji:camera" size={20} />
              </Link>
              <Link to="/booking" className="hover:text-divine-gold transition-colors" aria-label="Book a consultation">
                <Icon icon="fluent-emoji:blue-book" size={20} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-sans font-bold uppercase tracking-widest text-divine-gold mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-soft-champagne/80">
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link to="/style-generator" className="hover:text-white transition-colors">Virtual Preview</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">The Salon</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Book Now</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-sans font-bold uppercase tracking-widest text-divine-gold mb-6">Connect</h4>
            <ul className="space-y-4 text-sm text-soft-champagne/80">
              <li className="flex items-start space-x-3">
                <Icon icon="fluent-emoji:round-pushpin" size={18} />
                <span>2 Bloor St E<br />Toronto, ON M4W 3E2<br />Canada</span>
              </li>
              <li className="flex items-center space-x-3">
                <Icon icon="fluent-emoji:telephone" size={18} />
                <a href="tel:+14379292563" className="hover:text-white transition-colors">437-929-2563</a>
              </li>
              <li className="flex items-center space-x-3">
                <Icon icon="fluent-emoji:e-mail" size={18} />
                <span>hello@diosayorkville.com</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-sm font-sans font-bold uppercase tracking-widest text-divine-gold mb-6">Hours</h4>
            <ul className="space-y-3 text-sm text-soft-champagne/80 font-sans">
              <li className="flex justify-between"><span>Mon - Fri</span> <span>10am - 8pm</span></li>
              <li className="flex justify-between"><span>Saturday</span> <span>9am - 6pm</span></li>
              <li className="flex justify-between"><span>Sunday</span> <span className="text-divine-gold italic">Closed</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] text-soft-champagne/40 uppercase tracking-widest">
          <p>&copy; 2026 Diosa Studio Yorkville. All Rights Reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
