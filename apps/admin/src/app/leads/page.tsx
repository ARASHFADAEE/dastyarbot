'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader, StatusBadge } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Lead = {
  id: string;
  status: string;
  score: number;
  intent?: string | null;
  summary?: string | null;
  customer: { name?: string | null; phone?: string | null };
};

export default function LeadsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Lead[] | null>(null);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Lead[]>('/leads')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  return (
    <Shell>
      <PageHeader
        title="لیدها"
        description="فرصت‌های فروش امتیازدهی‌شده — اولویت را از امتیاز و وضعیت ببینید"
      />

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState title="لیدی ثبت نشده" description="وقتی منشی لید بسازد اینجا ظاهر می‌شود." />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((l) => (
            <div key={l.id} className="list-row list-row-static">
              <div className="row-top">
                <div>
                  <div className="row-title">{l.customer?.name || 'مشتری'}</div>
                  {l.customer?.phone ? (
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                      {l.customer.phone}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <StatusBadge status={l.status} />
                  <span className="badge badge-brand">امتیاز {l.score}</span>
                </div>
              </div>
              <div className="score-bar">
                <i style={{ width: `${Math.min(100, Math.max(0, l.score))}%` }} />
              </div>
              <div className="row-sub">
                {l.intent ? <strong style={{ color: 'var(--ink)' }}>{l.intent}</strong> : null}
                {l.intent && l.summary ? ' — ' : ''}
                {l.summary || 'بدون خلاصه'}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
