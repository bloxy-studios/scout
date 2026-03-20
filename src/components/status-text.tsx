type StatusTextProps = {
  text: string;
  showSpinner?: boolean;
  tone?: "default" | "error";
};

export function StatusText({
  text,
  showSpinner = false,
  tone = "default",
}: StatusTextProps) {
  return (
    <div className={`status-text status-text--${tone}`}>
      {showSpinner ? <span className="status-spinner" aria-hidden="true" /> : null}
      <span>{text}</span>
    </div>
  );
}
