export async function expectThrow(fn: () => unknown, messageIncludes?: string) {
  try {
    await fn();
    throw new Error('Expected to throw');
  } catch (e: any) {
    if (messageIncludes) {
      expect(String(e.message || e)).toContain(messageIncludes);
    }
  }
}
