import { beforeAll, expect, test } from "bun:test";
import { useFakeUserForTests } from "./auth";
import mod from "./index";

// these tests pick the user with the ?user_id= instead of signing in through module 1
beforeAll(useFakeUserForTests);

const get = (path: string) =>
  mod.router.handle(new Request(`http://localhost${path}`));

test("front page answers with HTML", async () => {
  const res = await get("/");
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("Notifications");
});

test("inbox page loads", async () => {
  const res = await get("/inbox");
  expect(res.status).toBe(200);
});

test("messages page loads", async () => {
  const res = await get("/messages");
  expect(res.status).toBe(200);
});

test("docs page loads", async () => {
  const res = await mod.router.handle(new Request("http://localhost/docs"));
  expect(res.status).toBe(200);
});

test("openapi.yaml is served as YAML", async () => {
  const res = await mod.router.handle(
    new Request("http://localhost/openapi.yaml"),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("application/yaml");
  expect(await res.text()).toContain("openapi: 3.0.3");
});
