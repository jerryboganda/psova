import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bell, BookOpen, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, Database,
  ExternalLink, FileHeart, FlaskConical, Globe2, Heart, HeartHandshake, Info, Languages, LockKeyhole,
  MapPin, MessageCircle, Navigation, Newspaper, Phone, RefreshCw, Search, Settings, Share2, ShieldCheck,
  Stethoscope, Trash2, UserRound, Users,
} from 'lucide-react';
import { contactPayloadSchema, directionsHref, localizedValue, matchesSearch, telHref, whatsappHref, type ContactPayload } from '@psova/domain';
import { SITE } from '@psova/content/site';
import { useApp } from './app-context';
import { Button, Card, Chip, EmptyState, ForwardRow, Page, ReviewBadge, SearchField } from './components';
import { enqueueContact, flushOutbox } from './outbox';
import { openExternal, requestNewsNotifications, shareContent } from './native';
import { registerRemotePush, TauriPushTokenProvider } from './push';
import { clearLocalData } from './storage';

function localized(locale: 'en' | 'ur') { return (value: { en: string; ur: string }) => localizedValue(value, locale); }

export function HomeScreen() {
  const { snapshot, settings, messages } = useApp();
  const l = localized(settings.locale);
  const featured = snapshot?.conditions[0];
  return <Page title="PSOVA">
    <section className="hero-card">
      <div className="hero-orb" aria-hidden="true" />
      <p className="eyebrow">{messages.home.eyebrow}</p>
      <h2>{messages.home.title}</h2>
      <p>{messages.home.body}</p>
      <div className="hero-actions"><Link className="button button-primary" to="/directory"><MapPin />{messages.home.directory}</Link><Link className="button button-secondary" to="/library"><BookOpen />{messages.home.library}</Link></div>
    </section>
    <div className="reassurance"><ShieldCheck /><strong>{messages.home.reassurance}</strong><span>{messages.home.safety}</span></div>
    <div className="two-column-cards">
      <Link className="path-card" to="/more/patients"><UserRound /><strong>{messages.home.parent}</strong><ChevronRight className="rtl-flip" /></Link>
      <Link className="path-card" to="/more/professionals"><Stethoscope /><strong>{messages.home.professional}</strong><ChevronRight className="rtl-flip" /></Link>
    </div>
    {featured && <section><div className="section-heading"><div><p className="eyebrow">{messages.home.featured}</p><h2>{l(featured.name)}</h2></div></div><Link to={`/library/${featured.slug}`} className="condition-feature" style={{ '--accent': featured.accent } as React.CSSProperties}><span className="condition-icon"><Heart /></span><div><strong>{l(featured.tagline)}</strong><p>{l(featured.summary)}</p></div><ChevronRight className="rtl-flip" /></Link></section>}
    <Card className="contact-strip"><MessageCircle /><div><strong>{messages.common.contact}</strong><p>{SITE.phone}</p></div><Button variant="secondary" onClick={() => void openExternal(whatsappHref(SITE.phone, 'Hello PSOVA')).catch(() => undefined)}>WhatsApp</Button></Card>
  </Page>;
}

export function LibraryScreen() {
  const { snapshot, settings, messages } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'tumor' | 'malformation'>('all');
  const l = localized(settings.locale);
  const items = useMemo(() => (snapshot?.conditions ?? []).filter((condition) =>
    (category === 'all' || condition.category === category) && matchesSearch(query, [l(condition.name), l(condition.short), l(condition.tagline), l(condition.summary)]),
  ), [snapshot, category, query, l]);
  return <Page title={messages.library.title} lead={messages.library.body} actions={<Link className="icon-button" to="/anatomy" aria-label={messages.library.anatomy}><FileHeart /></Link>}>
    <SearchField value={query} onChange={setQuery} placeholder={messages.library.placeholder} />
    <div className="chip-row"><Chip active={category === 'all'} onClick={() => setCategory('all')}>{messages.common.all}</Chip><Chip active={category === 'tumor'} onClick={() => setCategory('tumor')}>{messages.library.tumors}</Chip><Chip active={category === 'malformation'} onClick={() => setCategory('malformation')}>{messages.library.malformations}</Chip></div>
    <Link className="anatomy-promo" to="/anatomy"><FileHeart /><span><strong>{messages.library.anatomy}</strong><small>{messages.anatomy.body}</small></span><ChevronRight className="rtl-flip" /></Link>
    <div className="card-list">{items.map((condition) => <Link className="condition-card" to={`/library/${condition.slug}`} key={condition.slug} style={{ '--accent': condition.accent } as React.CSSProperties}><span className="condition-dot" /><div><small>{condition.category === 'tumor' ? messages.library.tumors : messages.library.malformations}</small><h2>{l(condition.name)}</h2><p>{l(condition.tagline)}</p></div><ChevronRight className="rtl-flip" /></Link>)}</div>
    {!items.length && <EmptyState>{messages.common.noResults}</EmptyState>}
  </Page>;
}

