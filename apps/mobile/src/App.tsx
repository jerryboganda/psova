import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './app-context';
import { BottomTabs, EASE_OUT, LoadingScreen, LogoMark, StatusBanner } from './components';
import { listenForDeepLinks } from './native';
import { Onboarding } from './onboarding';
import {
  AnatomyScreen, ConditionScreen, ContactScreen, DirectoryScreen, GlossaryScreen, HomeScreen, LibraryScreen,
  MoreScreen, NewsDetailScreen, NewsScreen, SettingsScreen, StaticScreen,
} from './screens';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('PSOVA UI error', error.name, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="fatal-error"><LogoMark/><h1>PSOVA could not open this screen</h1><p>Your saved information has not been deleted.</p><button className="button button-primary" onClick={() => window.location.reload()}>Restart app</button></div>;
  }
}

// Deeper routes slide in from the reading direction; sibling tabs (dir 0) only cross-fade, fast, because they are hit constantly.
const routeVariants = {
  enter: (dir: number) => (dir ? { opacity: 0, x: dir * 28 } : { opacity: 0 }),
  center: (dir: number) => ({ opacity: 1, x: 0, transition: { duration: dir ? 0.3 : 0.2, ease: EASE_OUT } }),
  exit: (dir: number) => ({ opacity: 0, x: dir * -10, transition: { duration: 0.1, ease: EASE_OUT } }),
};

function Shell() {
  const { loading, snapshot, settings } = useApp(); const navigate = useNavigate();
  const location = useLocation();
  const depth = location.pathname.split('/').filter(Boolean).length;
  const [prev, setPrev] = useState({ path: location.pathname, depth, dir: 0 });
  if (prev.path !== location.pathname) {
    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
    setPrev({ path: location.pathname, depth, dir: Math.sign(depth - prev.depth) * rtl });
  }
  const dir = prev.dir;
  useEffect(() => { let dispose: () => void = () => {}; void listenForDeepLinks((path) => navigate(path)).then((fn) => { dispose = fn; }); return () => dispose(); }, [navigate]);
  // Hold the splash briefly on cold start so the logo draw finishes instead of blinking past.
  const [splashHeld, setSplashHeld] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setSplashHeld(false), 1300); return () => window.clearTimeout(timer); }, []);
  const ready = !loading && !!snapshot;
  return <>
    {ready && (settings.onboarded ? <Main dir={dir}/> : <Onboarding/>)}
    <AnimatePresence>{(!ready || splashHeld) && <motion.div key="splash" className="splash-overlay" aria-hidden={ready} exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.45, ease: EASE_OUT } }}><LoadingScreen/></motion.div>}</AnimatePresence>
  </>;
}

function Main({ dir }: { dir: number }) {
  const location = useLocation();
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><StatusBanner/>
    <AnimatePresence mode="wait" initial={false} custom={dir} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div key={location.pathname} className="route" custom={dir} variants={routeVariants} initial="enter" animate="center" exit="exit">
        <Routes location={location}><Route path="/" element={<HomeScreen/>}/><Route path="/library" element={<LibraryScreen/>}/><Route path="/library/:slug" element={<ConditionScreen/>}/><Route path="/anatomy" element={<AnatomyScreen/>}/><Route path="/directory" element={<DirectoryScreen/>}/><Route path="/news" element={<NewsScreen/>}/><Route path="/news/:id" element={<NewsDetailScreen/>}/><Route path="/more" element={<MoreScreen/>}/><Route path="/contact" element={<ContactScreen/>}/><Route path="/settings" element={<SettingsScreen/>}/><Route path="/more/glossary" element={<GlossaryScreen/>}/>{(['about','patients','professionals','research','privacy','terms','donate'] as const).map((kind) => <Route key={kind} path={`/more/${kind}`} element={<StaticScreen kind={kind}/>}/>) }<Route path="*" element={<Navigate to="/" replace/>}/></Routes>
      </motion.div>
    </AnimatePresence>
    <BottomTabs/></div>;
}

export default function App() { return <ErrorBoundary><MotionConfig reducedMotion="user"><AppProvider><HashRouter><Shell/></HashRouter></AppProvider></MotionConfig></ErrorBoundary>; }
