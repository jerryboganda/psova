# Store Screenshot Review Notes

Initial 430×932 review found the English home composition clear and readable with correct fixed navigation, but the Urdu home capture showed horizontal RTL overflow: the PSOVA heading and hero heading extended beyond the right viewport edge. This is a release-blocking layout defect and will be corrected before the screenshot set is accepted.

After switching capture to Chrome DevTools device emulation, both English and Urdu home screens render inside a true 430×932 CSS viewport with `scrollWidth <= 430`. The English and Urdu hero text, CTAs, reassurance message, audience cards, featured section, and all five bottom tabs fit without horizontal clipping. RTL order and icon direction are visually correct.

The English directory capture clearly shows the institution-verification warning, placeholder-phone suppression statement, search and filters, low-cost Pakistan map, verification badge, services, favorite control, directions, share, and website actions. The Urdu library capture fits the true mobile viewport, preserves RTL card flow, and shows translated search, filters, anatomy promotion, condition cards, and tab labels without clipping. The six-image set is accepted as engineering-preview store artwork pending brand/legal/content approval.