export function ConditionScreen() {
  const { slug } = useParams();
  const { snapshot, settings, messages } = useApp();
  const condition = snapshot?.conditions.find((item) => item.slug === slug);
  const l = localized(settings.locale);
  if (!condition) return <Page title={messages.common.noResults} back><EmptyState>{messages.common.noResults}</EmptyState></Page>;
  return <Page title={l(condition.name)} lead={l(condition.tagline)} back>
    <Card accent={condition.accent} className="condition-summary"><p>{l(condition.summary)}</p><div className="facts"><span><Clock3 /><small>{messages.library.onset}</small><strong>{l(condition.ageOnset)}</strong></span><span><Info /><small>{messages.library.prevalence}</small><strong>{l(condition.prevalence)}</strong></span></div></Card>
    <InfoBlock icon={<Search />} title={messages.library.signs}><ul>{condition.signs.map((sign) => <li key={sign.en}>{l(sign)}</li>)}</ul></InfoBlock>
    <InfoBlock icon={<Stethoscope />} title={messages.library.diagnosis}><p>{l(condition.diagnosis)}</p></InfoBlock>
    <InfoBlock icon={<HeartHandshake />} title={messages.library.treatment}><p>{l(condition.treatment)}</p></InfoBlock>
    <InfoBlock icon={<Bell />} title={messages.library.when} accent><p>{l(condition.whenToSeeDoctor)}</p></InfoBlock>
    <div className="medical-disclaimer"><ShieldCheck /><p>{messages.library.disclaimer}</p></div>
    <div className="sticky-actions"><Button onClick={() => void openExternal(telHref(SITE.phone)).catch(() => undefined)}><Phone />{messages.common.call}</Button><Button variant="secondary" onClick={() => void openExternal(whatsappHref(SITE.phone, l(condition.name))).catch(() => undefined)}><MessageCircle />WhatsApp</Button></div>
  </Page>;
}

function InfoBlock({ icon, title, children, accent = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; accent?: boolean }) {
  return <section className={`info-block ${accent ? 'accent' : ''}`}><h2>{icon}{title}</h2>{children}</section>;
}

export function AnatomyScreen() {
  const { snapshot, settings, messages } = useApp();
  const l = localized(settings.locale);
  return <Page title={messages.anatomy.title} lead={messages.anatomy.body} back><div className="anatomy-layout"><div className="body-figure" aria-hidden="true"><span className="head"/><span className="torso"/><span className="arm left"/><span className="arm right"/><span className="leg left"/><span className="leg right"/>{snapshot?.conditions.map((condition) => <Link key={condition.slug} to={`/library/${condition.slug}`} className="hotspot" style={{ left: `${condition.hotspot.x * 100}%`, top: `${condition.hotspot.y * 100}%`, '--accent': condition.accent } as React.CSSProperties} aria-label={l(condition.name)}><span /></Link>)}</div><div className="hotspot-list">{snapshot?.conditions.map((condition) => <Link key={condition.slug} to={`/library/${condition.slug}`}><span style={{ background: condition.accent }} />{l(condition.short)}<ChevronRight className="rtl-flip" /></Link>)}</div></div></Page>;
}

