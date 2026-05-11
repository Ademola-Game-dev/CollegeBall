import React from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  categoryColor?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ 
  title, 
  subtitle, 
  category, 
  categoryColor = "bg-blue-600",
  onBack,
  actions 
}) => {
  return (
    <header className="relative flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/10 active:scale-95"
          >
            <svg className="h-6 w-6 text-white/50 transition-colors group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {category && (
              <span className={`rounded-full ${categoryColor} px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-950`}>
                {category}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/30">
                {subtitle}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl italic">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}
      </div>
    </header>
  );
};
