import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  ArrowRight, Bell, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Database,
  ExternalLink, FlaskConical, Globe2, Heart, HeartHandshake, Info, Languages, LockKeyhole,
  MapPin, MessageCircle, Navigation, Newspaper, Phone, RefreshCw, ScanSearch, Settings, Share2, ShieldCheck,
  SlidersHorizontal, Stethoscope, Trash2, TriangleAlert, UserRound, Users, X,
} from 'lucide-react';
import { contactPayloadSchema, directionsHref, localizedValue, matchesSearch, telHref, whatsappHref, type ContactPayload } from '@psova/domain';
import { SITE } from '@psova/content/site';
import { useApp } from './app-context';
import { Button, Card, Chip, CountUp, EASE_OUT, EmptyState, ForwardRow, ListGroup, LogoMark, Page, RevealHeading, ReviewBadge, SearchField, SectionHeader, Segmented, Sheet, SPRING } from './components';
import { FlowField } from './flow-field';
import { MAP_HEIGHT, PAKISTAN_PATH, projectToMap } from './pakistan-map';
import { enqueueContact, flushOutbox } from './outbox';
import { lightHaptic, openExternal, requestNewsNotifications, shareContent } from './native';
import { registerRemotePush, TauriPushTokenProvider } from './push';
import { clearLocalData } from './storage';

