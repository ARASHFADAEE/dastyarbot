'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Shell } from '@/components/Shell';
import { PageHeader } from '@/components/ui';
import { api, formatMoney, formatPercent, getToken } from '@/lib/api';

type Summary = {
  conversations: number;
  customers: number;
  leads: number;
  hotLeads: number;
  callbackRequests: number;
  aiResolutionRate: number;
  humanHandoffRate: number;
  conversionRate: number;
  averageResponseTimeMs: number;
  averageConversationLength: number;
  aiCostUsd: number;
  series: { date: string; conversations: number; leads: number; costUsd: number }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Summary>('/analytics/summary')
      .then(setData)
      .catch((e) => setError(String(e.message || e)));
  }, [router]);

  if (!data && !error) {
    return (
      <Shell>
        <PageHeader title="داشبورد" description="در حال آماده‌سازی نمای فروش و پشتیبانی..." />
        <div className="hero-strip">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </Shell>
    );
  }

  const secondary = data
    ? [
        { label: 'مشتریان', value: formatMoney(data.customers) },
        { label: 'نرخ حل AI', value: formatPercent(data.aiResolutionRate) },
        { label: 'نرخ Handoff', value: formatPercent(data.humanHandoffRate) },
        { label: 'نرخ تبدیل', value: formatPercent(data.conversionRate) },
        { label: 'میانگین پاسخ', value: `${formatMoney(Math.round(data.averageResponseTimeMs))} ms` },
        { label: 'طول مکالمه', value: data.averageConversationLength.toFixed(1) },
        { label: 'هزینه AI', value: `$${data.aiCostUsd.toFixed(4)}` },
      ]
    : [];

  return (
    <Shell>
      <PageHeader
        title="داشبورد فروش و پشتیبانی"
        description="وضعیت مکالمات، لیدها و عملکرد منشی هوشمند در یک نگاه"
        actions={
          <Link href="/conversations" className="btn btn-sm">
            رفتن به مکالمات
          </Link>
        }
      />

      {error ? <div className="toast toast-err">{error}</div> : null}

      {data ? (
        <>
          <section className="hero-strip">
            <div className="kpi-hero">
              <div className="eyebrow">مکالمات فعال و ثبت‌شده</div>
              <div className="value">{formatMoney(data.conversations)}</div>
              <div className="hint">
                میانگین طول هر گفتگو {data.averageConversationLength.toFixed(1)} پیام · حل خودکار{' '}
                {formatPercent(data.aiResolutionRate)}
              </div>
            </div>
            <div className="kpi-card">
              <div className="label">لیدها</div>
              <div className="value">{formatMoney(data.leads)}</div>
              <div className="meta">{formatMoney(data.hotLeads)} لید داغ</div>
            </div>
            <div className="kpi-card">
              <div className="label">درخواست تماس</div>
              <div className="value">{formatMoney(data.callbackRequests)}</div>
              <div className="meta">پیگیری دستی لازم است</div>
            </div>
            <div className="kpi-card">
              <div className="label">نرخ تبدیل</div>
              <div className="value">{formatPercent(data.conversionRate)}</div>
              <div className="meta">از لید به همکاری</div>
            </div>
          </section>

          <section className="stat-grid">
            {secondary.map((c) => (
              <div key={c.label} className="stat-card">
                <div className="label">{c.label}</div>
                <div className="value">{c.value}</div>
              </div>
            ))}
          </section>

          <section className="panel-grid panel-grid-2">
            <div className="surface surface-pad" style={{ minHeight: 360 }}>
              <div className="section-title">
                <h2>روند ۱۴ روز اخیر</h2>
                <span>مکالمات و لیدها</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.series}>
                  <defs>
                    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontFamily: 'Vazirmatn',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="#0f766e"
                    fill="url(#c)"
                    name="مکالمات"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#0369a1"
                    fill="transparent"
                    name="لیدها"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="surface surface-pad">
              <div className="section-title">
                <h2>دسترسی سریع</h2>
                <span>اقدامات روزمره</span>
              </div>
              <div className="quick-links">
                <Link href="/conversations" className="quick-link">
                  <div>
                    <strong>مکالمات</strong>
                    <span>پاسخ مستقیم به مشتری از پنل</span>
                  </div>
                  <span className="arrow">←</span>
                </Link>
                <Link href="/handoffs" className="quick-link">
                  <div>
                    <strong>انتقال به انسان</strong>
                    <span>گفتگوهایی که نیاز به شما دارند</span>
                  </div>
                  <span className="arrow">←</span>
                </Link>
                <Link href="/callbacks" className="quick-link">
                  <div>
                    <strong>درخواست تماس</strong>
                    <span>{formatMoney(data.callbackRequests)} مورد در صف</span>
                  </div>
                  <span className="arrow">←</span>
                </Link>
                <Link href="/leads" className="quick-link">
                  <div>
                    <strong>لیدهای داغ</strong>
                    <span>{formatMoney(data.hotLeads)} لید با اولویت بالا</span>
                  </div>
                  <span className="arrow">←</span>
                </Link>
                <Link href="/settings" className="quick-link">
                  <div>
                    <strong>System Prompt</strong>
                    <span>شخصیت و قوانین منشی هوشمند</span>
                  </div>
                  <span className="arrow">←</span>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </Shell>
  );
}
