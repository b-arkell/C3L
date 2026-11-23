import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { useRealLoginForTests } from "./auth";
import mod from "./index";

// These tests use the REAL login check in auth.ts, which calls Module 1's GET /api/me over HTTP.
// Instead of the real Module 1, a small fake one runs on a random free port (port 0). It acts
// like Module 1's /api/me: one cookie counts as signed in, anything else gets a 401.
// (Same idea as src/examples/proxy-demo/forward.test.ts.)

const GOOD_COOKIE = "better-auth.session_token=good-test-token";
const FAKE_USER = {
  id: "user_from_module1",
  name: "Test",
  role: "student",
  active: true,
};

// What the fake Module 1 saw, so the tests can check what auth.ts actually sent it
let calls = 0;
let lastPath = "";
let lastCookie: string | null = null;

const fakeIdentity = Bun.serve({
  port: 0,
  fetch(req) {
    calls++;
    lastPath = new URL(req.url).pathname;
    lastCookie = req.headers.get("cookie");
    if (
      lastPath === "/01-identity-users/api/me" &&
      lastCookie === GOOD_COOKIE
    ) {
      return Response.json({ user: FAKE_USER });
    }
    return Response.json({ error: "Not signed in." }, { status: 401 });
  },
});

const fakeIdentityUrl = `http://localhost:${fakeIdentity.port}/01-identity-users`;
const oldIdentityUrl = process.env.IDENTITY_URL;

beforeAll(() => {
  useRealLoginForTests(); // undo the ?user_id= fake that other test files turn on
  process.env.IDENTITY_URL = fakeIdentityUrl;
});

afterAll(() => {
  process.env.IDENTITY_URL = oldIdentityUrl;
  if (oldIdentityUrl === undefined) delete process.env.IDENTITY_URL;
  fakeIdentity.stop(true);
});

beforeEach(() => {
  calls = 0;
  lastPath = "";
  lastCookie = null;
});

const get = (path: string, cookie?: string) =>
  mod.router.handle(
    new Request(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );

// ---------- Signed in ----------

test("signed in: the inbox shows the user Module 1 says is signed in", async () => {
  const res = await get("/inbox", GOOD_COOKIE);
  expect(res.status).toBe(200);
  expect(await res.text()).toContain(`Signed in as ${FAKE_USER.id}`);
});

test("signed in: our module asks Module 1 /api/me and passes the browser cookie along", async () => {
  await get("/api/users/me/notifications", GOOD_COOKIE);
  expect(calls).toBe(1);
  expect(lastPath).toBe("/01-identity-users/api/me");
  expect(lastCookie).toBe(GOOD_COOKIE);
});

test("signed in: API routes answer 200 with JSON", async () => {
  const res = await get("/api/users/me/notifications", GOOD_COOKIE);
  expect(res.status).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("signed in: ?user_id= cannot switch to another user", async () => {
  const res = await get("/inbox?user_id=user_3", GOOD_COOKIE);
  const html = await res.text();
  expect(html).toContain(`Signed in as ${FAKE_USER.id}`);
  expect(html).not.toContain("user_3");
});

// ---------- Not signed in ----------

test("no cookie: API route answers 401 JSON, without bothering Module 1", async () => {
  const res = await get("/api/users/me/notifications");
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ error: "Not signed in." });
  expect(calls).toBe(0);
});

test("no cookie: page answers 401 with a sign-in link", async () => {
  const res = await get("/inbox");
  expect(res.status).toBe(401);
  expect(await res.text()).toContain("/01-identity-users/docs");
});

test("no cookie: ?user_id= alone no longer signs anyone in", async () => {
  const res = await get("/api/users/me/notifications?user_id=user_3");
  expect(res.status).toBe(401);
});

test("Module 1 rejects the cookie (expired, signed out, deactivated): 401", async () => {
  const res = await get(
    "/api/users/me/notifications",
    "better-auth.session_token=fake",
  );
  expect(calls).toBe(1); // we did ask Module 1...
  expect(res.status).toBe(401); // ...and believed its answer
});

test("Module 1 is down: 401, not a crash", async () => {
  // Start and stop a server to get a port where nothing is listening
  const closed = Bun.serve({ port: 0, fetch: () => new Response() });
  const deadUrl = `http://localhost:${closed.port}/01-identity-users`;
  closed.stop(true);

  process.env.IDENTITY_URL = deadUrl;
  try {
    const res = await get("/api/users/me/notifications", GOOD_COOKIE);
    expect(res.status).toBe(401);
  } finally {
    process.env.IDENTITY_URL = fakeIdentityUrl;
  }
});

// ---------- Public routes ----------

test("the events API other modules call still works without a login", async () => {
  const res = await mod.router.handle(
    new Request("http://localhost/api/notifications/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "quiz",
        course_id: "course-auth-test",
        user_ids: ["someone"],
        content: { subject: "Quiz posted", message: "Due Friday." },
      }),
    }),
  );
  expect(res.status).toBe(204);
  expect(calls).toBe(0); // public route: Module 1 is never asked
});