function localized(locale: 'en' | 'ur') { return (value: { en: string; ur: string }) => localizedValue(value, locale); }
const accentStyle = (accent: string) => ({ '--accent': accent }) as CSSProperties;
const dateFormat = (locale: 'en' | 'ur', options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-PK', options);
const tap = () => void lightHaptic().catch(() => undefined);

/** Category motif: tumours read as capillary clusters, malformations as branching vessels. */
function VesselGlyph({ kind }: { kind: 'tumor' | 'malformation' }) {
  return <svg className="vessel-glyph" viewBox="0 0 40 40" aria-hidden="true">{kind === 'tumor'
    ? <><circle cx="20" cy="21" r="7" pathLength="1" /><circle cx="11" cy="13" r="4" pathLength="1" /><circle cx="29" cy="12" r="3.5" pathLength="1" /><circle cx="29" cy="29" r="4.5" pathLength="1" /><circle cx="12" cy="29" r="3" pathLength="1" /><circle cx="20" cy="21" r="2.6" className="core" /></>
    : <><path d="M5 35C12 27 14 21 20 18S31 10 35 5" pathLength="1" /><path d="M20 18c1 7 6 11 14 13" pathLength="1" /><path d="M13 25C10 19 7 15 5 10" pathLength="1" /><path d="M27 12c-3-2-4-5-4-8" pathLength="1" /><circle cx="20" cy="18" r="2.6" className="core" /></>}</svg>;
}

/** Card that leans toward a mouse with spring physics and carries a pointer spotlight; touch gets press feedback only. */
function TiltLink({ to, className, style, children }: { to: string; className: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rotateX = useSpring(0, { stiffness: 220, damping: 18 }); const rotateY = useSpring(0, { stiffness: 220, damping: 18 });
  const move = (event: ReactPointerEvent) => {
    const node = ref.current; if (!node || event.pointerType !== 'mouse') return;
    const rect = node.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height;
    rotateY.set((x - 0.5) * 12); rotateX.set((0.5 - y) * 12);
    node.style.setProperty('--mx', `${x * 100}%`); node.style.setProperty('--my', `${y * 100}%`);
  };
  const reset = () => { rotateX.set(0); rotateY.set(0); };
  return <motion.div className="tilt-wrap" style={{ rotateX, rotateY, transformPerspective: 700 }} whileTap={{ scale: 0.97 }} transition={SPRING}>
    <Link ref={ref} to={to} className={`${className} spotlight`} style={style} onPointerMove={move} onPointerLeave={reset} onClick={tap}>{children}</Link>
  </motion.div>;
}

function MapGraphic({ pins, focused, onPin, id }: { pins: { id: string; x: number; y: number; label: string }[]; focused?: string | null; onPin?(id: string): void; id: string }) {
  return <svg className="map-graphic" viewBox={`-3 -3 106 ${MAP_HEIGHT + 6}`} role="group" aria-label="Map of Pakistan">
    <defs>
      <pattern id={`${id}-dots`} width="2.6" height="2.6" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r=".55" className="map-dot" /></pattern>
      <clipPath id={`${id}-clip`}><path d={PAKISTAN_PATH} /></clipPath>
      <radialGradient id={`${id}-sweep`}><stop offset="0" stopColor="var(--cyan)" stopOpacity=".5" /><stop offset="1" stopColor="var(--cyan)" stopOpacity="0" /></radialGradient>
    </defs>
    <g aria-hidden="true">
      <path d={PAKISTAN_PATH} className="map-land" />
      <rect x="0" y="0" width="100" height={MAP_HEIGHT} fill={`url(#${id}-dots)`} clipPath={`url(#${id}-clip)`} />
      <g clipPath={`url(#${id}-clip)`}><circle className="map-sweep" cx="52" cy={MAP_HEIGHT * 0.55} r="30" fill={`url(#${id}-sweep)`} /></g>
    </g>
    {pins.map((pin, index) => <g key={pin.id} className={`map-pin ${focused === pin.id ? 'focused' : ''}`} transform={`translate(${pin.x} ${pin.y})`} style={{ '--delay': `${index * -0.45}s` } as CSSProperties}
      {...(onPin ? { role: 'button', tabIndex: 0, 'aria-label': pin.label, onClick: () => onPin(pin.id), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') onPin(pin.id); } } : { 'aria-hidden': true })}>
      <circle r="5" className="pin-hit" /><circle r="3.2" className="pin-halo" /><circle r="1.3" className="pin-core" />
    </g>)}
  </svg>;
}

export function HomeScreen() {
  const { snapshot, settings, messages, setLocale } = useApp();
  const l = localized(settings.locale);
  const conditions = snapshot?.conditions ?? [];
  const centers = snapshot?.centers ?? [];
  const latest = snapshot?.news[0];
  const [touched, setTouched] = useState(false);
  const { scrollY } = useScroll();
  const fieldY = useTransform(scrollY, [0, 500], [0, 140]);
  const fieldOpacity = useTransform(scrollY, [0, 420], [1, 0.15]);
  const categoryLabel = (category: string) => category === 'tumor' ? messages.library.tumors : messages.library.malformations;
  return <main className="page home" id="main-content">
    <section className="home-hero" onPointerDown={() => setTouched(true)}>
      <div className="hero-aurora" aria-hidden="true" />
      <motion.div className="flow-host" style={{ y: fieldY, opacity: fieldOpacity }}><FlowField /></motion.div>
      <div className="home-top">
        <div className="brand-line"><LogoMark compact /><span><strong>PSOVA</strong><small>{l(SITE.fullName)}</small></span></div>
        <div className="page-actions">
          <button className="icon-button lang-switch" onClick={() => { tap(); void setLocale(settings.locale === 'en' ? 'ur' : 'en'); }}>{settings.locale === 'en' ? messages.common.urdu : messages.common.english}</button>
          <Link className="icon-button" to="/settings" aria-label={messages.more.settings} onClick={tap}><Settings /></Link>
        </div>
      </div>
      <AnimatePresence>{!touched && <motion.p className="touch-hint" aria-hidden="true" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.6, duration: 0.5, ease: EASE_OUT } }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}><span />{messages.home.tap}</motion.p>}</AnimatePresence>
      <div className="hero-copy">
        <RevealHeading text={messages.home.title} />
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.55 }}>{messages.home.body}</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.7 }}>
          <Link className="button button-primary shine" to="/directory" onClick={tap}><MapPin />{messages.home.directory}</Link>
          <Link className="button button-secondary" to="/library" onClick={tap}><BookOpen />{messages.home.library}</Link>
        </motion.div>
      </div>
    </section>

    <div className="page-body">
      <div className="reassurance"><span className="row-icon tone-cyan pulse-ring"><ShieldCheck /></span><span><strong>{messages.home.reassurance}</strong><small>{messages.home.safety}</small></span></div>

      <div className="bento">
        <TiltLink to="/directory" className="bento-tile bento-map">
          <MapGraphic id="bento-map" pins={centers.map((center) => ({ id: center.id, ...projectToMap(center.geo.lat, center.geo.lng), label: l(center.city) }))} />
          <span className="bento-copy"><strong className="bento-figure"><CountUp value={centers.length} /></strong><span>{messages.directory.centres}</span><small>{messages.home.directory}</small></span>
        </TiltLink>
        <TiltLink to="/anatomy" className="bento-tile bento-anatomy">
          <span className="bento-figure-art"><BodyFigure /></span>
          <span className="bento-copy"><strong>{messages.anatomy.title}</strong></span>
        </TiltLink>
        <TiltLink to="/contact" className="bento-tile bento-ask">
          <span className="row-icon tone-violet"><MessageCircle /></span>
          <span className="bento-copy"><strong>{messages.more.contact}</strong><ArrowRight className="rtl-flip" /></span>
        </TiltLink>
      </div>

      <section>
        <SectionHeader title={messages.home.conditions} to="/library" action={messages.home.seeAll} />
        <div className="rail" role="list">{conditions.map((condition) => <div role="listitem" key={condition.slug} className="rail-item">
          <TiltLink to={`/library/${condition.slug}`} className="rail-tile" style={accentStyle(condition.accent)}>
            <VesselGlyph kind={condition.category} />
            <small>{categoryLabel(condition.category)}</small>
            <strong>{l(condition.short)}</strong>
            <span>{l(condition.tagline)}</span>
          </TiltLink>
        </div>)}</div>
      </section>

      <ListGroup title={messages.home.paths}>
        <ForwardRow icon={<UserRound />} title={messages.home.parent} to="/more/patients" tone="rose" />
        <ForwardRow icon={<Stethoscope />} title={messages.home.professional} to="/more/professionals" tone="violet" />
      </ListGroup>

      {latest && <section>
        <SectionHeader title={messages.home.latest} to="/news" action={messages.home.seeAll} />
        <Link to={`/news/${latest.id}`} className="news-feature press" onClick={tap}>
          <div className="news-feature-meta"><span>{l(latest.tag)}</span><time dateTime={latest.date}>{dateFormat(settings.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(latest.date))}</time></div>
          <strong>{l(latest.title)}</strong>
          <p>{l(latest.excerpt)}</p>
          <span className="read-more">{messages.common.learnMore}<ArrowRight className="rtl-flip" /></span>
        </Link>
      </section>}

      <section className="contact-panel">
        <div><h2>{messages.home.reach}</h2><p dir="ltr">{SITE.phone}</p></div>
        <div className="contact-actions">
          <Button variant="secondary" aria-label={messages.common.call} onClick={() => void openExternal(telHref(SITE.phone)).catch(() => undefined)}><Phone /></Button>
          <Button onClick={() => void openExternal(whatsappHref(SITE.phone, 'Hello PSOVA')).catch(() => undefined)}><MessageCircle />WhatsApp</Button>
        </div>
      </section>
    </div>
  </main>;
}

