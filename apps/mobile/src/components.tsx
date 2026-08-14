import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Home, Menu, Newspaper, Search, Stethoscope, WifiOff, X } from 'lucide-react';
import { useApp } from './app-context';
import { lightHaptic } from './native';

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-lockup" aria-label="PSOVA">
      <span className="logo-mark" aria-hidden="true"><span /></span>
      {!compact && <span className="logo-text">PSOVA</span>}
    </div>
  );
}

export function Page({ title, lead, children, back = false, actions }: { title: string; lead?: string; children: ReactNode; back?: boolean; actions?: ReactNode }) {
  const navigate = useNavigate();
  const { messages } = useApp();
  return (
    <main className="page" id="main-content">
      <header className="page-header">
        <div className="page-title-row">
          {back && <button className="icon-button" onClick={() => navigate(-1)} aria-label={messages.common.back}><ArrowLeft className="rtl-flip" /></button>}
          <div><h1>{title}</h1>{lead && <p>{lead}</p>}</div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      </header>
      <div className="page-body">{children}</div>
    </main>
  );
}

export function Card({ children, className = '', accent }: { children: ReactNode; className?: string; accent?: string }) {
  return <section className={`card ${className}`} style={accent ? { '--card-accent': accent } as React.CSSProperties : undefined}>{children}</section>;
}

export function Button({ children, variant = 'primary', className = '', onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button {...props} className={`button button-${variant} ${className}`} onClick={async (event) => { await lightHaptic().catch(() => undefined); onClick?.(event); }}>{children}</button>;
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick(): void }) {
  return <button className={`chip ${active ? 'active' : ''}`} aria-pressed={active} onClick={onClick}>{children}</button>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange(value: string): void; placeholder: string }) {
  const { messages } = useApp();
  return <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">{messages.common.search}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />{value && <button aria-label={messages.common.clear} onClick={() => onChange('')}><X /></button>}</label>;
}

export function StatusBanner() {
  const { online, error, messages } = useApp();
  if (!online) return <div className="status-banner offline" role="status"><WifiOff />{messages.common.offline}</div>;
  if (error) return <div className="status-banner warning" role="status">{error}</div>;
  return null;
}

export function ReviewBadge({ status }: { status: 'unverified' | 'verified' | 'stale' | 'draft' | 'published' }) {
  const { messages } = useApp();
  const label = status === 'verified' || status === 'published' ? 'Verified' : status === 'draft' ? messages.common.draft : messages.common.unverified;
  return <span className={`review-badge ${status}`}>{label}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state"><Search aria-hidden="true" /><p>{children}</p></div>;
}

export function LoadingScreen() {
  const { messages } = useApp();
  return <div className="loading-screen"><LogoMark /><div className="spinner" /><p>{messages.common.loading}</p></div>;
}

const tabIcons = { home: Home, library: BookOpen, directory: Stethoscope, news: Newspaper, more: Menu };
export function BottomTabs() {
  const { messages } = useApp();
  const tabs = [
    { key: 'home', to: '/' }, { key: 'library', to: '/library' }, { key: 'directory', to: '/directory' },
    { key: 'news', to: '/news' }, { key: 'more', to: '/more' },
  ] as const;
  return <nav className="bottom-tabs" aria-label="Primary"><div className="tab-inner">{tabs.map(({ key, to }) => { const Icon = tabIcons[key]; return <NavLink key={key} to={to} end={key === 'home'} className={({ isActive }) => isActive ? 'active' : ''}><Icon aria-hidden="true" /><span>{messages.tabs[key]}</span></NavLink>; })}</div></nav>;
}

export function ForwardRow({ icon, title, subtitle, to, disabled = false }: { icon: ReactNode; title: string; subtitle?: string; to: string; disabled?: boolean }) {
  const navigate = useNavigate();
  return <button className="forward-row" disabled={disabled} onClick={() => navigate(to)}>{icon}<span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>{!disabled && <ArrowRight className="rtl-flip" />}</button>;
}
