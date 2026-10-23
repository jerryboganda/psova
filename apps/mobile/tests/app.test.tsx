import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import App from '../src/App';
import snapshot from '../public/content-snapshot.json';

beforeEach(() => {
  window.location.hash = '#/';
  const memory = new Map<string, string>([['psova.settings', JSON.stringify({ onboarded: true })]]);
  vi.stubGlobal('localStorage', {
    get length() { return memory.size; },
    clear: () => memory.clear(),
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => [...memory.keys()][index] ?? null,
    removeItem: (key: string) => memory.delete(key),
    setItem: (key: string, value: string) => memory.set(key, value),
  } satisfies Storage);
  vi.stubGlobal('crypto', webcrypto as unknown as Crypto);
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/content-snapshot.json')) return new Response(JSON.stringify(snapshot), { status: 200 });
    return new Response(JSON.stringify({ ok: false }), { status: 503 });
  }));
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => cleanup());

describe('PSOVA mobile shell', () => {
  it('walks a first-time user through onboarding and requires the medical disclaimer', async () => {
    localStorage.removeItem('psova.settings');
    render(<App/>);
    expect(await screen.findByRole('heading', { name: 'Welcome to PSOVA' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByRole('heading', { name: 'Before you begin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(await screen.findByText('Every birthmark has a story — and a path to care.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('psova.settings')!)).toMatchObject({ onboarded: true, notifications: false });
  });

  it('opens bundled offline content and navigates to the condition library', async () => {
    render(<App/>);
    expect(await screen.findByText('Every birthmark has a story — and a path to care.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /Understand the conditions/i }));
    expect(await screen.findByRole('heading', { name: 'Condition library' })).toBeInTheDocument();
    expect(screen.getByText('Infantile Hemangioma')).toBeInTheDocument();
  });

  it('switches to Urdu and applies RTL immediately', async () => {
    render(<App/>);
    await screen.findByText('Every birthmark has a story — and a path to care.');
    await userEvent.click(screen.getByRole('link', { name: 'More' }));
    // Screens swap through an animated route transition, so wait for each to mount.
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByRole('button', { name: 'اردو' }));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(await screen.findByRole('heading', { name: 'سیٹنگز' })).toBeInTheDocument();
  });

  it('never exposes placeholder directory phone numbers', async () => {
    render(<App/>);
    await screen.findByText('Every birthmark has a story — and a path to care.');
    await userEvent.click(screen.getByRole('link', { name: 'Directory' }));
    expect(await screen.findByText(/Placeholder phone numbers are never shown/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/XXXXXXX|PLACEHOLDER —/i);
  });
});
