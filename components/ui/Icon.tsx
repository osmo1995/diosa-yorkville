import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

type Tone = 'gold' | 'charcoal' | 'muted' | 'white' | 'auto';

export const Icon: React.FC<{ icon: string; size?: number; className?: string; tone?: Tone }> = ({
  icon,
  size = 18,
  className = '',
  tone = 'auto',
}) => {
  const toneClass =
    tone === 'gold'
      ? 'text-divine-gold'
      : tone === 'charcoal'
        ? 'text-deep-charcoal'
        : tone === 'muted'
          ? 'text-gray-500'
          : tone === 'white'
            ? 'text-white'
            : '';

  return <IconifyIcon icon={icon} width={size} height={size} className={`${toneClass} ${className}`.trim()} />;
};
