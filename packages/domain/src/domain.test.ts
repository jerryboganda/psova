import { describe, expect, it } from 'vitest';
import {
  assertAllowedExternalUrl,
  directionsHref,
  matchesSearch,
  normalizeSearch,
  parsePsovaDeepLink,
  retryDelaySeconds,
  shouldReplaceSnapshot,
  telHref,
  whatsappHref,
} from './index';

describe('search', () => {
  it('normalizes Urdu marks and punctuation', () => {
    expect(normalizeSearch('وَریدی—خرابی')).toBe('وریدی خرابی');
  });

  it('matches every query token', () => {
    expect(matchesSearch('vascular lahore', ['Lahore vascular clinic'])).toBe(true);
    expect(matchesSearch('vascular karachi', ['Lahore vascular clinic'])).toBe(false);
  });
});

describe('sync', () => {
  it('bounds retry delays and keeps jitter deterministic', () => {
    expect(retryDelaySeconds(0, 0)).toBe(24);
    expect(retryDelaySeconds(99, 999)).toBeLessThanOrEqual(6 * 60 * 60 * 1.2);
  });

  it('rejects invalid or unsupported snapshots', () => {
    expect(shouldReplaceSnapshot({ nextRevision: 'b', nextSchemaVersion: 1, checksumValid: false })).toBe(false);
    expect(shouldReplaceSnapshot({ currentRevision: 'a', nextRevision: 'b', nextSchemaVersion: 1, checksumValid: true })).toBe(true);
    expect(shouldReplaceSnapshot({ currentRevision: 'a', nextRevision: 'b', nextSchemaVersion: 2, checksumValid: true })).toBe(false);
  });
});

describe('safe URLs', () => {
  it('creates normalized contact and map links', () => {
    expect(telHref('+92 321 4261 950')).toBe('tel:+923214261950');
    expect(whatsappHref('+92 321 4261 950', 'Help')).toContain('wa.me/923214261950');
    expect(directionsHref(31.5, 74.3)).toContain('destination=31.5,74.3');
  });

  it('allows expected destinations and blocks arbitrary hosts', () => {
    expect(assertAllowedExternalUrl('https://wa.me/923214261950')).toContain('wa.me');
    expect(() => assertAllowedExternalUrl('javascript:alert(1)')).toThrow();
    expect(() => assertAllowedExternalUrl('https://evil.example/path')).toThrow();
  });

  it('parses supported deep links only', () => {
    expect(parsePsovaDeepLink('psova://condition/infantile-hemangioma')).toEqual({
      route: 'condition',
      id: 'infantile-hemangioma',
    });
    expect(() => parsePsovaDeepLink('psova://admin/users')).toThrow();
  });
});
