'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { PageHeader } from '@/components/ui';
import { api, getToken } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Record<string, { text?: string }>>('/settings')
      .then((s) => setPrompt(s.system_prompt?.text || ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: 'system_prompt', value: { text: prompt } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <PageHeader
        title="تنظیمات"
        description="شخصیت منشی، قوانین فروش و System Prompt — روی همه کانال‌ها اعمال می‌شود"
      />

      {loading ? <div className="skeleton" style={{ height: 280 }} /> : null}

      {!loading ? (
        <form onSubmit={save} className="surface surface-pad" style={{ maxWidth: 820 }}>
          <div className="section-title">
            <h2>System Prompt دستیار</h2>
            <span>{prompt.length.toLocaleString('fa-IR')} کاراکتر</span>
          </div>
          <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            اگر خالی باشد، پرامپت پیش‌فرض کد استفاده می‌شود. برای کنترل دقیق‌تر، متن کامل منشی را اینجا ذخیره کنید.
          </p>
          <label className="field-label">
            متن پرامپت
            <textarea
              className="field"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={16}
              placeholder="تو منشی هوشمند آرش فدائی هستی..."
              style={{ minHeight: 320, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}
            />
          </label>
          <div className="row-actions" style={{ alignItems: 'center' }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
            {saved ? <span className="toast toast-ok" style={{ margin: 0 }}>ذخیره شد</span> : null}
          </div>
        </form>
      ) : null}
    </Shell>
  );
}
