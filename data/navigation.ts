// Navigation structure. Labels resolve via next-intl ("Nav" namespace).
export type NavLink = { key: string; href: string };
export type NavGroup = { key: string; children: NavLink[] };
export type NavEntry = NavLink | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return (entry as NavGroup).children !== undefined;
}

export const NAV: NavEntry[] = [
  { key: 'about', href: '/about' },
  {
    key: 'learn',
    children: [
      { key: 'whatAreVA', href: '/what-are-vascular-anomalies' },
      { key: 'conditions', href: '/conditions' },
      { key: 'research', href: '/research' },
    ],
  },
  {
    key: 'support',
    children: [
      { key: 'patients', href: '/patients' },
      { key: 'professionals', href: '/professionals' },
    ],
  },
  { key: 'findCare', href: '/find-a-specialist' },
  { key: 'news', href: '/news' },
];

// Primary call-to-action links shown as buttons.
export const NAV_CTA = {
  donate: '/donate',
  contact: '/contact',
};

// Footer link columns.
export const FOOTER_LINKS: { titleKey: string; links: NavLink[] }[] = [
  {
    titleKey: 'learn',
    links: [
      { key: 'whatAreVA', href: '/what-are-vascular-anomalies' },
      { key: 'conditions', href: '/conditions' },
      { key: 'research', href: '/research' },
    ],
  },
  {
    titleKey: 'support',
    links: [
      { key: 'patients', href: '/patients' },
      { key: 'professionals', href: '/professionals' },
      { key: 'findCare', href: '/find-a-specialist' },
    ],
  },
  {
    titleKey: 'society',
    links: [
      { key: 'about', href: '/about' },
      { key: 'news', href: '/news' },
      { key: 'getInvolved', href: '/get-involved' },
      { key: 'donate', href: '/donate' },
      { key: 'contact', href: '/contact' },
    ],
  },
];
