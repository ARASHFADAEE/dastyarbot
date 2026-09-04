import Link from 'next/link';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="surface empty-state">
      <strong>{title}</strong>
      <div>{description}</div>
      {actionHref && actionLabel ? (
        <div style={{ marginTop: 16 }}>
          <Link href={actionHref} className="btn btn-sm">
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = 'badge';
  if (['open', 'new', 'pending', 'active', 'hot'].includes(s)) cls += ' badge-warn';
  else if (['assigned', 'contacted', 'qualified', 'warm'].includes(s)) cls += ' badge-info';
  else if (['resolved', 'completed', 'closed', 'won', 'converted'].includes(s)) cls += ' badge-ok';
  else if (['cancelled', 'lost', 'rejected'].includes(s)) cls += ' badge-danger';
  else if (['handoff', 'manual'].includes(s) || s.startsWith('manual')) cls += ' badge-warn';
  else cls += ' badge-brand';
  return <span className={cls}>{status}</span>;
}

export function LoadingBlocks({ count = 3 }: { count?: number }) {
  return (
    <div className="list-stack">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 88 }} />
      ))}
    </div>
  );
}
