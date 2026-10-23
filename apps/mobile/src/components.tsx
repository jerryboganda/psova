import { Fragment, useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { ArrowLeft, BadgeCheck, BookOpen, ChevronRight, CircleDashed, Home, LayoutGrid, Newspaper, Search, Stethoscope, WifiOff, X } from 'lucide-react';
import { useApp } from './app-context';
import { lightHaptic } from './native';

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const SPRING = { type: 'spring', bounce: 0.18, duration: 0.45 } as const;
const tap = () => void lightHaptic().catch(() => undefined);

export function LogoMark({ compact = false, animated = false }: { compact?: boolean; animated?: boolean }) {
  return (
    <div className="logo-lockup" aria-label="PSOVA">
      <svg className={`logo-mark ${animated ? 'draw' : ''}`} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="psova-logo" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff5c8a" /><stop offset=".5" stopColor="#8b6cff" /><stop offset="1" stopColor="#3ee6d8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" className="logo-tile" />
        <path d="M6 22h7l3-9 5 15 3-8h10" pathLength="1" fill="none" stroke="url(#psova-logo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="logo-text">PSOVA</span>}
    </div>
  );
}

export function Page({ title, lead, children, back = false, actions, accent, meta, art }: { title: string; lead?: string; children: ReactNode; back?: boolean; actions?: ReactNode; accent?: string; meta?: ReactNode; art?: ReactNode }) {
  const navigate = useNavigate();
  const { messages } = useApp();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [condensed, setCondensed] = useState(false);
  useEffect(() => {
    const node = titleRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), { rootMargin: '-56px 0px 0px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <main className="page" id="main-content" style={accent ? { '--accent': accent } as CSSProperties : undefined}>
      {accent && <div className="page-glow" aria-hidden="true" />}
      <div className={`top-bar ${condensed ? 'condensed' : ''}`}>
        {back ? <button className="icon-button" onClick={() => { tap(); navigate(-1); }} aria-label={messages.common.back}><ArrowLeft className="rtl-flip" /></button> : <LogoMark compact />}
        <span className="top-bar-title" aria-hidden="true">{title}</span>
        <div className="page-actions">{actions}</div>
      </div>
      <header className="page-header">
        {art && <div className="page-art" aria-hidden="true">{art}</div>}
        {meta && <div className="page-meta">{meta}</div>}
        <h1 ref={titleRef}>{title}</h1>
        {lead && <p>{lead}</p>}
      </header>
      <div className="page-body">{children}</div>
    </main>
  );
}

/** Headline that resolves word by word out of a blur — the app's one orchestrated entrance. */
export function RevealHeading({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return <h1><span className="sr-only">{text}</span>{words.map((word, index) => <Fragment key={`${word}-${index}`}>
    <motion.span aria-hidden="true" className="word" initial={reduce ? false : { opacity: 0, y: '0.4em', filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.12 + index * 0.06 }}>{word}</motion.span>{index < words.length - 1 ? ' ' : ''}
  </Fragment>)}</h1>;
}

export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  useEffect(() => { const controls = animate(count, value, { duration: 1.2, ease: EASE_OUT }); return () => controls.stop(); }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
}

export function Card({ children, className = '', accent, id }: { children: ReactNode; className?: string; accent?: string; id?: string }) {
  return <section id={id} className={`card ${className}`} style={accent ? { '--accent': accent } as CSSProperties : undefined}>{children}</section>;
}

export function Button({ children, variant = 'primary', className = '', onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button {...props} className={`button button-${variant} ${className}`} onClick={async (event) => { await lightHaptic().catch(() => undefined); onClick?.(event); }}>{children}</button>;
}

/** Pill with a shared-layout highlight that glides between options in the same `group`. */
export function Chip({ active, children, onClick, group }: { active?: boolean; children: ReactNode; onClick(): void; group?: string }) {
  return <button className={`chip ${active ? 'active' : ''} ${group ? '' : 'solo'}`} aria-pressed={active} onClick={() => { tap(); onClick(); }}>
    {active && group && <motion.span layoutId={`chip-${group}`} className="chip-pill" transition={SPRING} />}
    <span className="chip-label">{children}</span>
  </button>;
}

export function Segmented<T extends string>({ id, value, options, onChange }: { id: string; value: T; options: { value: T; label: string }[]; onChange(value: T): void }) {
  return <div className={`segmented ${options.length === 3 ? 'three' : ''}`}>{options.map((option) => <button key={option.value} className={value === option.value ? 'active' : ''} aria-pressed={value === option.value} onClick={() => { tap(); onChange(option.value); }}>
    {value === option.value && <motion.span layoutId={`segment-${id}`} className="segment-pill" transition={SPRING} />}
    <span className="segment-label">{option.label}</span>
  </button>)}</div>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange(value: string): void; placeholder: string }) {
  const { messages } = useApp();
  return <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">{messages.common.search}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />
    <AnimatePresence>{value && <motion.button type="button" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} aria-label={messages.common.clear} onClick={() => onChange('')}><X /></motion.button>}</AnimatePresence>
  </label>;
}

/** Bottom sheet: springs up, drags down to dismiss (distance or flick velocity), Escape closes. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose(): void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { messages } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.documentElement.classList.add('sheet-open');
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('sheet-open'); };
  }, [open, onClose]);
  // Portalled so route-transition transforms never become the fixed sheet's containing block.
  return createPortal(<AnimatePresence>{open && <Fragment key="sheet">
    <motion.div className="sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
    <motion.div role="dialog" aria-modal="true" aria-label={title} className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', transition: { duration: 0.25, ease: EASE_OUT } }} transition={{ type: 'spring', bounce: 0.12, duration: 0.5 }}
      drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.04, bottom: 0.7 }} onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 500) onClose(); }}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head"><h2>{title}</h2><button ref={closeRef} className="icon-button" onClick={onClose} aria-label={messages.common.close}><X /></button></div>
      <div className="sheet-body">{children}</div>
      {footer && <div className="sheet-footer">{footer}</div>}
    </motion.div>
  </Fragment>}</AnimatePresence>, document.body);
}

export function StatusBanner() {
  const { online, error, messages } = useApp();
  if (!online) return <div className="status-banner offline" role="status"><WifiOff />{messages.common.offline}</div>;
  if (error) return <div className="status-banner warning" role="status">{error}</div>;
  return null;
}

export function ReviewBadge({ status }: { status: 'unverified' | 'verified' | 'stale' | 'draft' | 'published' }) {
  const { messages } = useApp();
  const ok = status === 'verified' || status === 'published';
  const label = ok ? messages.common.verified : status === 'draft' ? messages.common.draft : messages.common.unverified;
  return <span className={`review-badge ${ok ? 'ok' : 'pending'}`}>{ok ? <BadgeCheck aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}{label}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}><span><Search aria-hidden="true" /></span><p>{children}</p></motion.div>;
}

export function LoadingScreen() {
  const { messages } = useApp();
  return <div className="loading-screen" role="status"><div className="splash-glow" aria-hidden="true" /><LogoMark compact animated /><p className="splash-word">PSOVA</p><p className="sr-only">{messages.common.loading}</p></div>;
}

export function SectionHeader({ title, to, action }: { title: string; to?: string; action?: string }) {
  return <div className="section-header"><h2>{title}</h2>{to && action && <Link to={to}>{action}<ChevronRight className="rtl-flip" /></Link>}</div>;
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return <section className="list-group">{title && <h2 className="list-group-title">{title}</h2>}<div className="list-group-body">{children}</div></section>;
}

const tabIcons = { home: Home, library: BookOpen, directory: Stethoscope, news: Newspaper, more: LayoutGrid };
export function BottomTabs() {
  const { messages } = useApp();
  const tabs = [
    { key: 'home', to: '/' }, { key: 'library', to: '/library' }, { key: 'directory', to: '/directory' },
    { key: 'news', to: '/news' }, { key: 'more', to: '/more' },
  ] as const;
  return <nav className="bottom-tabs" aria-label="Primary"><div className="tab-inner">{tabs.map(({ key, to }) => { const Icon = tabIcons[key]; return <NavLink key={key} to={to} end={key === 'home'} className={({ isActive }) => isActive ? 'active' : ''} onClick={tap}>{({ isActive }) => <>
    {isActive && <motion.span layoutId="dock-pill" className="dock-pill" transition={SPRING} />}
    <span className="tab-icon"><Icon aria-hidden="true" /></span><span className="tab-label">{messages.tabs[key]}</span>
  </>}</NavLink>; })}</div></nav>;
}

export function ForwardRow({ icon, title, subtitle, to, disabled = false, tone = 'cyan' }: { icon: ReactNode; title: string; subtitle?: string; to: string; disabled?: boolean; tone?: 'cyan' | 'violet' | 'rose' | 'amber' | 'slate' }) {
  const navigate = useNavigate();
  return <button className="forward-row" disabled={disabled} onClick={() => { tap(); navigate(to); }}><span className={`row-icon tone-${tone}`}>{icon}</span><span className="row-text"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>{!disabled && <ChevronRight className="rtl-flip row-chevron" />}</button>;
}
