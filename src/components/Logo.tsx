interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/** Cor e peso alinhados ao favicon (/bg/imagem-aba.png). */
const BRAND_NAVY = '#2d4563';

export default function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl',
  };

  if (!showText) return null;

  return (
    <span
      className={`${sizeClasses[size]} font-black uppercase tracking-[0.14em] ${className}`}
      style={{ color: BRAND_NAVY }}
    >
      OBRA TRANSPARENTE
    </span>
  );
}
