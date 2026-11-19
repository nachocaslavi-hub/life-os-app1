import React from 'react';
import { X } from 'lucide-react';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bg?: string;
  interactive?: boolean;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  className = '',
  bg = 'bg-white',
  interactive = false,
  ...props
}) => (
  <div
    className={`border-2 border-black shadow-[4px_4px_0px_#000] ${bg} ${
      interactive ? 'neo-press cursor-pointer' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-black text-white',
    secondary: 'bg-white text-black',
    accent: 'bg-[#39FF14] text-black',
    danger: 'bg-[#FF5F1F] text-black'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-bold',
    md: 'px-4 py-2.5 text-sm font-bold min-h-[44px]',
    lg: 'px-5 py-3.5 text-base font-extrabold min-h-[50px]'
  };

  return (
    <button
      className={`border-2 border-black shadow-[3px_3px_0px_#000] neo-press inline-flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface NeoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headerBg?: string;
  children: React.ReactNode;
}

export const NeoModal: React.FC<NeoModalProps> = ({
  open,
  onClose,
  title,
  headerBg = 'bg-white',
  children
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92dvh] flex flex-col bg-white text-black border-t-4 sm:border-4 border-black shadow-[0_-4px_0px_#000] sm:shadow-[8px_8px_0px_#000] overflow-hidden">
        <div
          className={`flex items-center justify-between px-4 py-3 border-b-2 border-black ${headerBg}`}
        >
          <h3 className="font-extrabold text-base uppercase tracking-tight truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] neo-press shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto pb-safe space-y-4">{children}</div>
      </div>
    </div>
  );
};