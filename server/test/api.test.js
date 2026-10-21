import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { sequelize } from "../src/models/index.js";
import { createDilemma } from "../src/services/dilemmas.js";
import { classifyPick } from "../src/services/results.js";

let approvedDilemma;
let pendingDilemma;

beforeEach(async () => {
  // Start every test with empty tables.
  await sequelize.sync({ force: true });
  approvedDilemma = await createDilemma("Tea or coffee?", ["Tea", "Coffee"], "approved");
  pendingDilemma = await createDilemma("Cats or dogs?", ["Cats", "Dogs"], "pending");
});

// A supertest agent keeps cookies between requests, like one browser.
function newPlayer() {
  return request.agent(app);
}

async function loginAsAdmin() {
  const admin = request.agent(app);
  await admin.post("/api/admin/login").send({ password: "test-admin-password" }).expect(200);
  return admin;
}

describe("GET /api/dilemmas", () => {
  test("returns only approved dilemmas and gives the player a cookie", async () => {
    const response = await newPlayer().get("/api/dilemmas").expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].text).toBe("Tea or coffee?");
    expect(response.body[0].pickedOptionId).toBeNull();
    expect(response.headers["set-cookie"][0]).toMatch(/^playerId=.*HttpOnly/);
  });
});

describe("POST /api/dilemmas/:id/votes", () => {
  test("saves the vote and returns the results", async () => {
    const [tea] = approvedDilemma.Options;
    const response = await newPlayer()
      .post(`/api/dilemmas/${approvedDilemma.id}/votes`)
      .send({ optionId: tea.id })
      .expect(200);

    expect(response.body.pickedOptionId).toBe(tea.id);
    expect(response.body.totalVotes).toBe(1);
    expect(response.body.options[0]).toEqual({ id: tea.id, votes: 1, percent: 100 });
    // One vote is not enough to sort the pick.
    expect(response.body.category).toBe("notEnoughData");
  });

  test("rejects a vote on a dilemma that is not approved", async () => {
    const [cats] = pendingDilemma.Options;
    await newPlayer()
      .post(`/api/dilemmas/${pendingDilemma.id}/votes`)
      .send({ optionId: cats.id })
      .expect(404);
  });

  test("keeps the first vote when the player votes again", async () => {
    const player = newPlayer();
    const [tea, coffee] = approvedDilemma.Options;
    await player.post(`/api/dilemmas/${approvedDilemma.id}/votes`).send({ optionId: tea.id });

    const response = await player
      .post(`/api/dilemmas/${approvedDilemma.id}/votes`)
      .send({ optionId: coffee.id })
      .expect(200);

    expect(response.body.pickedOptionId).toBe(tea.id);
    expect(response.body.totalVotes).toBe(1);
  });

  test("counts votes from different players", async () => {
    const [tea, coffee] = approvedDilemma.Options;
    await newPlayer().post(`/api/dilemmas/${approvedDilemma.id}/votes`).send({ optionId: tea.id });
    const response = await newPlayer()
      .post(`/api/dilemmas/${approvedDilemma.id}/votes`)
      .send({ optionId: coffee.id });

    expect(response.body.totalVotes).toBe(2);
    expect(response.body.options.map((option) => option.percent)).toEqual([50, 50]);
  });

  test("rejects an option from another dilemma", async () => {
    const [cats] = pendingDilemma.Options;
    await newPlayer()
      .post(`/api/dilemmas/${approvedDilemma.id}/votes`)
      .send({ optionId: cats.id })
      .expect(404);
  });

  test("rejects a vote without an option", async () => {
    await newPlayer().post(`/api/dilemmas/${approvedDilemma.id}/votes`).send({}).expect(400);
  });
});

describe("POST /api/submissions", () => {
  test("saves a valid submission as pending", async () => {
    const response = await newPlayer()
      .post("/api/submissions")
      .send({ text: "Beach or mountains?", options: ["Beach", "Mountains"] })
      .expect(201);

    const list = await newPlayer().get("/api/dilemmas");
    expect(list.body.map((dilemma) => dilemma.id)).not.toContain(response.body.id);
  });

  test("rejects a submission with three options", async () => {
    await newPlayer()
      .post("/api/submissions")
      .send({ text: "Pick one", options: ["A", "B", "C"] })
      .expect(400);
  });

  test("rejects a submission with empty text", async () => {
    await newPlayer()
      .post("/api/submissions")
      .send({ text: "   ", options: ["A", "B"] })
      .expect(400);
  });
});

