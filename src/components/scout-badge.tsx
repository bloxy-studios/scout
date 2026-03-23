import scoutLogoUrl from "../assets/scout-logo.svg";

type ScoutBadgeProps = {
  className?: string;
};

export function ScoutBadge({ className = "" }: ScoutBadgeProps) {
  return (
    <img
      className={`scout-badge ${className}`.trim()}
      data-testid="scout-badge"
      aria-hidden="true"
      src={scoutLogoUrl}
      alt=""
    />
  );
}
