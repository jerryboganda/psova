import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Share, X } from 'lucide-react';
import { useApp } from './app-context';
import { Button, LogoMark, SPRING } from './components';

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const DISMISSED = 'psova.installDismissed';

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined));
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iOS Safari has no install event, so it gets "Share → Add to Home Screen" instructions instead.
const iosSafari = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

/** "Install PSOVA" card shown in the browser until the app is installed or the user dismisses it. */
export function InstallPrompt() {
  const { messages } = useApp(); const m = messages.install;
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(DISMISSED) === '1'; } catch { return false; } });
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt); window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(DISMISSED, '1'); } catch { /* private mode: hide for this visit only */ } };
  const install = async () => { if (!event) return; await event.prompt(); if ((await event.userChoice).outcome === 'accepted') setEvent(null); };
  const visible = !standalone() && !dismissed && (event !== null || iosSafari());

  return <AnimatePresence>{visible && <motion.aside className="install-prompt" role="dialog" aria-label={m.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.6 } }} exit={{ opacity: 0, y: 24 }}>
    <LogoMark compact />
    <div className="install-copy"><strong>{m.title}</strong><p>{event ? m.body : <>{m.ios} <Share aria-hidden="true" className="inline-icon" /></>}</p></div>
    {event && <Button onClick={() => void install()}><Download />{m.install}</Button>}
    <button className="icon-button" aria-label={messages.common.close} onClick={dismiss}><X /></button>
  </motion.aside>}</AnimatePresence>;
}