describe("admin", () => {
  test("blocks the review list without login", async () => {
    await request(app).get("/api/admin/submissions").expect(401);
  });

  test("rejects a wrong password", async () => {
    await request(app).post("/api/admin/login").send({ password: "wrong" }).expect(401);
  });

  test("rejects a forged admin cookie", async () => {
    await request(app)
      .get("/api/admin/submissions")
      .set("Cookie", "adminToken=not-a-real-token")
      .expect(401);
  });

  test("approving a submission puts it in the game", async () => {
    const admin = await loginAsAdmin();
    const pending = await admin.get("/api/admin/submissions").expect(200);
    expect(pending.body.map((dilemma) => dilemma.id)).toEqual([pendingDilemma.id]);

    await admin
      .patch(`/api/admin/submissions/${pendingDilemma.id}`)
      .send({ status: "approved" })
      .expect(200);

    const list = await newPlayer().get("/api/dilemmas");
    expect(list.body).toHaveLength(2);
  });

  test("rejects an unknown status", async () => {
    const admin = await loginAsAdmin();
    await admin
      .patch(`/api/admin/submissions/${pendingDilemma.id}`)
      .send({ status: "deleted" })
      .expect(400);
  });

  test("returns 404 for a dilemma that does not exist", async () => {
    const admin = await loginAsAdmin();
    await admin.patch("/api/admin/submissions/9999").send({ status: "approved" }).expect(404);
  });

  test("the session shows if the browser is logged in as admin", async () => {
    const guest = await request(app).get("/api/admin/session").expect(200);
    expect(guest.body).toEqual({ isAdmin: false });

    const admin = await loginAsAdmin();
    const session = await admin.get("/api/admin/session").expect(200);
    expect(session.body).toEqual({ isAdmin: true });
  });

  test("logout ends the admin session", async () => {
    const admin = await loginAsAdmin();
    await admin.post("/api/admin/logout").expect(200);

    const session = await admin.get("/api/admin/session");
    expect(session.body).toEqual({ isAdmin: false });
    await admin.get("/api/admin/submissions").expect(401);
  });
});

describe("GET /api/players/me/summary", () => {
  test("lists the player's picks", async () => {
    const player = newPlayer();
    const [tea] = approvedDilemma.Options;
    await player.post(`/api/dilemmas/${approvedDilemma.id}/votes`).send({ optionId: tea.id });

    const response = await player.get("/api/players/me/summary").expect(200);

    expect(response.body.answered).toBe(1);
    expect(response.body.totalDilemmas).toBe(1);
    expect(response.body.picks[0]).toMatchObject({ pickedText: "Tea", agreePercent: 100 });
    // One vote is not enough to say anything yet.
    expect(response.body.counts.notEnoughData).toBe(1);
  });
});

describe("classifyPick", () => {
  test("sorts picks by how many players agreed", () => {
    expect(classifyPick(100, 4)).toBe("notEnoughData");
    expect(classifyPick(75, 10)).toBe("mainstream");
    expect(classifyPick(60, 10)).toBe("mainstream");
    expect(classifyPick(50, 10)).toBe("closeCall");
    expect(classifyPick(40, 10)).toBe("hotTake");
    expect(classifyPick(10, 10)).toBe("hotTake");
  });
});

test("unknown API paths return JSON 404", async () => {
  const response = await request(app).get("/api/nope").expect(404);
  expect(response.body.error).toBeTruthy();
});

// Keep these tests last. The limits count requests across the whole file, so they would block
// the tests after them.
describe("rate limits", () => {
  test("blocks admin login after 5 failed attempts, even with the right password", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app).post("/api/admin/login").send({ password: "wrong" });
    }

    const response = await request(app)
      .post("/api/admin/login")
      .send({ password: "test-admin-password" })
      .expect(429);
    expect(response.body.error).toMatch(/Too many failed logins/);
  });

  test("blocks a player after 10 submissions in an hour", async () => {
    const submission = { text: "Sun or rain?", options: ["Sun", "Rain"] };
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app).post("/api/submissions").send(submission);
    }

    const response = await request(app).post("/api/submissions").send(submission).expect(429);
    expect(response.body.error).toBeTruthy();
  });
});
