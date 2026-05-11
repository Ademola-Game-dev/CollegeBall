import React from "react";

interface BackgroundAmbienceProps {
  theme?: "default" | "recruiting" | "portal" | "postseason";
}

export const BackgroundAmbience: React.FC<BackgroundAmbienceProps> = ({ theme = "default" }) => {
  const orbColors = {
    default: ["bg-blue-600/10", "bg-purple-600/10", "bg-cyan-600/5"],
    recruiting: ["bg-emerald-600/10", "bg-blue-600/10", "bg-emerald-500/5"],
    portal: ["bg-indigo-600/10", "bg-blue-600/10", "bg-purple-600/5"],
    postseason: ["bg-amber-600/10", "bg-blue-600/10", "bg-purple-600/5"],
  };

  const colors = orbColors[theme];

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#07090c]" />
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-20" />
      <div className="fixed inset-0 z-0 glow-mesh opacity-30" />
      
      {/* Floating Orbs */}
      <div className={`fixed top-[5%] left-[-5%] w-[45vw] h-[45vw] ${colors[0]} rounded-full blur-[140px] animate-float pointer-events-none`} />
      <div className={`fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] ${colors[1]} rounded-full blur-[120px] animate-float pointer-events-none`} style={{ animationDelay: '-7s' }} />
      <div className={`fixed top-[30%] right-[10%] w-[30vw] h-[30vw] ${colors[2]} rounded-full blur-[100px] animate-float pointer-events-none`} style={{ animationDelay: '-12s' }} />
      
      <div className="fixed left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />
      <div className="fixed left-[8%] top-1/2 h-px w-[84%] bg-white/5" />
    </>
  );
};
