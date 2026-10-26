import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { sequelize, Vote } from "../src/models/index.js";
import { createDilemma } from "../src/services/dilemmas.js";
import { classifyPick } from "../src/services/results.js";

let firstDilemma;
let secondDilemma;

// A valid body for POST /api/admin/dilemmas.
const newDilemma = {
  text: "A trolley is heading toward three people. Pull the lever and it hits two.",
  doNothing: { trackLabel: " 3 people ", peopleOnTrack: 3 },
  pullTheLever: { trackLabel: "2 people", peopleOnTrack: 2 },
};

beforeEach(async () => {
  // Start every test with empty tables.
  await sequelize.sync({ force: true });
  firstDilemma = await createDilemma(
    "Five or one?",
    { trackLabel: "5 people", peopleOnTrack: 5 },
    { trackLabel: "1 person", peopleOnTrack: 1 },
  );
  secondDilemma = await createDilemma(
    "Two or one?",
    { trackLabel: "2 people", peopleOnTrack: 2 },
    { trackLabel: "1 person", peopleOnTrack: 1 },
  );
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
  test("returns every dilemma with its tracks and gives the player a cookie", async () => {
    const response = await newPlayer().get("/api/dilemmas").expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].text).toBe("Five or one?");
    expect(response.body[0].pickedOptionId).toBeNull();
    expect(response.body[0].options).toMatchObject([
      { text: "Do nothing", trackLabel: "5 people", peopleOnTrack: 5 },
      { text: "Pull the lever", trackLabel: "1 person", peopleOnTrack: 1 },
    ]);
    expect(response.headers["set-cookie"][0]).toMatch(/^playerId=.*HttpOnly/);
  });
});

describe("POST /api/dilemmas/:id/votes", () => {
  test("saves the vote and returns the results", async () => {
    const [doNothing] = firstDilemma.Options;
    const response = await newPlayer()
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: doNothing.id })
      .expect(200);

    expect(response.body.pickedOptionId).toBe(doNothing.id);
    expect(response.body.totalVotes).toBe(1);
    expect(response.body.options[0]).toEqual({ id: doNothing.id, votes: 1, percent: 100 });
    // One vote is not enough to sort the pick.
    expect(response.body.category).toBe("notEnoughData");
  });

  test("keeps the first vote when the player votes again", async () => {
    const player = newPlayer();
    const [doNothing, pullTheLever] = firstDilemma.Options;
    await player.post(`/api/dilemmas/${firstDilemma.id}/votes`).send({ optionId: doNothing.id });

    const response = await player
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: pullTheLever.id })
      .expect(200);

    expect(response.body.pickedOptionId).toBe(doNothing.id);
    expect(response.body.totalVotes).toBe(1);
  });

  test("counts votes from different players", async () => {
    const [doNothing, pullTheLever] = firstDilemma.Options;
    await newPlayer()
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: doNothing.id });
    const response = await newPlayer()
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: pullTheLever.id });

    expect(response.body.totalVotes).toBe(2);
    expect(response.body.options.map((option) => option.percent)).toEqual([50, 50]);
  });

  test("rejects an option from another dilemma", async () => {
    const [otherOption] = secondDilemma.Options;
    await newPlayer()
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: otherOption.id })
      .expect(404);
  });

  test("rejects a vote without an option", async () => {
    await newPlayer().post(`/api/dilemmas/${firstDilemma.id}/votes`).send({}).expect(400);
  });
});

describe("POST /api/suggestions", () => {
  test("saves a suggestion that only the admin sees", async () => {
    await newPlayer()
      .post("/api/suggestions")
      .send({ text: "  A trolley is heading toward my cat.  " })
      .expect(201);

    const admin = await loginAsAdmin();
    const suggestions = await admin.get("/api/admin/suggestions").expect(200);
    expect(suggestions.body.map((suggestion) => suggestion.text)).toEqual([
      "A trolley is heading toward my cat.",
    ]);
  });

  test("rejects an empty suggestion", async () => {
    await newPlayer().post("/api/suggestions").send({ text: "   " }).expect(400);
  });

  test("rejects a suggestion that is too long", async () => {
    await newPlayer()
      .post("/api/suggestions")
      .send({ text: "x".repeat(301) })
      .expect(400);
  });
});

