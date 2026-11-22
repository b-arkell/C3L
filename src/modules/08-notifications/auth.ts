import { Elysia } from "elysia";

// 200 == signed in
// 401 == not signed in or deactivated
// IDENTITY_URL can point somewhere else (for example if Module 1 ever runs in its own container).
// Read each time (not once at startup) so the tests can point it at a fake Module 1.
function identityUrl(): string {
  return (
    process.env.IDENTITY_URL ??
    `http://localhost:${process.env.PORT ?? 3000}/01-identity-users`
  );
}

export interface CurrentUser {
  user_id: string;
  role: string;
}

type UserLookup = (request: Request) => Promise<CurrentUser | null>;

async function askIdentityModule(
  request: Request,
): Promise<CurrentUser | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null; // no cookie = nobody signed in, no need to ask

  const url = `${identityUrl()}/api/me`;
  try {
    const res = await fetch(url, { headers: { cookie } });
    if (res.status !== 200) return null;

    const body = (await res.json()) as {
      user?: { id?: string; role?: string };
    };
    if (!body.user?.id) return null;
    return { user_id: body.user.id, role: body.user.role ?? "student" };
  } catch {
    // Module 1 is down or unreachable: treat it as "not signed in"
    console.warn(`[08-notifications] could not reach ${url}`);
    return null;
  }
}

let lookup: UserLookup = askIdentityModule;

export function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  return lookup(request);
}

// TESTS Only: lets a test pick the user with ?user_id= instead of the actual modukle 1 call.
export function useFakeUserForTests(): void {
  lookup = async (request) => {
    const userId =
      new URL(request.url).searchParams.get("user_id") ?? "user_test";
    return { user_id: userId, role: "student" };
  };
}

// TESTS ONLY: go back to the real Module 1 lookup (undoes useFakeUserForTests).
export function useRealLoginForTests(): void {
  lookup = askIdentityModule;
}

const SIGN_IN_PAGE = "/01-identity-users/docs";

// Routes that .use(auth) get `user` in their handlers. Anyone not signed in is stopped here
// with a 401: JSON for /api/... routes, a short HTML page with a sign-in link for the rest.
export const auth = new Elysia({ name: "notif-auth" })
  .resolve({ as: "scoped" }, async ({ request }) => ({
    user: (await getCurrentUser(request)) as CurrentUser,
  }))
  .onBeforeHandle({ as: "scoped" }, ({ user, request, set }) => {
    if (user) return;
    set.status = 401;
    if (new URL(request.url).pathname.includes("/api/")) {
      return { error: "Not signed in." };
    }
    set.headers["content-type"] = "text/html; charset=utf-8";
    return `<h1>Please sign in</h1>
      <p>You need to be signed in to see this page.
      <a href="${SIGN_IN_PAGE}">Sign in with Module 1</a>, then come back.</p>`;
  });
