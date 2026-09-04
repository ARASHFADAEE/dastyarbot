'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader, StatusBadge } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Ticket = {
  id: string;
  status: string;
  reason?: string | null;
  conversation: { id: string; customer: { name?: string | null } };
};

export default function HandoffsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Ticket[] | null>(null);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Ticket[]>('/handoffs')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  async function assign(id: string) {
    await api(`/handoffs/${id}/assign`, { method: 'POST' });
    await api<Ticket[]>('/handoffs').then(setItems);
  }

  async function resolve(id: string) {
    await api(`/handoffs/${id}/resolve`, { method: 'POST' });
    setItems((prev) => (prev || []).map((t) => (t.id === id ? { ...t, status: 'resolved' } : t)));
  }

  return (
    <Shell>
      <PageHeader
        title="انتقال به انسان"
        description="گفتگوهایی که مشتری یا سیستم برای پیگیری شما علامت زده‌اند"
      />

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState
          title="تیکتی باز نیست"
          description="وقتی handoff شود اینجا می‌آید."
          actionHref="/conversations"
          actionLabel="مشاهده مکالمات"
        />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((t) => (
            <div key={t.id} className="list-row list-row-static">
              <div className="row-top">
                <div className="row-title">{t.conversation.customer?.name || 'مشتری'}</div>
                <StatusBadge status={t.status} />
              </div>
              <div className="row-sub">{t.reason || 'بدون دلیل ثبت‌شده'}</div>
              <div className="row-actions">
                <button className="btn btn-sm btn-ghost" type="button" onClick={() => assign(t.id)}>
                  پذیرش
                </button>
                <button className="btn btn-sm" type="button" onClick={() => resolve(t.id)}>
                  بستن
                </button>
                <Link href={`/conversations/${t.conversation.id}`} className="btn btn-sm btn-ghost">
                  مشاهده مکالمه
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
