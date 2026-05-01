import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-bold text-slate-600 ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-300 placeholder:text-slate-400 shadow-sm ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-rose-500 font-medium ml-1">{error}</p>}
    </div>
  );
};
