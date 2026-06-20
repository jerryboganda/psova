import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';

// Form intake endpoint for contact, ask-expert, and donation pledges. Validates
// input and (for now) logs it. Pledges (kind: 'pledge') should be routed to the
// donations hotline / an email provider (e.g. Resend) here once wired, using an
// env API key.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid submission.' },
      { status: 400 },
    );
  }

  // eslint-disable-next-line no-console
  console.log('[PSOVA submission]', parsed.data);

  return NextResponse.json({ ok: true });
}
