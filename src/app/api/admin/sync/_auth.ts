export function isAuthorized(request: Request): boolean {
  const providedKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_SYNC_SECRET;

  if (!expectedKey) {
    console.error('[AdminSync] ADMIN_SYNC_SECRET is not configured');
    return false;
  }

  return providedKey === expectedKey;
}
