import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { StyleGenerator } from '../components/ai/StyleGenerator';
import { Button } from '../components/ui/Button';

export const StyleGeneratorPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <p className="font-accent text-3xl text-divine-gold mb-2">Virtual Preview</p>
          <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">AI Style Generator</h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Upload a headshot and preview a refined, realistic finish. No storageprocessed in-memory and returned to you.
          </p>
        </AnimatedSection>

        <StyleGenerator />

        <AnimatedSection className="text-center mt-16">
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Love what you see? Well confirm method, colour match, and a maintenance cadence tailored to your hair integrity.
          </p>
          <Link to="/booking">
            <Button variant="primary" size="lg">Book Complimentary Consultation</Button>
          </Link>
        </AnimatedSection>
      </div>
    </div>
  );
};
