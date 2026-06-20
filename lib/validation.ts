import { z } from 'zod';

// Shared intake schema for the contact, ask-expert, and donation-pledge forms.
// Each client form validates its own fields locally; this guards the API route.
export const contactSchema = z
  .object({
    kind: z.enum(['contact', 'ask-expert', 'pledge']).default('contact'),
    name: z.string().min(2),
    email: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().optional(),
    childAge: z.string().optional(),
    // Donation pledge fields (only meaningful when kind === 'pledge').
    phone: z.string().optional(),
    amount: z.string().optional(),
    designation: z.enum(['general', 'zakat', 'sponsor-child', 'recurring']).optional(),
    method: z
      .enum(['any', 'bank', 'jazzcash', 'easypaisa', 'raast', 'international'])
      .optional(),
    preferredContact: z.enum(['phone', 'whatsapp', 'email']).optional(),
  })
  .superRefine((data, ctx) => {
    const emailOk = !!data.email && z.string().email().safeParse(data.email).success;

    if (data.kind === 'pledge') {
      // A pledge needs at least one way to reach the donor.
      const phoneOk = !!data.phone && data.phone.trim().length >= 6;
      if (!emailOk && !phoneOk) {
        ctx.addIssue({
          code: 'custom',
          message: 'Provide a phone number or a valid email.',
          path: ['phone'],
        });
      }
    } else {
      // contact + ask-expert keep their original strictness.
      if (!emailOk) {
        ctx.addIssue({ code: 'custom', message: 'A valid email is required.', path: ['email'] });
      }
      if (!data.message || data.message.length < 5) {
        ctx.addIssue({
          code: 'custom',
          message: 'Message must be at least 5 characters.',
          path: ['message'],
        });
      }
    }
  });

export type ContactInput = z.infer<typeof contactSchema>;
