import { Sora, Inter, Noto_Nastaliq_Urdu, Noto_Naskh_Arabic } from 'next/font/google';

// Display + body for English/Latin.
export const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Urdu display (Nastaliq) + body (Naskh).
export const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-urdu',
  display: 'swap',
});

export const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-naskh',
  display: 'swap',
});

export const fontVariables = [
  sora.variable,
  inter.variable,
  notoUrdu.variable,
  notoNaskh.variable,
].join(' ');