export function LibraryScreen() {
  const { snapshot, settings, messages } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'tumor' | 'malformation'>('all');
  const l = localized(settings.locale);
  const items = useMemo(() => (snapshot?.conditions ?? []).filter((condition) =>
    (category === 'all' || condition.category === category) && matchesSearch(query, [l(condition.name), l(condition.short), l(condition.tagline), l(condition.summary)]),
  ), [snapshot, category, query, l]);
  return <Page title={messages.library.title} lead={messages.library.body} meta={<span className="count-pill"><strong><CountUp value={snapshot?.conditions.length ?? 0} /></strong>{messages.home.conditionsCount}</span>}>
    <SearchField value={query} onChange={setQuery} placeholder={messages.library.placeholder} />
    <div className="chip-row"><Chip group="library" active={category === 'all'} onClick={() => setCategory('all')}>{messages.common.all}</Chip><Chip group="library" active={category === 'tumor'} onClick={() => setCategory('tumor')}>{messages.library.tumors}</Chip><Chip group="library" active={category === 'malformation'} onClick={() => setCategory('malformation')}>{messages.library.malformations}</Chip></div>
    <Link className="anatomy-promo press" to="/anatomy" onClick={tap}>
      <span className="promo-figure" aria-hidden="true"><BodyFigure /></span>
      <span className="promo-text"><strong>{messages.library.anatomy}</strong><small>{messages.anatomy.body}</small></span>
      <ChevronRight className="rtl-flip" />
    </Link>
    {items.length > 0 && <motion.div layout className="list-group-body condition-list" transition={SPRING}>
      <AnimatePresence initial={false} mode="popLayout">{items.map((condition) => <motion.div layout key={condition.slug} className="condition-cell" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} transition={SPRING}>
        <Link className="condition-row" to={`/library/${condition.slug}`} style={accentStyle(condition.accent)} onClick={tap}>
          <span className="condition-gem"><VesselGlyph kind={condition.category} /></span>
          <span className="row-text"><small>{condition.category === 'tumor' ? messages.library.tumors : messages.library.malformations}</small><strong>{l(condition.name)}</strong><span>{l(condition.tagline)}</span></span>
          <ChevronRight className="rtl-flip row-chevron" />
        </Link>
      </motion.div>)}</AnimatePresence>
    </motion.div>}
    {!items.length && <EmptyState>{messages.common.noResults}</EmptyState>}
  </Page>;
}

export function ConditionScreen() {
  const { slug } = useParams();
  const { snapshot, settings, messages } = useApp();
  const condition = snapshot?.conditions.find((item) => item.slug === slug);
  const l = localized(settings.locale);
  if (!condition) return <Page title={messages.common.noResults} back><EmptyState>{messages.common.noResults}</EmptyState></Page>;
  return <Page title={l(condition.name)} lead={l(condition.tagline)} back accent={condition.accent} art={<VesselGlyph kind={condition.category} />}
    meta={<span className="category-pill"><VesselGlyph kind={condition.category} />{condition.category === 'tumor' ? messages.library.tumors : messages.library.malformations}</span>}>
    <section className="summary-panel">
      <p>{l(condition.summary)}</p>
      <dl className="facts">
        <div><dt><Clock3 />{messages.library.onset}</dt><dd>{l(condition.ageOnset)}</dd></div>
        <div><dt><Info />{messages.library.prevalence}</dt><dd>{l(condition.prevalence)}</dd></div>
      </dl>
    </section>
    <article className="article">
      <InfoBlock icon={<ScanSearch />} title={messages.library.signs}><ul className="check-list">{condition.signs.map((sign, index) => <motion.li key={sign.en} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, ease: EASE_OUT, delay: index * 0.05 }}><Check aria-hidden="true" />{l(sign)}</motion.li>)}</ul></InfoBlock>
      <InfoBlock icon={<Stethoscope />} title={messages.library.diagnosis}><p>{l(condition.diagnosis)}</p></InfoBlock>
      <InfoBlock icon={<HeartHandshake />} title={messages.library.treatment}><p>{l(condition.treatment)}</p></InfoBlock>
    </article>
    <section className="callout warning"><h2><TriangleAlert />{messages.library.when}</h2><p>{l(condition.whenToSeeDoctor)}</p></section>
    <p className="fine-print"><ShieldCheck />{messages.library.disclaimer}</p>
    <motion.div className="sticky-actions" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.25 }}><Button onClick={() => void openExternal(telHref(SITE.phone)).catch(() => undefined)}><Phone />{messages.common.call}</Button><Button variant="secondary" onClick={() => void openExternal(whatsappHref(SITE.phone, l(condition.name))).catch(() => undefined)}><MessageCircle />WhatsApp</Button></motion.div>
  </Page>;
}

function InfoBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="info-block"><h2><span className="row-icon tone-accent">{icon}</span>{title}</h2>{children}</section>;
}

/** Front-facing body outline with a schematic arterial tree; hotspots are positioned over it in fractions of the 1:2 box. */
function BodyFigure() {
  return <svg className="body-figure" viewBox="0 0 200 400" aria-hidden="true">
    <defs><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--figure-top)" /><stop offset="1" stopColor="var(--figure-bottom)" /></linearGradient></defs>
    <ellipse cx="100" cy="37" rx="21" ry="26" className="figure-shape" />
    <path className="figure-shape" d="M91 66C86 75 72 78 62 82C50 87 47 100 46 118L42 170L36 222C34 236 36 244 42 244C48 244 50 236 49 224L54 172L62 124C66 160 70 186 70 204C70 218 66 226 66 238L72 312L76 372C76 382 70 390 78 392L95 392L95 372L96 312L100 248L104 312L105 372L105 392L122 392C130 390 124 382 124 372L128 312L134 238C134 226 130 218 130 204C130 186 134 160 138 124L146 172L151 224C150 236 152 244 158 244C164 244 166 236 164 222L158 170L154 118C153 100 150 87 138 82C128 78 114 75 109 66Z" />
    <g className="figure-vessels">
      <path d="M100 30C96 44 98 60 100 76L100 206" /><path d="M100 92C88 94 70 100 58 124L48 172L42 226" /><path d="M100 92C112 94 130 100 142 124L152 172L158 226" />
      <path d="M100 206C94 236 86 270 84 312L86 380" /><path d="M100 206C106 236 114 270 116 312L114 380" /><path d="M100 140C92 150 88 160 86 176M100 140C108 150 112 160 114 176" />
    </g>
    <circle className="figure-heart" cx="106" cy="128" r="5" />
  </svg>;
}

export function AnatomyScreen() {
  const { snapshot, settings, messages } = useApp();
  const l = localized(settings.locale);
  const conditions = snapshot?.conditions ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const active = conditions.find((condition) => condition.slug === selected);
  const pick = (slug: string) => { tap(); setSelected((current) => current === slug ? null : slug); };
  return <Page title={messages.anatomy.title} lead={messages.anatomy.body} back>
    <div className="anatomy-layout">
      <div className={`anatomy-stage ${active ? 'has-selection' : ''}`}>
        <div className="figure-box">
          <BodyFigure />
          {conditions.map((condition) => <button key={condition.slug} className={`hotspot ${selected === condition.slug ? 'selected' : ''}`} style={{ left: `${condition.hotspot.x * 100}%`, top: `${condition.hotspot.y * 100}%`, ...accentStyle(condition.accent) }} aria-label={l(condition.name)} aria-pressed={selected === condition.slug} onClick={() => pick(condition.slug)}><span /></button>)}
        </div>
        <AnimatePresence mode="popLayout">{active && <motion.div key={active.slug} className="hotspot-card" style={accentStyle(active.accent)} initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }} transition={SPRING}>
          <span className="condition-gem"><VesselGlyph kind={active.category} /></span>
          <span className="row-text"><strong>{l(active.name)}</strong><span>{l(active.tagline)}</span></span>
          <Link className="button button-primary" to={`/library/${active.slug}`} onClick={tap} aria-label={`${messages.common.learnMore}: ${l(active.name)}`}><ArrowRight className="rtl-flip" /></Link>
        </motion.div>}</AnimatePresence>
      </div>
      <div className="list-group-body">{conditions.map((condition) => <button key={condition.slug} className={`condition-row compact ${selected === condition.slug ? 'selected' : ''}`} style={accentStyle(condition.accent)} onClick={() => pick(condition.slug)} aria-pressed={selected === condition.slug}><span className="dot" /><span className="row-text"><strong>{l(condition.short)}</strong></span><ChevronRight className="rtl-flip row-chevron" /></button>)}</div>
    </div>
  </Page>;
}

