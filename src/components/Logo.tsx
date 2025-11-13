interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const emojiSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={emojiSizes[size]} role="img" aria-label="fogo">🔥</span>
      {showText && (
        <span 
          className={`${sizeClasses[size]} font-extrabold text-gray-900 uppercase`}
          style={{ 
            letterSpacing: '0.1em',
            fontWeight: 900
          }}
        >
          INCÊNDIO
        </span>
      )}
    </div>
  );
}
