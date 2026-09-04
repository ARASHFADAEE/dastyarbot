'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Doc = {
  id: string;
  title: string;
  source?: string | null;
  _count: { chunks: number };
};

export default function KnowledgePage() {
  const router = useRouter();
  const [items, setItems] = useState<Doc[] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Doc[]>('/knowledge')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  async function ingest(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = await api<Doc>('/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title, content, source: 'admin' }),
      });
      setItems((prev) => [doc, ...(prev || [])]);
      setTitle('');
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <PageHeader
        title="پایگاه دانش"
        description="قوانین همکاری، FAQ و محتوای رسمی — منشی فقط از اینجا برای سیاست‌ها جواب می‌دهد"
      />

      <form onSubmit={ingest} className="surface surface-pad" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>ایندکس سند جدید</h2>
          <span>RAG / Embeddings</span>
        </div>
        <div className="form-grid">
          <label className="field-label">
            عنوان
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً شرایط پیش‌پرداخت"
              required
            />
          </label>
          <label className="field-label">
            محتوا
            <textarea
              className="field"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="متن دانش را اینجا بنویسید..."
              rows={7}
              required
            />
          </label>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'در حال ایندکس...' : 'ایندکس کردن'}
          </button>
        </div>
      </form>

      {items === null ? <LoadingBlocks /> : null}
      {items && items.length === 0 ? (
        <EmptyState title="سندی نیست" description="اولین سند دانش را از فرم بالا اضافه کنید." />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((d) => (
            <div key={d.id} className="list-row list-row-static">
              <div className="row-top">
                <div className="row-title">{d.title}</div>
                <span className="badge badge-brand">{d._count?.chunks ?? 0} قطعه</span>
              </div>
              <div className="row-sub">منبع: {d.source || '—'}</div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
