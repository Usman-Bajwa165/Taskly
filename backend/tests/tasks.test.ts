// // tests/tasks.test.ts
// import { api } from "./utils";

// describe("Tasks routes (protected)", () => {
//   const userA = { email: "a@tasks.com", password: "passA123", name: "A" };
//   const userB = { email: "b@tasks.com", password: "passB123", name: "B" };

//   const createUserAndGetToken = async (u: any) => {
//     await api().post("/api/auth/register").send(u);
//     const login = await api().post("/api/auth/login").send({ email: u.email, password: u.password });
//     return login.body.token as string;
//   };

//   it("POST /api/tasks creates a task when authenticated", async () => {
//     const token = await createUserAndGetToken(userA);
//     const res = await api()
//       .post("/api/tasks")
//       .set("Authorization", `Bearer ${token}`)
//       .send({ title: "Task 1", description: "desc" })
//       .expect(201);
//     expect(res.body).toHaveProperty("_id");
//     expect(res.body.title).toBe("Task 1");
//   });

//   it("rejects missing JWT with 401", async () => {
//     await api().post("/api/tasks").send({ title: "NoAuth" }).expect(401);
//   });

//   it("GET /api/tasks lists only logged-in user's tasks", async () => {
//     const tokenA = await createUserAndGetToken(userA);
//     const tokenB = await createUserAndGetToken(userB);

//     // create one task for A
//     await api().post("/api/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "A1" });

//     // create two tasks for B
//     await api().post("/api/tasks").set("Authorization", `Bearer ${tokenB}`).send({ title: "B1" });
//     await api().post("/api/tasks").set("Authorization", `Bearer ${tokenB}`).send({ title: "B2" });

//     const resA = await api().get("/api/tasks").set("Authorization", `Bearer ${tokenA}`).expect(200);
//     const resB = await api().get("/api/tasks").set("Authorization", `Bearer ${tokenB}`).expect(200);

//     expect(Array.isArray(resA.body.tasks)).toBe(true);
//     expect(Array.isArray(resB.body.tasks)).toBe(true);
//     expect(resA.body.tasks.length).toBe(1);
//     expect(resB.body.tasks.length).toBe(2);
//   });

//   it("PUT /api/tasks/:id updates owned task", async () => {
//     const token = await createUserAndGetToken(userA);
//     const create = await api().post("/api/tasks").set("Authorization", `Bearer ${token}`).send({ title: "ToUpdate" });
//     const id = create.body._id;
//     const updated = await api()
//       .put(`/api/tasks/${id}`)
//       .set("Authorization", `Bearer ${token}`)
//       .send({ title: "Updated" })
//       .expect(200);
//     expect(updated.body.title).toBe("Updated");
//   });

//   it("prevents editing someone else's task (403)", async () => {
//     const tokenA = await createUserAndGetToken(userA);
//     const tokenB = await createUserAndGetToken(userB);
//     const create = await api().post("/api/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "Private" });
//     const id = create.body._id;
//     await api().put(`/api/tasks/${id}`).set("Authorization", `Bearer ${tokenB}`).send({ title: "Hack" }).expect(403);
//   });

//   it("DELETE /api/tasks/:id deletes owned task", async () => {
//     const token = await createUserAndGetToken(userA);
//     const create = await api().post("/api/tasks").set("Authorization", `Bearer ${token}`).send({ title: "ToDelete" });
//     const id = create.body._id;
//     await api().delete(`/api/tasks/${id}`).set("Authorization", `Bearer ${token}`).expect(200);
//     await api().get(`/api/tasks/${id}`).set("Authorization", `Bearer ${token}`).expect(404);
//   });
// });
