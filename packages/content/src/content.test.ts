import { describe, expect, it } from 'vitest';
import {
  VALIDATED_CENTERS,
  VALIDATED_CONDITIONS,
  VALIDATED_GLOSSARY,
  VALIDATED_NEWS,
} from './index';

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

describe('canonical content', () => {
  it('uses unique stable identifiers', () => {
    expect(unique(VALIDATED_CONDITIONS.map((item) => item.slug))).toBe(true);
    expect(unique(VALIDATED_CENTERS.map((item) => item.id))).toBe(true);
    expect(unique(VALIDATED_NEWS.map((item) => item.id))).toBe(true);
  });

  it('has complete bilingual content and valid center relationships', () => {
    const slugs = new Set(VALIDATED_CONDITIONS.map((item) => item.slug));
    for (const condition of VALIDATED_CONDITIONS) {
      expect(condition.name.en.length).toBeGreaterThan(0);
      expect(condition.name.ur.length).toBeGreaterThan(0);
    }
    for (const center of VALIDATED_CENTERS) {
      expect(center.conditions.every((slug) => slugs.has(slug))).toBe(true);
      expect(center.verification.status).toBe('unverified');
    }
    expect(VALIDATED_GLOSSARY.length).toBeGreaterThan(0);
  });

  it('does not expose placeholder phone numbers in validated mobile content', () => {
    for (const center of VALIDATED_CENTERS) {
      expect(center.phone ?? '').not.toMatch(/X|PLACEHOLDER/i);
    }
  });

  it('keeps representative news in draft state until publication approval', () => {
    expect(VALIDATED_NEWS.every((item) => item.publicationStatus === 'draft')).toBe(true);
  });
});
