'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { StatusBadge } from '@/components/ui';
import { api, getToken } from '@/lib/api';

type Detail = {
  id: string;
  status: string;
  channel: string;
  aiEnabled: boolean;
  customer: { id: string; name?: string | null; phone?: string | null };
  messages: { id: string; role: string; content: string; createdAt: string }[];
};

type ReplyResult = {
  message: { id: string };
  delivery: { delivered: boolean; channel?: string; error?: string };
};

const roleLabel: Record<string, string> = {
  user: 'مشتری',
  assistant: 'ربات',
  agent: 'شما',
};

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  async function load() {
    const d = await api<Detail>(`/conversations/${id}`);
    setData(d);
  }

  useEffect(() => {
    if (!getToken()) return void router.replace('/login');
    load().catch(console.error);
    const t = setInterval(() => load().catch(() => undefined), 8000);
    return () => clearInterval(t);
  }, [id, router]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [data?.messages.length]);

  async function sendReply() {
    if (!reply.trim() || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await api<ReplyResult>(`/conversations/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: reply.trim() }),
      });
      setReply('');
      await load();
      if (res.delivery?.delivered) {
        setNotice({ ok: true, text: 'پیام برای مشتری ارسال شد' });
      } else {
        setNotice({
          ok: false,
          text: res.delivery?.error || 'پیام ذخیره شد ولی به مشتری نرسید',
        });
      }
    } catch (e) {
      setNotice({ ok: false, text: String((e as Error).message || e) });
    } finally {
      setSending(false);
    }
  }

  if (!data) {
    return (
      <Shell>
        <p style={{ color: 'var(--muted)' }}>در حال بارگذاری مکالمه...</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="chat-shell">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1>{data.customer.name || 'مشتری ناشناس'}</h1>
              <p>
                {data.customer.phone ? `📞 ${data.customer.phone} · ` : ''}
                کانال {data.channel}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={data.status} />
              <span className={`badge ${data.aiEnabled ? 'badge-ok' : ''}`}>
                AI {data.aiEnabled ? 'فعال' : 'خاموش'}
              </span>
              <span className="badge badge-brand">{data.channel}</span>
            </div>
          </div>
        </header>

        {notice ? (
          <div className={`toast ${notice.ok ? 'toast-ok' : 'toast-err'}`}>{notice.text}</div>
        ) : null}

        <div className="chat-thread" ref={threadRef}>
          {data.messages
            .filter((m) => ['user', 'assistant', 'agent'].includes(m.role))
            .map((m) => (
              <div
                key={m.id}
                className={`bubble ${
                  m.role === 'user' ? 'bubble-user' : m.role === 'agent' ? 'bubble-agent' : 'bubble-bot'
                }`}
              >
                <div className="bubble-meta">
                  {roleLabel[m.role] || m.role} ·{' '}
                  {new Date(m.createdAt).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div>{m.content}</div>
              </div>
            ))}
        </div>

        <div className="chat-composer">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="پیام شما به مشتری..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendReply();
              }
            }}
          />
          <button className="btn-ghost btn" type="button" onClick={() =>
            api(`/conversations/${id}/resume-ai`, { method: 'POST' }).then(load)
          }>
            فعال‌سازی AI
          </button>
          <button className="btn" type="button" disabled={sending || !reply.trim()} onClick={sendReply}>
            {sending ? '...' : 'ارسال'}
          </button>
        </div>
      </div>
    </Shell>
  );
}
