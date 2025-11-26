import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <select
        className={`
          bg-background border border-border rounded-lg px-3 py-2
          text-foreground focus:outline-none focus:ring-2 focus:ring-primary
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

