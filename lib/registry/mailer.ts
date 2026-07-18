// Transactional mail (nodemailer). Env-gated: with no SMTP config the functions
// log "[registry mail skipped]" and return — mail never fails a request
// (ARCHITECTURE §7). Messages carry the tracking code only, never medical/PII
// details (SECURITY §8, threat model "Mail interception").

import nodemailer, { type Transporter } from 'nodemailer';

let cachedTransport: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    cachedTransport = null;
    return null;
  }
  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransport;
}

async function send(to: string, subject: string, text: string): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    // Never log the recipient — email is PII (SECURITY §1/§8). Subject only.
    console.log('[registry mail skipped]', { subject });
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('[registry mail error]', {
      subject,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Enrollment confirmation — tracking code only. Bilingual plain text. */
export async function sendEnrollmentConfirmation(
  to: string,
  trackingCode: string,
): Promise<void> {
  const subject = 'NVAR Registry — Your tracking code / آپ کا ٹریکنگ کوڈ';
  const text = [
    'Thank you for enrolling in the National Vascular Anomaly Registry (NVAR).',
    '',
    `Your tracking code is: ${trackingCode}`,
    '',
    'Keep this code safe. You can use it, together with the phone number you gave,',
    'to check your application status at any time on the PSOVA website.',
    '',
    'PSOVA will review your submission. We never share your identity; your data is',
    'stored encrypted.',
    '',
    '— — —',
    '',
    'قومی ویسکولر اناملی رجسٹری (NVAR) میں اندراج کا شکریہ۔',
    '',
    `آپ کا ٹریکنگ کوڈ ہے: ${trackingCode}`,
    '',
    'اس کوڈ کو محفوظ رکھیں۔ آپ اسے اپنے دیے گئے فون نمبر کے ساتھ استعمال کر کے',
    'کسی بھی وقت PSOVA ویب سائٹ پر اپنی درخواست کی صورتحال دیکھ سکتے ہیں۔',
    '',
    'PSOVA آپ کی درخواست کا جائزہ لے گا۔ آپ کی شناخت کبھی ظاہر نہیں کی جاتی؛ آپ کا',
    'ڈیٹا خفیہ (encrypted) محفوظ کیا جاتا ہے۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}

/** Clinician approval notice. Bilingual plain text. */
export async function sendClinicianApproval(to: string, name: string): Promise<void> {
  const subject = 'NVAR — Clinician account approved / کلینشن اکاؤنٹ منظور';
  const text = [
    `Dear ${name},`,
    '',
    'Your clinician account for the National Vascular Anomaly Registry (NVAR) has',
    'been approved. You can now sign in and submit clinical cases.',
    '',
    'Sign in on the PSOVA website under the Registry section.',
    '',
    '— — —',
    '',
    `محترم ${name}،`,
    '',
    'قومی ویسکولر اناملی رجسٹری (NVAR) کے لیے آپ کا کلینشن اکاؤنٹ منظور کر لیا گیا',
    'ہے۔ اب آپ سائن اِن کر کے طبی کیس جمع کروا سکتے ہیں۔',
    '',
    'PSOVA ویب سائٹ پر رجسٹری سیکشن میں سائن اِن کریں۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}
