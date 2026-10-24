// Next.js server instrumentation: fail fast on a missing/invalid registry key
// instead of discovering it when the first family tries to enrol.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { assertRegistryCryptoConfig } = await import('./lib/registry/crypto');
  try {
    assertRegistryCryptoConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registry encryption keys are invalid.';
    if (process.env.NODE_ENV === 'production') throw error;
    console.error('[registry] crypto configuration:', message);
  }
}
