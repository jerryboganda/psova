import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BookOpen, MessageCircle, ShieldCheck, Stethoscope } from 'lucide-react';
import { useApp } from './app-context';
import { Button, EASE_OUT, LogoMark, Segmented } from './components';
import { enableNewsAlerts } from './push';

const SAFETY = 2;
const LAST = 3;
const accents = ['#3ee6d8', '#9b84ff', '#f5b95a', '#ff6b93'];
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.15, ease: EASE_OUT } }),
};

/** First-run flow: language, what the app offers, the medical disclaimer (must be acknowledged), and an alerts opt-in. */
export function Onboarding() {
  const { settings, messages, setLocale, completeOnboarding } = useApp();
  const m = messages.onboarding;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const go = (next: number) => { setDir(Math.sign(next - step) * (settings.locale === 'ur' ? -1 : 1)); setStep(next); };
  const finish = async (alerts: boolean) => {
    setBusy(true);
    await completeOnboarding(alerts && await enableNewsAlerts(settings.locale));
    navigate('/', { replace: true });
  };
  const features = [
    { icon: <BookOpen />, tone: 'cyan', title: m.libraryTitle, body: m.libraryBody },
    { icon: <Stethoscope />, tone: 'violet', title: m.directoryTitle, body: m.directoryBody },
    { icon: <MessageCircle />, tone: 'rose', title: m.askTitle, body: m.askBody },
  ];
  const slides = [
    <><LogoMark compact animated /><h1>{m.welcomeTitle}</h1><p>{m.welcomeBody}</p>
      <Segmented id="onboard-locale" value={settings.locale} onChange={(value) => void setLocale(value)} options={[{ value: 'en', label: messages.common.english }, { value: 'ur', label: messages.common.urdu }]} /></>,
    <><h1 tabIndex={-1} autoFocus>{m.featuresTitle}</h1>
      <ul className="onboard-features">{features.map((item) => <li key={item.tone}><span className={`row-icon tone-${item.tone}`}>{item.icon}</span><div><strong>{item.title}</strong><small>{item.body}</small></div></li>)}</ul></>,
    <><span className="row-icon tone-amber"><ShieldCheck /></span><h1 tabIndex={-1} autoFocus>{m.safetyTitle}</h1><p>{m.safetyBody}</p><p>{m.emergency}</p>
      <label className="onboard-check"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />{m.agree}</label></>,
    <><span className="row-icon tone-violet bell-ring"><Bell /></span><h1 tabIndex={-1} autoFocus>{m.alertsTitle}</h1><p>{m.alertsBody}</p></>,
  ];

  return <main className="onboarding" id="main-content" style={{ '--accent': accents[step] } as CSSProperties}>
    <div className="page-glow" aria-hidden="true" />
    <div className="onboarding-top">
      {step > 0 ? <button className="icon-button" aria-label={messages.common.back} onClick={() => go(step - 1)}><ArrowLeft className="rtl-flip" /></button> : <span />}
      <div className="onboarding-dots" role="progressbar" aria-valuemin={1} aria-valuemax={LAST + 1} aria-valuenow={step + 1} aria-label={m.progress}>{slides.map((_, index) => <span key={index} className={index === step ? 'active' : ''} />)}</div>
      {step < SAFETY ? <Button variant="ghost" onClick={() => go(SAFETY)}>{m.skip}</Button> : <span />}
    </div>
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.section key={step} className="onboarding-slide" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">{slides[step]}</motion.section>
    </AnimatePresence>
    <div className="onboarding-actions">
      {step < LAST && <Button className="block" onClick={() => go(step + 1)} disabled={step === SAFETY && !agreed}>{messages.common.continue}</Button>}
      {step === LAST && <><Button className="block" onClick={() => void finish(true)} disabled={busy}>{messages.news.enable}</Button>
        <Button variant="ghost" className="block" onClick={() => void finish(false)} disabled={busy}>{m.notNow}</Button></>}
    </div>
  </main>;
}
