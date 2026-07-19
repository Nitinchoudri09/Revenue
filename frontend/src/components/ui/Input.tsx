import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-sm font-semibold text-[var(--text-main)]">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`input ${icon ? 'pl-10' : ''} ${error ? '!border-[var(--critical-red)] focus:!ring-[var(--critical-red)]' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-[var(--critical-red)] font-medium mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
