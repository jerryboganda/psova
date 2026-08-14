export const brandTokens = {
  color: {
    background: '#070a14',
    surface: '#10162a',
    surfaceElevated: '#17203a',
    text: '#f7f8ff',
    textMuted: '#aab3ce',
    primary: '#1fe0d4',
    primaryStrong: '#00a89f',
    secondary: '#8b3dff',
    accent: '#ff2d9b',
    warning: '#f7b955',
    danger: '#ff657a',
    success: '#4bd39b',
    border: 'rgba(255,255,255,0.12)',
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  motion: { fast: 120, normal: 220, slow: 360 },
} as const;

export type BrandTokens = typeof brandTokens;
