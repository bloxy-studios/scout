import type { CSSProperties } from "react";
import scoutLogoUrl from "../assets/scout-logo.svg";

type ScoutBadgeProps = {
  className?: string;
};

export function ScoutBadge({ className = "" }: ScoutBadgeProps) {
  return (
    <div
      className={`scout-badge ${className}`.trim()}
      data-testid="scout-badge"
      aria-hidden="true"
      style={{
        "--scout-badge-mask": `url("${scoutLogoUrl}")`,
      } as CSSProperties}
    />
  );
}
