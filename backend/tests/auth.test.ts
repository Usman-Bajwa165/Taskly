// tests/auth.test.ts
import { api } from "./utils";

describe("Auth routes", () => {
  const email = "test@example.com";
  const password = "password123";

  it("registers a new user (POST /api/auth/register)", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ email, password, name: "Tester" })
      .expect(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(email);
  });

  it("rejects invalid register payload", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ email: "bad", password: "" })
      .expect(400);
    expect(res.body).toHaveProperty("error", "Validation error");
  });

  it("logs in and returns token (POST /api/auth/login)", async () => {
    // register first
    await api().post("/api/auth/register").send({ email: "a@b.com", password, name: "A" });
    const res = await api().post("/api/auth/login").send({ email: "a@b.com", password }).expect(200);
    expect(res.body).toHaveProperty("token");
  });

  it("rejects wrong password", async () => {
    await api().post("/api/auth/register").send({ email: "c@d.com", password, name: "C" });
    const res = await api().post("/api/auth/login").send({ email: "c@d.com", password: "wrong" }).expect(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });
});
