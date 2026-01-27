
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/ui/Icon';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { galleryItems } from '../data/salonContent';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export const Gallery: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Blonde' | 'Volume' | 'Length'>('All');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredItems = filter === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

  const categories = ['All', 'Blonde', 'Volume', 'Length'];

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  
  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % filteredItems.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-goddess-white min-h-screen">
      <div className="container mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <p className="font-accent text-3xl text-divine-gold mb-2">Results</p>
          <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-4">Yorkville Results Gallery</h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            Realistic blending, natural movement, and a finish that holds up in daylight and flash.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`text-xs uppercase tracking-[0.3em] font-sans font-bold transition-all border-b-2 py-2 ${filter === cat ? 'text-divine-gold border-divine-gold' : 'text-gray-400 border-transparent hover:text-deep-charcoal'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode='popLayout'>
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group relative h-[500px] overflow-hidden bg-gray-200 cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <OptimizedImage
                  src={item.asset?.src || item.url}
                  srcSet={item.asset?.srcSet}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-white p-8">
                  <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <Icon icon="fluent:add-24-regular" size={24} tone="white" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-divine-gold font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{item.category}</p>
                  <h3 className="text-xl font-serif text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
          >
            <button onClick={closeLightbox} className="absolute top-8 right-8 text-white hover:text-divine-gold transition-colors" aria-label="Close">
              <Icon icon="fluent:dismiss-32-regular" size={32} tone="white" />
            </button>
            
            <button onClick={prevImage} className="absolute left-4 md:left-8 text-white hover:text-divine-gold transition-colors" aria-label="Previous">
              <Icon icon="fluent:chevron-left-48-regular" size={48} tone="white" />
            </button>
            
            <button onClick={nextImage} className="absolute right-4 md:right-8 text-white hover:text-divine-gold transition-colors" aria-label="Next">
              <Icon icon="fluent:chevron-right-48-regular" size={48} tone="white" />
            </button>

            <motion.div 
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl w-full h-full flex flex-col justify-center items-center"
            >
              <OptimizedImage
                src={filteredItems[selectedImage].asset?.src || filteredItems[selectedImage].url}
                srcSet={filteredItems[selectedImage].asset?.srcSet}
                sizes="80vw"
                alt={filteredItems[selectedImage].title}
                loading="eager"
                className="max-h-[80vh] object-contain mb-8 shadow-2xl"
              />
              <div className="text-center text-white">
                <p className="text-xs uppercase tracking-widest text-divine-gold mb-2">{filteredItems[selectedImage].category}</p>
                <h3 className="text-2xl font-serif uppercase tracking-widest">{filteredItems[selectedImage].title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
