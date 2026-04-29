interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  if (!showText) return null;

  return (
    <span
      className={`${sizeClasses[size]} font-extrabold text-gray-900 uppercase ${className}`}
      style={{
        letterSpacing: '0.1em',
        fontWeight: 900,
      }}
    >
      OBRA TRANSPARENTE
    </span>
  );
}
