'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EmptyState, LoadingBlocks, PageHeader, StatusBadge } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Conversation = {
  id: string;
  status: string;
  channel: string;
  messageCount: number;
  lastMessageAt: string;
  aiEnabled: boolean;
  customer: { name?: string | null; phone?: string | null };
  messages: { content: string }[];
};

export default function ConversationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[] | null>(null);

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    api<Conversation[]>('/conversations')
      .then(setItems)
      .catch(() => setItems([]));
  }, [router]);

  return (
    <Shell>
      <PageHeader
        title="مکالمات"
        description="گفتگوهای تلگرام و وب — مستقیم پاسخ بدهید یا AI را فعال کنید"
      />

      {items === null ? <LoadingBlocks /> : null}

      {items && items.length === 0 ? (
        <EmptyState
          title="هنوز مکالمه‌ای نیست"
          description="به‌محض پیام مشتری اینجا نمایش داده می‌شود."
        />
      ) : null}

      {items && items.length > 0 ? (
        <div className="list-stack">
          {items.map((c) => (
            <Link key={c.id} href={`/conversations/${c.id}`} className="list-row">
              <div className="row-top">
                <div className="row-title">{c.customer?.name || 'مشتری ناشناس'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-brand">{c.channel}</span>
                  <StatusBadge status={c.status} />
                  <span className={`badge ${c.aiEnabled ? 'badge-ok' : ''}`}>
                    AI {c.aiEnabled ? 'فعال' : 'خاموش'}
                  </span>
                </div>
              </div>
              <div className="row-sub">{c.messages[0]?.content || 'بدون پیام'}</div>
              <div className="row-foot">
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {c.customer?.phone ? `${c.customer.phone} · ` : ''}
                  {c.messageCount} پیام · {new Date(c.lastMessageAt).toLocaleString('fa-IR')}
                </span>
                <span style={{ color: 'var(--brand)', fontSize: 13, fontWeight: 600 }}>مشاهده ←</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