describe("admin", () => {
  test("blocks the admin endpoints without login", async () => {
    await request(app).get("/api/admin/suggestions").expect(401);
    await request(app).post("/api/admin/dilemmas").send(newDilemma).expect(401);
    await request(app).delete(`/api/admin/dilemmas/${firstDilemma.id}`).expect(401);
  });

  test("rejects a wrong password", async () => {
    await request(app).post("/api/admin/login").send({ password: "wrong" }).expect(401);
  });

  test("rejects a forged admin cookie", async () => {
    await request(app)
      .get("/api/admin/suggestions")
      .set("Cookie", "adminToken=not-a-real-token")
      .expect(401);
  });

  test("adding a dilemma puts it in the game with the two fixed answers", async () => {
    const admin = await loginAsAdmin();
    await admin.post("/api/admin/dilemmas").send(newDilemma).expect(201);

    const list = await newPlayer().get("/api/dilemmas");
    expect(list.body).toHaveLength(3);
    expect(list.body[2].options).toMatchObject([
      { text: "Do nothing", trackLabel: "3 people", peopleOnTrack: 3 },
      { text: "Pull the lever", trackLabel: "2 people", peopleOnTrack: 2 },
    ]);
  });

  test("rejects a track without people", async () => {
    const admin = await loginAsAdmin();
    await admin
      .post("/api/admin/dilemmas")
      .send({ ...newDilemma, doNothing: { trackLabel: "Nobody", peopleOnTrack: 0 } })
      .expect(400);
  });

  test("rejects more than 5 people on a track", async () => {
    const admin = await loginAsAdmin();
    await admin
      .post("/api/admin/dilemmas")
      .send({ ...newDilemma, pullTheLever: { trackLabel: "6 people", peopleOnTrack: 6 } })
      .expect(400);
  });

  test("rejects a track label that is too long", async () => {
    const admin = await loginAsAdmin();
    await admin
      .post("/api/admin/dilemmas")
      .send({ ...newDilemma, doNothing: { trackLabel: "x".repeat(31), peopleOnTrack: 1 } })
      .expect(400);
  });

  test("deleting a dilemma removes it and its votes", async () => {
    const [doNothing] = firstDilemma.Options;
    await newPlayer()
      .post(`/api/dilemmas/${firstDilemma.id}/votes`)
      .send({ optionId: doNothing.id });

    const admin = await loginAsAdmin();
    await admin.delete(`/api/admin/dilemmas/${firstDilemma.id}`).expect(204);

    const list = await newPlayer().get("/api/dilemmas");
    expect(list.body.map((dilemma) => dilemma.id)).toEqual([secondDilemma.id]);
    expect(await Vote.count()).toBe(0);
  });

  test("deleting a suggestion removes it from the list", async () => {
    const sent = await newPlayer().post("/api/suggestions").send({ text: "An idea" });

    const admin = await loginAsAdmin();
    await admin.delete(`/api/admin/suggestions/${sent.body.id}`).expect(204);

    const suggestions = await admin.get("/api/admin/suggestions");
    expect(suggestions.body).toEqual([]);
  });

  test("returns 404 when the thing to delete does not exist", async () => {
    const admin = await loginAsAdmin();
    await admin.delete("/api/admin/dilemmas/9999").expect(404);
    await admin.delete("/api/admin/suggestions/9999").expect(404);
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
    await admin.get("/api/admin/suggestions").expect(401);
  });
});

describe("GET /api/players/me/summary", () => {
  test("lists the player's picks", async () => {
    const player = newPlayer();
    const [doNothing] = firstDilemma.Options;
    await player.post(`/api/dilemmas/${firstDilemma.id}/votes`).send({ optionId: doNothing.id });

    const response = await player.get("/api/players/me/summary").expect(200);

    expect(response.body.answered).toBe(1);
    expect(response.body.totalDilemmas).toBe(2);
    expect(response.body.picks[0]).toMatchObject({ pickedText: "Do nothing", agreePercent: 100 });
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

  test("blocks a player after 10 suggestions in an hour", async () => {
    const suggestion = { text: "A trolley is heading toward my homework." };
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app).post("/api/suggestions").send(suggestion);
    }

    const response = await request(app).post("/api/suggestions").send(suggestion).expect(429);
    expect(response.body.error).toBeTruthy();
  });
});