export function DirectoryScreen() {
  const { snapshot, settings, messages, favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState(''); const [province, setProvince] = useState('all'); const [type, setType] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const l = localized(settings.locale);
  const provinces = [...new Set((snapshot?.centers ?? []).map((center) => center.province.en))];
  const centers = (snapshot?.centers ?? []).filter((center) => (province === 'all' || center.province.en === province) && (type === 'all' || center.type === type) && matchesSearch(query, [l(center.name), l(center.city), l(center.province), ...center.services.map(l)]));
  const safeAction = async (action: () => Promise<unknown>) => { setActionError(null); try { await action(); } catch { setActionError('This action is unavailable or the destination is not approved.'); } };
  return <Page title={messages.directory.title} lead={messages.directory.body}>
    <div className="notice warning"><Info />{messages.directory.verify}</div>{actionError && <div className="notice danger">{actionError}</div>}
    <SearchField value={query} onChange={setQuery} placeholder={messages.directory.placeholder} />
    <div className="filter-grid"><label>{messages.directory.province}<select value={province} onChange={(e) => setProvince(e.target.value)}><option value="all">{messages.common.all}</option>{provinces.map((p) => <option key={p} value={p}>{p}</option>)}</select></label><label>{messages.directory.type}<select value={type} onChange={(e) => setType(e.target.value)}><option value="all">{messages.common.all}</option><option value="public">{messages.directory.public}</option><option value="private">{messages.directory.private}</option><option value="trust">{messages.directory.trust}</option></select></label></div>
    <div className="map-panel" aria-label="Stylised map of Pakistan"><div className="pakistan-shape" />{centers.map((center) => <span key={center.id} className="map-pin" style={{ left: `${center.pos.x * 100}%`, top: `${center.pos.y * 100}%` }} title={l(center.city)} />)}</div>
    <div className="card-list">{centers.map((center) => <Card key={center.id} className="center-card"><div className="card-top"><div><ReviewBadge status={center.verification.status} /><h2>{l(center.name)}</h2><p><MapPin />{l(center.city)}, {l(center.province)}</p></div><button className={`favorite ${favorites.has(center.id) ? 'active' : ''}`} aria-label={favorites.has(center.id) ? messages.directory.unfavorite : messages.directory.favorite} onClick={() => void toggleFavorite(center.id)}><Heart /></button></div><div className="service-list">{center.services.slice(0, 4).map((service) => <span key={service.en}>{l(service)}</span>)}</div><div className="action-row">{center.phone && <Button variant="secondary" onClick={() => void safeAction(() => openExternal(telHref(center.phone!)))}><Phone />{messages.common.call}</Button>}<Button variant="secondary" onClick={() => void safeAction(() => openExternal(directionsHref(center.geo.lat, center.geo.lng)))}><Navigation />{messages.common.directions}</Button><Button variant="ghost" aria-label={messages.common.share} onClick={() => void safeAction(() => shareContent({ title: l(center.name), text: `${l(center.city)}, ${l(center.province)}`, url: center.website }))}><Share2 /></Button>{center.website && <Button variant="ghost" aria-label={messages.common.website} onClick={() => void safeAction(() => openExternal(center.website!))}><ExternalLink /></Button>}</div></Card>)}</div>
    {!centers.length && <EmptyState>{messages.common.noResults}</EmptyState>}
  </Page>;
}

export function NewsScreen() {
  const { snapshot, settings, messages, setNotifications } = useApp();
  const l = localized(settings.locale); const [permissionMessage, setPermissionMessage] = useState('');
  const enable = async () => { const granted = await requestNewsNotifications().catch(() => false); if (!granted) { await setNotifications(false); setPermissionMessage(messages.news.permissionDenied); return; } try { await registerRemotePush(new TauriPushTokenProvider(), settings.locale); await setNotifications(true); setPermissionMessage(messages.news.enabled); } catch { await setNotifications(false); setPermissionMessage(messages.news.permissionDenied); } };
  return <Page title={messages.news.title} lead={messages.news.body}>
    <Card className="notification-card"><Bell /><div><strong>{messages.news.notifications}</strong><p>{permissionMessage || (settings.notifications ? messages.news.enabled : '')}</p></div><Button variant="secondary" onClick={() => void enable()} disabled={settings.notifications}>{settings.notifications ? <Check /> : messages.news.enable}</Button></Card>
    <div className="timeline">{snapshot?.news.map((item) => <Link key={item.id} to={`/news/${item.id}`} className="news-card"><div className="news-date"><CalendarDays /><span>{new Intl.DateTimeFormat(settings.locale === 'ur' ? 'ur-PK' : 'en-PK', { day: '2-digit', month: 'short' }).format(new Date(item.date))}</span></div><div><ReviewBadge status={item.publicationStatus} /><h2>{l(item.title)}</h2><p>{l(item.excerpt)}</p><small>{l(item.tag)}</small></div><ChevronRight className="rtl-flip" /></Link>)}</div>
  </Page>;
}

export function NewsDetailScreen() {
  const { id } = useParams(); const { snapshot, settings, messages } = useApp(); const l = localized(settings.locale);
  const item = snapshot?.news.find((news) => news.id === id);
  if (!item) return <Page title={messages.common.noResults} back><EmptyState>{messages.common.noResults}</EmptyState></Page>;
  return <Page title={l(item.title)} lead={new Intl.DateTimeFormat(settings.locale === 'ur' ? 'ur-PK' : 'en-PK', { dateStyle: 'long' }).format(new Date(item.date))} back><Card><ReviewBadge status={item.publicationStatus} /><p className="article-lead">{l(item.excerpt)}</p>{item.body && <p>{l(item.body)}</p>}</Card><div className="medical-disclaimer"><Info /><p>{messages.common.draft}: PSOVA must approve representative updates before public push distribution.</p></div></Page>;
}

export function MoreScreen() {
  const { messages } = useApp();
  return <Page title={messages.more.title}><div className="settings-list"><ForwardRow icon={<Settings />} title={messages.more.settings} to="/settings"/><ForwardRow icon={<MessageCircle />} title={messages.more.contact} to="/contact"/><ForwardRow icon={<HeartHandshake />} title={messages.more.donate} to="/more/donate"/><ForwardRow icon={<Info />} title={messages.more.about} to="/more/about"/><ForwardRow icon={<Users />} title={messages.more.patients} to="/more/patients"/><ForwardRow icon={<Stethoscope />} title={messages.more.professionals} to="/more/professionals"/><ForwardRow icon={<FlaskConical />} title={messages.more.research} to="/more/research"/><ForwardRow icon={<CircleHelp />} title={messages.more.glossary} to="/more/glossary"/><ForwardRow icon={<ShieldCheck />} title={messages.more.privacy} to="/more/privacy"/><ForwardRow icon={<Newspaper />} title={messages.more.terms} to="/more/terms"/><ForwardRow icon={<LockKeyhole />} title={messages.more.journal} subtitle={messages.more.journalLocked} to="/more/journal" disabled/></div></Page>;
}

export function ContactScreen() {
  const { settings, messages, online } = useApp(); const [status, setStatus] = useState<'idle'|'invalid'|'pending'|'sent'|'failed'>('idle');
  const [kind, setKind] = useState<'contact'|'ask-expert'|'pledge'>('contact'); const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', childAge: '' });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setStatus('idle'); const parsed = contactPayloadSchema.safeParse({ ...form, kind, locale: settings.locale, website: '' }); if (!parsed.success) { setStatus('invalid'); return; } const record = await enqueueContact(parsed.data as ContactPayload); if (!online) { setStatus('pending'); return; } const [result] = await flushOutbox(record.id); setStatus(result?.status === 'sent' ? 'sent' : 'failed'); };
  return <Page title={messages.contact.title} lead={messages.contact.body} back>
    <div className="notice warning"><Info />{messages.contact.privacy}</div>
    <form className="form-card" onSubmit={(event) => void submit(event)}><label>{messages.contact.kind}<select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="contact">{messages.contact.general}</option><option value="ask-expert">{messages.contact.expert}</option><option value="pledge">{messages.contact.pledge}</option></select></label><label>{messages.contact.name}<input value={form.name} onChange={update('name')} autoComplete="name" required /></label><div className="form-grid"><label>{messages.contact.email}<input type="email" value={form.email} onChange={update('email')} autoComplete="email" /></label><label>{messages.contact.phone}<input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" /></label></div>{kind === 'ask-expert' && <label>{messages.contact.childAge}<input value={form.childAge} onChange={update('childAge')} /></label>}<label>{messages.contact.subject}<input value={form.subject} onChange={update('subject')} /></label><label>{messages.contact.message}<textarea value={form.message} onChange={update('message')} rows={6} required={kind !== 'pledge'} /></label><Button type="submit"><MessageCircle />{online ? messages.contact.send : messages.contact.queue}</Button>{status !== 'idle' && <p className={`form-status ${status}`} role="status">{status === 'invalid' ? messages.contact.required : status === 'pending' ? messages.contact.pending : status === 'sent' ? messages.contact.sent : messages.contact.failed}</p>}</form>
  </Page>;
}

export function SettingsScreen() {
  const { snapshot, settings, messages, setLocale, setTheme, refresh, refreshing } = useApp(); const [notice, setNotice] = useState('');
  const remove = async () => { if (!window.confirm(messages.settings.deleteConfirm)) return; await clearLocalData(); setNotice(messages.settings.deleted); window.setTimeout(() => window.location.reload(), 700); };
  return <Page title={messages.settings.title} back><section className="settings-section"><h2><Languages />{messages.common.language}</h2><div className="segmented"><button className={settings.locale === 'en' ? 'active' : ''} onClick={() => void setLocale('en')}>{messages.common.english}</button><button className={settings.locale === 'ur' ? 'active' : ''} onClick={() => void setLocale('ur')}>{messages.common.urdu}</button></div></section><section className="settings-section"><h2><Globe2 />{messages.settings.appearance}</h2><div className="segmented three"><button className={settings.theme === 'system' ? 'active' : ''} onClick={() => void setTheme('system')}>{messages.settings.system}</button><button className={settings.theme === 'light' ? 'active' : ''} onClick={() => void setTheme('light')}>{messages.settings.light}</button><button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => void setTheme('dark')}>{messages.settings.dark}</button></div></section><section className="settings-section"><h2><Database />{messages.settings.storage}</h2><dl><div><dt>{messages.settings.revision}</dt><dd>{snapshot?.revision ?? '—'}</dd></div><div><dt>{messages.settings.published}</dt><dd>{snapshot ? new Date(snapshot.publishedAt).toLocaleDateString() : '—'}</dd></div><div><dt>{messages.settings.review}</dt><dd>{snapshot ? Object.values(snapshot.review).join(' · ') : '—'}</dd></div></dl><Button variant="secondary" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={refreshing ? 'spin' : ''}/>{messages.settings.refresh}</Button></section><section className="settings-section danger-zone"><h2><Trash2 />{messages.settings.deleteLocal}</h2><Button variant="danger" onClick={() => void remove()}>{messages.settings.deleteLocal}</Button>{notice && <p role="status">{notice}</p>}</section></Page>;
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
  return <Page title={title} back><Card><p className="article-lead">{body}</p></Card>{kind === 'donate' && <div className="sticky-actions"><Link to="/contact" className="button button-primary"><MessageCircle />{messages.common.contact}</Link><Button variant="secondary" onClick={() => void openExternal(telHref(SITE.phone)).catch(() => undefined)}><Phone />{messages.common.call}</Button></div>}</Page>;
}

export function GlossaryScreen() {
  const { snapshot, settings, messages } = useApp(); const [query, setQuery] = useState(''); const l = localized(settings.locale);
  const terms = (snapshot?.glossary ?? []).filter((item) => matchesSearch(query, [l(item.term), l(item.def)]));
  return <Page title={messages.more.glossary} back><SearchField value={query} onChange={setQuery} placeholder={messages.common.search}/><div className="glossary-list">{terms.map((item) => <details key={item.term.en}><summary>{l(item.term)}<ChevronRight className="rtl-flip" /></summary><p>{l(item.def)}</p></details>)}</div></Page>;
}
