import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`surface-card glass-panel rounded-[28px] p-4 ${
        onClick
          ? 'cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-28px_rgba(79,70,229,0.45)] active:scale-[0.985]'
          : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
