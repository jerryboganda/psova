import { handleContact } from '@/lib/server/contact-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleContact(request, { acceptLegacyPayload: true });
}
