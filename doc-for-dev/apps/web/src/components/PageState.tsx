interface PageStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageState({
  title,
  message,
  actionLabel,
  onAction
}: PageStateProps) {
  return (
    <div className="page-state">
      <div className="page-state__mark" aria-hidden="true">
        ✳
      </div>
      <h1>{title}</h1>
      {message && <p>{message}</p>}
      {actionLabel && onAction && (
        <button className="button button--primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingPage({ label }: { label: string }) {
  return (
    <div className="loading-page" role="status">
      <span className="loading-page__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
