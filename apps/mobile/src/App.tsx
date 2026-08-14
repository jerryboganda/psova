import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './app-context';
import { BottomTabs, LoadingScreen, LogoMark, StatusBanner } from './components';
import { listenForDeepLinks } from './native';
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

function Shell() {
  const { loading, snapshot } = useApp(); const navigate = useNavigate();
  useEffect(() => { let dispose: () => void = () => {}; void listenForDeepLinks((path) => navigate(path)).then((fn) => { dispose = fn; }); return () => dispose(); }, [navigate]);
  if (loading || !snapshot) return <LoadingScreen/>;
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><StatusBanner/><Routes><Route path="/" element={<HomeScreen/>}/><Route path="/library" element={<LibraryScreen/>}/><Route path="/library/:slug" element={<ConditionScreen/>}/><Route path="/anatomy" element={<AnatomyScreen/>}/><Route path="/directory" element={<DirectoryScreen/>}/><Route path="/news" element={<NewsScreen/>}/><Route path="/news/:id" element={<NewsDetailScreen/>}/><Route path="/more" element={<MoreScreen/>}/><Route path="/contact" element={<ContactScreen/>}/><Route path="/settings" element={<SettingsScreen/>}/><Route path="/more/glossary" element={<GlossaryScreen/>}/>{(['about','patients','professionals','research','privacy','terms','donate'] as const).map((kind) => <Route key={kind} path={`/more/${kind}`} element={<StaticScreen kind={kind}/>}/>) }<Route path="*" element={<Navigate to="/" replace/>}/></Routes><BottomTabs/></div>;
}

export default function App() { return <ErrorBoundary><AppProvider><HashRouter><Shell/></HashRouter></AppProvider></ErrorBoundary>; }
