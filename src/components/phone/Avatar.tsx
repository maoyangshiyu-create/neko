import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  className?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  className = '', 
  size = 20,
  onClick,
  ...restProps
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || src.trim() === '' || hasError) {
    return (
      <div 
        title={name || undefined}
        onClick={onClick}
        className={`bg-stone-200 text-stone-500 flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
        {...restProps}
      >
        <User size={size} className="text-stone-400 pointer-events-none" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`overflow-hidden shrink-0 select-none ${className}`}
      {...restProps}
    >
      <img 
        src={src} 
        alt={name || "avatar"} 
        className="w-full h-full object-cover pointer-events-none"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

