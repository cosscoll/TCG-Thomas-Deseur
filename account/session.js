/** Resolve the initial verified identity without treating a new visitor as an error. */
export async function resolveInitialUser(auth) {
  const {data: sessionData, error: sessionError} = await auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData?.session) return null;
  const {data: verified, error: identityError} = await auth.getUser();
  if (identityError || !verified?.user?.id) return null;
  return verified.user;
}