export function DirectoryScreen() {
  const { snapshot, settings, messages, favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState(''); const [province, setProvince] = useState('all'); const [type, setType] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false); const [focused, setFocused] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const l = localized(settings.locale);
  const all = snapshot?.centers ?? [];
  const provinces = [...new Set(all.map((center) => center.province.en))];
  const filter = (prov: string, kind: string) => all.filter((center) => (prov === 'all' || center.province.en === prov) && (kind === 'all' || center.type === kind) && matchesSearch(query, [l(center.name), l(center.city), l(center.province), ...center.services.map(l)]));
  const centers = filter(province, type);
  const activeFilters = (province !== 'all' ? 1 : 0) + (type !== 'all' ? 1 : 0);
  const typeLabel = (kind: string) => kind === 'all' ? messages.common.all : messages.directory[kind as 'public' | 'private' | 'trust'];
  const provinceLabel = (prov: string) => { const match = all.find((center) => center.province.en === prov); return match ? l(match.province) : messages.common.all; };
  const safeAction = async (action: () => Promise<unknown>) => { setActionError(null); try { await action(); } catch { setActionError('This action is unavailable or the destination is not approved.'); } };
  const focusCenter = (id: string) => { tap(); setFocused(id); document.getElementById(`center-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  return <Page title={messages.directory.title} lead={messages.directory.body}>
    <div className="map-panel">
      <MapGraphic id="directory-map" focused={focused} onPin={focusCenter} pins={centers.map((center) => ({ id: center.id, ...projectToMap(center.geo.lat, center.geo.lng), label: `${l(center.name)}, ${l(center.city)}` }))} />
      <div className="map-stat"><strong><CountUp value={centers.length} /></strong><span>{messages.directory.centres}</span></div>
    </div>
    <div className="notice warning"><Info />{messages.directory.verify}</div>{actionError && <div className="notice danger">{actionError}</div>}
    <div className="search-row">
      <SearchField value={query} onChange={setQuery} placeholder={messages.directory.placeholder} />
      <button className={`icon-button filter-button ${activeFilters ? 'has-filters' : ''}`} aria-label={messages.directory.filters} onClick={() => { tap(); setSheetOpen(true); }}><SlidersHorizontal />
        <AnimatePresence>{activeFilters > 0 && <motion.span className="filter-badge" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={SPRING}>{activeFilters}</motion.span>}</AnimatePresence>
      </button>
    </div>
    <AnimatePresence initial={false}>{activeFilters > 0 && <motion.div className="chip-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
      {province !== 'all' && <Chip active onClick={() => setProvince('all')}>{provinceLabel(province)}<X className="chip-x" /></Chip>}
      {type !== 'all' && <Chip active onClick={() => setType('all')}>{typeLabel(type)}<X className="chip-x" /></Chip>}
    </motion.div>}</AnimatePresence>
    <motion.div layout className="card-list" transition={SPRING}>
      <AnimatePresence initial={false} mode="popLayout">{centers.map((center) => { const saved = favorites.has(center.id); return <motion.div layout key={center.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }} transition={SPRING}>
        <Card id={`center-${center.id}`} className={`center-card ${focused === center.id ? 'focused' : ''}`}>
          <div className="center-head"><ReviewBadge status={center.verification.status} />
            <button className={`favorite ${saved ? 'active' : ''}`} aria-pressed={saved} aria-label={saved ? messages.directory.unfavorite : messages.directory.favorite} onClick={() => { tap(); void toggleFavorite(center.id); }}>
              <motion.span key={saved ? 'on' : 'off'} className="heart" initial={saved ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, duration: 0.5 }}><Heart /></motion.span>
              {saved && <span className="burst" />}
            </button></div>
          <h2>{l(center.name)}</h2>
          <p className="center-loc"><MapPin /><span>{l(center.city)}, {l(center.province)}</span><span className="center-type">{messages.directory[center.type]}</span></p>
          <div className="service-list">{center.services.slice(0, 4).map((service) => <span key={service.en}>{l(service)}</span>)}</div>
          <div className="action-row">
            {center.phone && <Button onClick={() => void safeAction(() => openExternal(telHref(center.phone!)))}><Phone />{messages.common.call}</Button>}
            <Button variant="secondary" onClick={() => void safeAction(() => openExternal(directionsHref(center.geo.lat, center.geo.lng)))}><Navigation />{messages.common.directions}</Button>
            <span className="action-spacer" />
            <Button variant="ghost" aria-label={messages.common.share} onClick={() => void safeAction(() => shareContent({ title: l(center.name), text: `${l(center.city)}, ${l(center.province)}`, url: center.website }))}><Share2 /></Button>
            {center.website && <Button variant="ghost" aria-label={messages.common.website} onClick={() => void safeAction(() => openExternal(center.website!))}><ExternalLink /></Button>}
          </div>
        </Card>
      </motion.div>; })}</AnimatePresence>
    </motion.div>
    {!centers.length && <EmptyState>{messages.common.noResults}</EmptyState>}
    <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={messages.directory.filters}
      footer={<><Button variant="secondary" onClick={() => { setProvince('all'); setType('all'); }}>{messages.directory.reset}</Button><Button onClick={() => setSheetOpen(false)}>{messages.directory.show} ({centers.length})</Button></>}>
      <fieldset className="sheet-group"><legend>{messages.directory.province}</legend><div className="chip-row wrap">{['all', ...provinces].map((prov) => <Chip key={prov} group="province" active={province === prov} onClick={() => setProvince(prov)}>{provinceLabel(prov)}<small className="chip-count">{filter(prov, type).length}</small></Chip>)}</div></fieldset>
      <fieldset className="sheet-group"><legend>{messages.directory.type}</legend><div className="chip-row wrap">{['all', 'public', 'private', 'trust'].map((kind) => <Chip key={kind} group="type" active={type === kind} onClick={() => setType(kind)}>{typeLabel(kind)}<small className="chip-count">{filter(province, kind).length}</small></Chip>)}</div></fieldset>
    </Sheet>
  </Page>;
}

export function NewsScreen() {
  const { snapshot, settings, messages, setNotifications } = useApp();
  const l = localized(settings.locale); const [permissionMessage, setPermissionMessage] = useState('');
  const enable = async () => { const granted = await requestNewsNotifications().catch(() => false); if (!granted) { await setNotifications(false); setPermissionMessage(messages.news.permissionDenied); return; } try { await registerRemotePush(new TauriPushTokenProvider(), settings.locale); await setNotifications(true); setPermissionMessage(messages.news.enabled); } catch { await setNotifications(false); setPermissionMessage(messages.news.permissionDenied); } };
  return <Page title={messages.news.title} lead={messages.news.body}>
    <section className="notification-card"><span className={`row-icon tone-violet ${settings.notifications ? '' : 'bell-ring'}`}><Bell /></span><div><strong>{messages.news.notifications}</strong><AnimatePresence>{(permissionMessage || settings.notifications) && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>{permissionMessage || messages.news.enabled}</motion.p>}</AnimatePresence></div><Button variant={settings.notifications ? 'secondary' : 'primary'} onClick={() => void enable()} disabled={settings.notifications} aria-label={settings.notifications ? messages.news.enabled : undefined}>{settings.notifications ? <Check /> : messages.news.enable}</Button></section>
    <div className="news-list">{snapshot?.news.map((item) => { const date = new Date(item.date); return <Link key={item.id} to={`/news/${item.id}`} className="news-row press" onClick={tap}>
      <time className="news-date" dateTime={item.date}><strong>{dateFormat(settings.locale, { day: '2-digit' }).format(date)}</strong><span>{dateFormat(settings.locale, { month: 'short' }).format(date)}</span><small>{date.getFullYear()}</small></time>
      <div className="news-body"><span className="news-tag">{l(item.tag)}</span><h2>{l(item.title)}</h2><p>{l(item.excerpt)}</p><ReviewBadge status={item.publicationStatus} /></div>
    </Link>; })}</div>
  </Page>;
}

export function NewsDetailScreen() {
  const { id } = useParams(); const { snapshot, settings, messages } = useApp(); const l = localized(settings.locale);
  const item = snapshot?.news.find((news) => news.id === id);
  if (!item) return <Page title={messages.common.noResults} back><EmptyState>{messages.common.noResults}</EmptyState></Page>;
  return <Page title={l(item.title)} back accent="#9b84ff" meta={<><span className="news-tag">{l(item.tag)}</span><time dateTime={item.date}>{dateFormat(settings.locale, { dateStyle: 'long' }).format(new Date(item.date))}</time></>}>
    <ReviewBadge status={item.publicationStatus} />
    <article className="article prose"><p className="article-lead">{l(item.excerpt)}</p>{item.body && <p>{l(item.body)}</p>}</article>
    <p className="fine-print"><Info />{messages.common.draft}: PSOVA must approve representative updates before public push distribution.</p>
  </Page>;
}

export function MoreScreen() {
  const { messages, settings } = useApp();
  return <Page title={messages.more.title}>
    <section className="brand-panel"><LogoMark compact animated /><div><strong>PSOVA</strong><span>{localizedValue(SITE.fullName, settings.locale)}</span></div></section>
    <ListGroup title={messages.more.help}>
      <ForwardRow icon={<MessageCircle />} title={messages.more.contact} to="/contact" tone="cyan" />
      <ForwardRow icon={<HeartHandshake />} title={messages.more.donate} to="/more/donate" tone="rose" />
    </ListGroup>
    <ListGroup title={messages.more.learn}>
      <ForwardRow icon={<Info />} title={messages.more.about} to="/more/about" tone="violet" />
      <ForwardRow icon={<Users />} title={messages.more.patients} to="/more/patients" tone="violet" />
      <ForwardRow icon={<Stethoscope />} title={messages.more.professionals} to="/more/professionals" tone="violet" />
      <ForwardRow icon={<FlaskConical />} title={messages.more.research} to="/more/research" tone="violet" />
      <ForwardRow icon={<CircleHelp />} title={messages.more.glossary} to="/more/glossary" tone="violet" />
    </ListGroup>
    <ListGroup title={messages.more.app}>
      <ForwardRow icon={<Settings />} title={messages.more.settings} to="/settings" tone="slate" />
      <ForwardRow icon={<ShieldCheck />} title={messages.more.privacy} to="/more/privacy" tone="slate" />
      <ForwardRow icon={<Newspaper />} title={messages.more.terms} to="/more/terms" tone="slate" />
      <ForwardRow icon={<LockKeyhole />} title={messages.more.journal} subtitle={messages.more.journalLocked} to="/more/journal" tone="slate" disabled />
    </ListGroup>
  </Page>;
}

export function ContactScreen() {
  const { settings, messages, online } = useApp(); const [status, setStatus] = useState<'idle'|'invalid'|'pending'|'sent'|'failed'>('idle');
  const [kind, setKind] = useState<'contact'|'ask-expert'|'pledge'>('contact'); const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', childAge: '' });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setStatus('idle'); const parsed = contactPayloadSchema.safeParse({ ...form, kind, locale: settings.locale, website: '' }); if (!parsed.success) { setStatus('invalid'); return; } const record = await enqueueContact(parsed.data as ContactPayload); if (!online) { setStatus('pending'); return; } const [result] = await flushOutbox(record.id); setStatus(result?.status === 'sent' ? 'sent' : 'failed'); };
  return <Page title={messages.contact.title} lead={messages.contact.body} back>
    <div className="notice warning"><TriangleAlert />{messages.contact.privacy}</div>
    <form className="form-card" onSubmit={(event) => void submit(event)}>
      <fieldset className="kind-picker"><legend>{messages.contact.kind}</legend><div className="chip-row wrap">{([['contact', messages.contact.general], ['ask-expert', messages.contact.expert], ['pledge', messages.contact.pledge]] as const).map(([value, label]) => <Chip key={value} group="kind" active={kind === value} onClick={() => setKind(value)}>{label}</Chip>)}</div></fieldset>
      <label>{messages.contact.name}<input value={form.name} onChange={update('name')} autoComplete="name" required /></label>
      <div className="form-grid"><label>{messages.contact.email}<input type="email" value={form.email} onChange={update('email')} autoComplete="email" /></label><label>{messages.contact.phone}<input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" /></label></div>
      <AnimatePresence initial={false}>{kind === 'ask-expert' && <motion.label className="collapsible" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>{messages.contact.childAge}<input value={form.childAge} onChange={update('childAge')} /></motion.label>}</AnimatePresence>
      <label>{messages.contact.subject}<input value={form.subject} onChange={update('subject')} /></label>
      <label>{messages.contact.message}<textarea value={form.message} onChange={update('message')} rows={6} required={kind !== 'pledge'} /></label>
      <Button type="submit" className="block"><MessageCircle />{online ? messages.contact.send : messages.contact.queue}</Button>
      <AnimatePresence mode="wait">{status !== 'idle' && <motion.p key={status} className={`form-status ${status}`} role="status" initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>{status === 'invalid' ? messages.contact.required : status === 'pending' ? messages.contact.pending : status === 'sent' ? messages.contact.sent : messages.contact.failed}</motion.p>}</AnimatePresence>
    </form>
  </Page>;
}

export function SettingsScreen() {
  const { snapshot, settings, messages, setLocale, setTheme, refresh, refreshing } = useApp(); const [notice, setNotice] = useState('');
  const remove = async () => { if (!window.confirm(messages.settings.deleteConfirm)) return; await clearLocalData(); setNotice(messages.settings.deleted); window.setTimeout(() => window.location.reload(), 700); };
  return <Page title={messages.settings.title} back>
    <section className="settings-section"><h2><Languages />{messages.common.language}</h2><Segmented id="locale" value={settings.locale} onChange={(value) => void setLocale(value)} options={[{ value: 'en', label: messages.common.english }, { value: 'ur', label: messages.common.urdu }]} /></section>
    <section className="settings-section"><h2><Globe2 />{messages.settings.appearance}</h2><Segmented id="theme" value={settings.theme} onChange={(value) => void setTheme(value)} options={(['system', 'light', 'dark'] as const).map((theme) => ({ value: theme, label: messages.settings[theme] }))} /></section>
    <section className="settings-section"><h2><Database />{messages.settings.storage}</h2><dl><div><dt>{messages.settings.revision}</dt><dd>{snapshot?.revision ?? '—'}</dd></div><div><dt>{messages.settings.published}</dt><dd>{snapshot ? new Date(snapshot.publishedAt).toLocaleDateString() : '—'}</dd></div><div><dt>{messages.settings.review}</dt><dd>{snapshot ? Object.values(snapshot.review).join(' · ') : '—'}</dd></div></dl><Button variant="secondary" className="block" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={refreshing ? 'spin' : ''}/>{messages.settings.refresh}</Button></section>
    <section className="settings-section danger-zone"><h2><Trash2 />{messages.settings.deleteLocal}</h2><Button variant="danger" className="block" onClick={() => void remove()}>{messages.settings.deleteLocal}</Button>{notice && <p role="status">{notice}</p>}</section>
  </Page>;
}

const staticCopy = {
  about: { en: ['About PSOVA', 'PSOVA is a national non-profit community connecting families, specialists, and centres so expert vascular anomaly care can become easier to find across Pakistan.'], ur: ['پی ایس او وی اے کا تعارف', 'پی ایس او وی اے ایک قومی غیر منافع بخش برادری ہے جو خاندانوں، ماہرین اور مراکز کو جوڑتی ہے تاکہ پاکستان بھر میں ماہرانہ علاج تلاش کرنا آسان ہو۔'] },
  patients: { en: ['For patients and families', 'Most vascular anomalies are not cancerous. The right diagnosis and a multidisciplinary team can clarify whether monitoring or treatment is appropriate.'], ur: ['مریضوں اور خاندانوں کے لیے', 'زیادہ تر ویسکولر ایناملیز کینسر نہیں۔ درست تشخیص اور کثیر ماہر ٹیم یہ واضح کر سکتی ہے کہ نگرانی یا علاج کب مناسب ہے۔'] },
  professionals: { en: ['For professionals', 'PSOVA aims to strengthen referral pathways, common classification, education, and responsible multicentre research.'], ur: ['ماہرین کے لیے', 'پی ایس او وی اے ریفرل کے راستوں، مشترکہ درجہ بندی، تعلیم اور ذمہ دار کثیر مرکزی تحقیق کو مضبوط بنانا چاہتا ہے۔'] },
  research: { en: ['Research', 'Registry and research activities remain planned. No patient registry or cloud record is created by this app.'], ur: ['تحقیق', 'رجسٹری اور تحقیقی سرگرمیاں ابھی منصوبہ بند ہیں۔ یہ ایپ مریض رجسٹری یا کلاؤڈ ریکارڈ نہیں بناتی۔'] },
  privacy: { en: ['Privacy', 'Core medical information is browsed without an account. Favorites, drafts, and preferences stay on this device. Contact messages are sent only when you choose to submit them. Sensitive journal features remain disabled pending approval.'], ur: ['رازداری', 'بنیادی طبی معلومات بغیر اکاؤنٹ دیکھی جا سکتی ہیں۔ محفوظ مراکز، مسودے اور ترجیحات اسی ڈیوائس پر رہتے ہیں۔ رابطہ پیغامات صرف آپ کے بھیجنے پر ارسال ہوتے ہیں۔ حساس جرنل فیچر منظوری تک بند ہے۔'] },
  terms: { en: ['Terms and medical disclaimer', 'Information is educational and is not diagnosis, treatment advice, emergency care, or a substitute for a qualified clinician. Directory and news records marked unverified or draft must be confirmed before reliance.'], ur: ['شرائط اور طبی وضاحت', 'معلومات تعلیمی ہیں؛ تشخیص، علاج کا مشورہ، ہنگامی نگہداشت، یا مستند معالج کا متبادل نہیں۔ غیر تصدیق شدہ ڈائرکٹری یا مسودہ خبر پر انحصار سے پہلے تصدیق کریں۔'] },
  donate: { en: ['Donate and get involved', 'Payment details are hidden until PSOVA verifies an approved donation channel. You can record a pledge or contact the confirmed PSOVA lead without transferring money in the app.'], ur: ['عطیہ اور ساتھ دیں', 'ادائیگی کی تفصیلات اس وقت تک پوشیدہ ہیں جب تک پی ایس او وی اے منظور شدہ چینل کی تصدیق نہ کرے۔ ایپ میں رقم منتقل کیے بغیر وعدہ درج یا تصدیق شدہ رابطہ سربراہ سے بات کی جا سکتی ہے۔'] },
} as const;

export function StaticScreen({ kind }: { kind: keyof typeof staticCopy }) {
  const { settings, messages } = useApp(); const [title, body] = staticCopy[kind][settings.locale];
  return <Page title={title} back accent={kind === 'donate' ? '#ff6b93' : '#9b84ff'}><article className="article prose"><p className="article-lead">{body}</p></article>{kind === 'donate' && <div className="sticky-actions"><Link to="/contact" className="button button-primary"><MessageCircle />{messages.common.contact}</Link><Button variant="secondary" onClick={() => void openExternal(telHref(SITE.phone)).catch(() => undefined)}><Phone />{messages.common.call}</Button></div>}</Page>;
}

export function GlossaryScreen() {
  const { snapshot, settings, messages } = useApp(); const [query, setQuery] = useState(''); const [open, setOpen] = useState<string | null>(null); const l = localized(settings.locale);
  const terms = (snapshot?.glossary ?? []).filter((item) => matchesSearch(query, [l(item.term), l(item.def)]));
  return <Page title={messages.more.glossary} back><SearchField value={query} onChange={setQuery} placeholder={messages.common.search}/>
    {terms.length > 0 && <div className="list-group-body glossary-list">{terms.map((item) => { const expanded = open === item.term.en; return <div key={item.term.en} className={`glossary-item ${expanded ? 'open' : ''}`}>
      <button className="glossary-term" aria-expanded={expanded} onClick={() => { tap(); setOpen(expanded ? null : item.term.en); }}>{l(item.term)}<ChevronDown className="row-chevron" /></button>
      <AnimatePresence initial={false}>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }} className="glossary-def"><p>{l(item.def)}</p></motion.div>}</AnimatePresence>
    </div>; })}</div>}
    {!terms.length && <EmptyState>{messages.common.noResults}</EmptyState>}
  </Page>;
}
