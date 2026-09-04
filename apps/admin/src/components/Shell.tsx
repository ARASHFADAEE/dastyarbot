'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';
import styles from './Shell.module.css';

const links = [
  { href: '/', label: 'داشبورد' },
  { href: '/conversations', label: 'مکالمات' },
  { href: '/customers', label: 'مشتریان' },
  { href: '/leads', label: 'لیدها' },
  { href: '/callbacks', label: 'درخواست تماس' },
  { href: '/products', label: 'خدمات' },
  { href: '/knowledge', label: 'دانش' },
  { href: '/handoffs', label: 'انتقال به انسان' },
  { href: '/settings', label: 'تنظیمات' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={styles.layout}>
      <aside className={styles.aside}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>F</div>
          <div>
            <div className={styles.brandTitle}>Fadaee Desk</div>
            <div className={styles.brandSub}>Sales · Support · CRM</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${active ? styles.linkActive : ''}`}
              >
                <span className={styles.dot} />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          className={styles.logout}
          onClick={() => {
            clearToken();
            router.push('/login');
          }}
        >
          خروج از حساب
        </button>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
