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

/** Centre application received. Bilingual plain text. */
export async function sendCenterApplicationReceived(to: string, centerName: string): Promise<void> {
  const subject = 'PSOVA Centres Network — Application received / درخواست موصول';
  const text = [
    `Thank you for applying to join the PSOVA centres network with "${centerName}".`,
    '',
    'PSOVA will review your application and verify your membership payment. You will',
    'receive an email when your centre is approved.',
    '',
    '— — —',
    '',
    `PSOVA مراکز کے نیٹ ورک میں شمولیت کی درخواست ("${centerName}") کا شکریہ۔`,
    '',
    'PSOVA آپ کی درخواست اور رکنیت کی ادائیگی کی تصدیق کرے گا۔ منظوری پر آپ کو ای میل',
    'موصول ہوگی۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}

/** Centre approved. Bilingual plain text. */
export async function sendCenterApproved(to: string, centerName: string): Promise<void> {
  const subject = 'PSOVA Centres Network — Centre approved / مرکز منظور';
  const text = [
    `"${centerName}" has been approved as a PSOVA registered centre.`,
    '',
    'Sign in on the PSOVA website under the Registry section to open your centre',
    'dashboard. If your membership payment is not yet verified, the dashboard will',
    'show what is pending.',
    '',
    '— — —',
    '',
    `"${centerName}" کو PSOVA کے رجسٹرڈ مرکز کے طور پر منظور کر لیا گیا ہے۔`,
    '',
    'اپنا ڈیش بورڈ کھولنے کے لیے PSOVA ویب سائٹ پر رجسٹری سیکشن میں سائن اِن کریں۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}

/** Membership payment verified / rejected. Bilingual plain text. */
export async function sendCenterPaymentResult(
  to: string,
  centerName: string,
  verified: boolean,
  expiresOn?: string,
): Promise<void> {
  const subject = verified
    ? 'PSOVA Centres Network — Payment verified / ادائیگی کی تصدیق'
    : 'PSOVA Centres Network — Payment could not be verified / ادائیگی کی تصدیق نہ ہو سکی';
  const text = verified
    ? [
        `Your membership payment for "${centerName}" has been verified.`,
        `Your membership is active until ${expiresOn}.`,
        '',
        '— — —',
        '',
        `"${centerName}" کی رکنیت کی ادائیگی کی تصدیق ہو گئی ہے۔`,
        `آپ کی رکنیت ${expiresOn} تک فعال ہے۔`,
        '',
        '— PSOVA',
      ].join('\n')
    : [
        `We could not verify the membership payment submitted for "${centerName}".`,
        'Please sign in to your dashboard to see the reason and submit the details again.',
        '',
        '— — —',
        '',
        `"${centerName}" کے لیے جمع کروائی گئی ادائیگی کی تصدیق نہیں ہو سکی۔`,
        'وجہ دیکھنے اور تفصیلات دوبارہ جمع کروانے کے لیے ڈیش بورڈ میں سائن اِن کریں۔',
        '',
        '— PSOVA',
      ].join('\n');
  await send(to, subject, text);
}

/** Set/reset password link (staff invite or password reset). Bilingual plain text. */
export async function sendPasswordSetupEmail(to: string, name: string, url: string): Promise<void> {
  const subject = 'PSOVA — Set your password / اپنا پاس ورڈ مقرر کریں';
  const text = [
    `Dear ${name},`,
    '',
    'Use the link below to set your PSOVA account password. If you were invited to a',
    'centre, this is how you sign in for the first time. The link expires in 7 days.',
    '',
    url,
    '',
    'If you did not expect this email, you can ignore it.',
    '',
    '— — —',
    '',
    `محترم ${name}،`,
    '',
    'اپنے PSOVA اکاؤنٹ کا پاس ورڈ مقرر کرنے کے لیے نیچے دیا گیا لنک استعمال کریں۔ اگر آپ',
    'کو کسی مرکز میں مدعو کیا گیا ہے تو پہلی بار سائن اِن کرنے کا یہی طریقہ ہے۔ لنک 7 دن',
    'میں ختم ہو جاتا ہے۔',
    '',
    url,
    '',
    'اگر آپ کو اس ای میل کی توقع نہیں تھی تو اسے نظر انداز کر دیں۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}

/** Membership renewal reminder to the centre owner. Bilingual plain text. */
export async function sendRenewalReminder(to: string, centerName: string, expiresOn: string): Promise<void> {
  const subject = 'PSOVA Centres Network — Membership renewal / رکنیت کی تجدید';
  const text = [
    `The PSOVA membership for "${centerName}" runs until ${expiresOn}.`,
    'Please renew (PKR 12,000 per year) from the Membership page of your dashboard to',
    'stay listed and keep full access. After a 30-day grace period the centre is hidden',
    'from the directory and the dashboard becomes read-only. Your data is never deleted.',
    '',
    '— — —',
    '',
    `"${centerName}" کی PSOVA رکنیت ${expiresOn} تک ہے۔`,
    'فہرست میں رہنے اور مکمل رسائی برقرار رکھنے کے لیے ڈیش بورڈ کے رکنیت صفحے سے تجدید',
    '(12,000 روپے سالانہ) کریں۔ 30 دن کی رعایتی مدت کے بعد مرکز ڈائریکٹری سے ہٹ جاتا ہے',
    'اور ڈیش بورڈ صرف دیکھنے تک محدود ہو جاتا ہے۔ آپ کا ڈیٹا کبھی حذف نہیں کیا جاتا۔',
    '',
    '— PSOVA',
  ].join('\n');
  await send(to, subject, text);
}
