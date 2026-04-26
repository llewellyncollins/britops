import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTier } from "../../hooks/useTier";
import type { GatedFeature } from "../../types";

interface LockedFeatureProps {
  feature: GatedFeature;
  children: ReactNode;
  className?: string;
}

export function LockedFeature({ children, className }: LockedFeatureProps) {
  const { can } = useTier();
  const navigate = useNavigate();

  if (can()) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/login?returnTo=${window.location.pathname}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          handleClick(e as unknown as React.MouseEvent);
      }}
      className={cn("relative cursor-pointer group", className)}
      aria-label="Sign in to unlock this feature"
    >
      <div
        className="opacity-40 pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-white text-xs font-medium shadow-sm group-hover:bg-primary transition-colors">
          <Lock aria-hidden="true" size={12} />
          Sign in
        </span>
      </div>
    </div>
  );
}
