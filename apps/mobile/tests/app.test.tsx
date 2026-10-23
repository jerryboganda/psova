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
    expect(screen.getByRole('button', { name: 'Get started' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Get started' }));
    expect(await screen.findByText('Every birthmark has a story — and a path to care.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('psova.settings')!)).toMatchObject({ onboarded: true });
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

  it('checks a registration by tracking code and phone, and links out to the centres pages', async () => {
    const statusCalls: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/content-snapshot.json')) return new Response(JSON.stringify(snapshot), { status: 200 });
      if (String(input).endsWith('/api/registry/status')) {
        statusCalls.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({
          ok: true, status: 'CENTRE', submittedAt: '2026-06-01T10:00:00.000Z', firstName: 'Ayesha',
          centre: { en: 'City Vascular Clinic', ur: 'سٹی ویسکولر کلینک' },
          nextAppointment: { startsAt: '2030-07-01T04:00:00.000Z', kind: 'FOLLOW_UP' },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: false }), { status: 503 });
    }));
    render(<App/>);
    await screen.findByText('Every birthmark has a story — and a path to care.');
    await userEvent.click(screen.getByRole('link', { name: 'More' }));

    // The three website pages are plain links, so the installed app keeps them in its own window.
    expect(await screen.findByRole('link', { name: 'Apply as a centre' })).toHaveAttribute('href', 'https://psova.org.pk/en/centres/apply');
    expect(screen.getByRole('link', { name: 'Centre sign-in' })).toHaveAttribute('href', 'https://psova.org.pk/en/registry/login');
    expect(screen.getByRole('link', { name: 'Patient support fund' })).toHaveAttribute('href', 'https://psova.org.pk/en/support-fund');

    await userEvent.click(screen.getByRole('button', { name: 'Check registration status' }));
    expect(await screen.findByRole('heading', { name: 'Check registration status' })).toBeInTheDocument();

    // Both fields are required before anything is sent.
    await userEvent.click(screen.getByRole('button', { name: 'Check status' }));
    expect(await screen.findByText('Enter both the tracking code and the phone number.')).toBeInTheDocument();
    expect(statusCalls).toHaveLength(0);

    await userEvent.type(screen.getByLabelText('Tracking code'), 'psv-a1b2-c3d4');
    await userEvent.type(screen.getByLabelText('Phone number'), '03001234567');
    await userEvent.click(screen.getByRole('button', { name: 'Check status' }));

    expect(await screen.findByText('Registered with a centre')).toBeInTheDocument();
    expect(screen.getByText('City Vascular Clinic')).toBeInTheDocument();
    expect(screen.getByText(/Follow-up/)).toBeInTheDocument();
    expect(statusCalls).toEqual([{ trackingCode: 'psv-a1b2-c3d4', phone: '03001234567' }]);
    // Nothing the person typed is persisted on the device.
    expect(JSON.stringify([...Array(localStorage.length).keys()].map((i) => localStorage.getItem(localStorage.key(i)!)))).not.toContain('03001234567');
  });
});
