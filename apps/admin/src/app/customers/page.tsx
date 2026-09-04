'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  _count: { conversations: number };
  leads: { score: number; status: string }[];
};

export default function CustomersPage() {
  const router = useRouter();
  const [items, setItems] = useState<Customer[] | null>(null);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Customer[]>('/customers')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  async function remove(id: string) {
    if (!confirm('حذف کامل داده مشتری؟')) return;
    await api(`/privacy/customers/${id}`, { method: 'DELETE' });
    setItems((prev) => (prev || []).filter((c) => c.id !== id));
  }

  async function exportData(id: string) {
    const data = await api(`/privacy/customers/${id}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-${id}.json`;
    a.click();
  }

  return (
    <Shell>
      <PageHeader
        title="مشتریان"
        description="پروفایل‌ها، شماره تماس و لیدهای مرتبط — Export یا حذف حریم خصوصی"
      />

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState title="مشتری‌ای نیست" description="با اولین پیام تلگرام/وب ثبت می‌شوند." />
      ) : null}

      {items && items.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>تلفن</th>
                <th>مکالمات</th>
                <th>لید</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name || '—'}</strong>
                    {c.email ? (
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{c.email}</div>
                    ) : null}
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td>
                    <span className="badge">{c._count.conversations}</span>
                  </td>
                  <td>
                    {c.leads[0] ? (
                      <span className="badge badge-brand">
                        {c.leads[0].status} · {c.leads[0].score}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="row-actions" style={{ marginTop: 0 }}>
                      <button className="btn btn-sm btn-ghost" type="button" onClick={() => exportData(c.id)}>
                        Export
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => remove(c.id)}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Shell>
  );
}
