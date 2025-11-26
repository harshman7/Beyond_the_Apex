import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <input
        className={`
          bg-background border border-border rounded-lg px-3 py-2
          text-foreground focus:outline-none focus:ring-2 focus:ring-primary
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

