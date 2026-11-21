import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Permanently removes the signed-in member's account and the records that belong to it.
// Only the caller's own rows are touched — the id always comes from the verified session.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const service = base44.asServiceRole;

    await Promise.allSettled([
      service.entities.Playlist.deleteMany({ created_by_id: user.id }),
      service.entities.LibraryItem.deleteMany({ app_user_id: user.id }),
      service.entities.Base44Purchase.deleteMany({ appUserId: user.id }),
      service.entities.TermsAcceptance.deleteMany({ email: user.email }),
    ]);

    await service.entities.User.delete(user.id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('delete-account failed', error?.message || error);
    return Response.json(
      { error: error?.message || 'Could not delete this account.' },
      { status: 500 }
    );
  }
}