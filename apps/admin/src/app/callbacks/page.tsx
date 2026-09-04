'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader, StatusBadge } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Callback = {
  id: string;
  phone: string;
  status: string;
  preferredTime?: string | null;
  notes?: string | null;
  customer: { name?: string | null };
};

export default function CallbacksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Callback[] | null>(null);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Callback[]>('/callbacks')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  async function mark(id: string, status: string) {
    await api(`/callbacks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setItems((prev) => (prev || []).map((i) => (i.id === id ? { ...i, status } : i)));
  }

  return (
    <Shell>
      <PageHeader
        title="درخواست‌های تماس"
        description="مشتریانی که خواستند با شما تماس گرفته شود — وضعیت را به‌روز کنید"
      />

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState title="درخواستی در صف نیست" description="درخواست‌های تماس جدید اینجا می‌آیند." />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((c) => (
            <div key={c.id} className="list-row list-row-static">
              <div className="row-top">
                <div>
                  <div className="row-title">{c.customer?.name || 'مشتری'}</div>
                  <div style={{ marginTop: 6 }}>
                    <a href={`tel:${c.phone}`} className="badge badge-brand" style={{ textDecoration: 'none' }}>
                      📞 {c.phone}
                    </a>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="row-sub">
                {c.preferredTime || 'زمان ترجیحی ثبت نشده'}
                {c.notes ? ` · ${c.notes}` : ''}
              </div>
              <div className="row-actions">
                <button className="btn btn-sm btn-ghost" type="button" onClick={() => mark(c.id, 'contacted')}>
                  تماس گرفته شد
                </button>
                <button className="btn btn-sm" type="button" onClick={() => mark(c.id, 'completed')}>
                  تکمیل
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
