import { invoke } from '@tauri-apps/api/core';
import { pushRegistrationSchema, type Locale } from '@psova/domain';
import { isNative } from './native';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'https://psova.polytronx.com';

export interface NativePushTokenProvider {
  getRegistration(): Promise<{ token: string; platform: 'android' | 'ios' }>;
}

export class TauriPushTokenProvider implements NativePushTokenProvider {
  async getRegistration(): Promise<{ token: string; platform: 'android' | 'ios' }> {
    if (!isNative()) throw new Error('Native push is available only in an Android or iOS build');
    return invoke('plugin:psova-push|get_registration');
  }
}

export async function registerRemotePush(provider: NativePushTokenProvider, locale: Locale): Promise<void> {
  const native = await provider.getRegistration();
  const registration = pushRegistrationSchema.parse({ ...native, locale, appVersion: '0.2.0', consentedAt: new Date().toISOString() });
  const response = await fetch(`${API_BASE}/api/v1/push/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registration) });
  if (!response.ok) throw new Error(`Push registration failed (${response.status})`);
}

export async function unregisterRemotePush(token: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/push/register`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
}
