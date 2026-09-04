'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader } from '@/components/ui';
import { api, formatMoney, getToken } from '@/lib/api';

type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  description?: string | null;
  prices: { amount: string | number }[];
};

export default function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    description: '',
    price: '',
  });

  async function load() {
    const list = await api<Product[]>('/products');
    setItems(list);
  }

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    load().catch(() => setItems([]));
  }, [router]);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const created = await api<Product>('/products', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
      }),
    });
    setItems((prev) => [created, ...(prev || [])]);
    setForm({ sku: '', name: '', category: '', description: '', price: '' });
    setNotice('خدمت جدید اضافه شد');
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.prices[0] ? Number(p.prices[0].amount) : ''));
    setNotice(null);
  }

  async function saveEdit(id: string) {
    if (!editPrice.trim() || Number.isNaN(Number(editPrice))) {
      setNotice('قیمت معتبر وارد کنید');
      return;
    }
    setSaving(true);
    try {
      const updated = await api<Product>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim() || undefined,
          price: Number(editPrice),
        }),
      });
      setItems((prev) => (prev || []).map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setNotice('قیمت به‌روز شد');
    } catch (e) {
      setNotice(String((e as Error).message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <PageHeader
        title="خدمات"
        description="کاتالوگ و قیمت پایه — منشی فقط از همین قیمت‌ها استفاده می‌کند"
      />

      {notice ? <div className="toast toast-ok">{notice}</div> : null}

      <form onSubmit={createProduct} className="surface surface-pad" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>افزودن خدمت</h2>
          <span>SKU باید یکتا باشد</span>
        </div>
        <div className="form-grid form-grid-auto">
          {(
            [
              ['sku', 'کد خدمت (مثل WP-WOO)'],
              ['name', 'نام خدمت'],
              ['category', 'دسته'],
              ['description', 'توضیح کوتاه'],
              ['price', 'قیمت پایه (ریال)'],
            ] as const
          ).map(([k, ph]) => (
            <label key={k} className="field-label">
              {ph}
              <input
                className="field"
                placeholder={ph}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={k === 'sku' || k === 'name' || k === 'price'}
              />
            </label>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" type="submit">
            افزودن خدمت
          </button>
        </div>
      </form>

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState title="خدمتی ثبت نشده" description="اولین خدمت را از فرم بالا اضافه کنید." />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((p) => (
            <div key={p.id} className="list-row list-row-static">
              {editingId === p.id ? (
                <div className="form-grid" style={{ gap: 10 }}>
                  <div className="row-top">
                    <span className="badge badge-brand">{p.sku}</span>
                  </div>
                  <label className="field-label">
                    نام
                    <input
                      className="field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    قیمت پایه (ریال)
                    <input
                      className="field"
                      type="number"
                      min={0}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </label>
                  <div className="row-actions" style={{ marginTop: 0 }}>
                    <button
                      className="btn btn-sm"
                      type="button"
                      disabled={saving}
                      onClick={() => saveEdit(p.id)}
                    >
                      {saving ? '...' : 'ذخیره'}
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="row-top">
                  <div>
                    <div className="row-title">{p.name}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-brand">{p.sku}</span>
                      {p.category ? <span className="badge">{p.category}</span> : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                      {p.prices[0] ? formatMoney(Number(p.prices[0].amount)) : '—'}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>ریال · پایه</div>
                    <button
                      className="btn btn-sm btn-ghost"
                      type="button"
                      style={{ marginTop: 10 }}
                      onClick={() => startEdit(p)}
                    >
                      ویرایش قیمت
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
