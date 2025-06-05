import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "vitest";

import app from "#app";
import db from "#db/client";

beforeAll(async () => {
  await db.connect();
});
afterAll(async () => {
  await db.end();
});

describe("/tracks router", () => {
  const expectedTrack = expect.objectContaining({
    name: expect.any(String),
    duration_ms: expect.any(Number),
  });

  test("GET /tracks sends array of at least 20 tracks", async () => {
    const response = await request(app).get("/tracks");
    expect(response.status).toBe(200);
    const tracks = response.body;
    expect(tracks.length).toBeGreaterThanOrEqual(20);
    expect(tracks).toEqual(expect.arrayContaining([expectedTrack]));
  });

  describe("GET /tracks/:id", () => {
    it("sends track by id", async () => {
      const response = await request(app).get("/tracks/1");
      expect(response.status).toBe(200);
      const track = response.body;
      expect(track.id).toEqual(1);
      expect(track).toEqual(expectedTrack);
    });

    it("sends 404 if track does not exist", async () => {
      const response = await request(app).get("/tracks/999999");
      expect(response.status).toBe(404);
    });

    it("sends 400 if id is not a number", async () => {
      const response = await request(app).get("/tracks/abc");
      expect(response.status).toBe(400);
    });
  });
});

describe("/playlists router", () => {
  const expectedPlaylist = expect.objectContaining({
    name: expect.any(String),
    description: expect.any(String),
  });

  test("GET /playlists sends array of at least 10 playlists", async () => {
    const response = await request(app).get("/playlists");
    expect(response.status).toBe(200);
    const playlists = response.body;
    expect(playlists.length).toBeGreaterThanOrEqual(10);
    expect(playlists).toEqual(expect.arrayContaining([expectedPlaylist]));
  });

  describe("POST /playlists", () => {
    beforeEach(async () => {
      await db.query("BEGIN");
    });
    afterEach(async () => {
      await db.query("ROLLBACK");
    });

    it("creates a new playlist", async () => {
      const response = await request(app).post("/playlists").send({
        name: "New Playlist",
        description: "New Playlist Description",
      });
      expect(response.status).toBe(201);
      const playlist = response.body;
      expect(playlist).toEqual(expectedPlaylist);
    });

    it("sends 400 if request body is missing", async () => {
      const response = await request(app).post("/playlists");
      expect(response.status).toBe(400);
    });

    it("sends 400 if request body is missing required fields", async () => {
      const response = await request(app).post("/playlists").send({});
      expect(response.status).toBe(400);
    });
  });

  describe("GET /playlists/:id", () => {
    it("sends playlist by id", async () => {
      const response = await request(app).get("/playlists/1");
      expect(response.status).toBe(200);
      const playlist = response.body;
      expect(playlist.id).toEqual(1);
      expect(playlist).toEqual(expectedPlaylist);
    });

    it("sends 404 if playlist does not exist", async () => {
      const response = await request(app).get("/playlists/999999");
      expect(response.status).toBe(404);
    });

    it("sends 400 if id is not a number", async () => {
      const response = await request(app).get("/playlists/abc");
      expect(response.status).toBe(400);
    });
  });

  describe("GET /playlists/:id/tracks", () => {
    it("sends all tracks in the playlist", async () => {
      const response = await request(app).get("/playlists/1/tracks");
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    it("sends 404 if playlist does not exist", async () => {
      const response = await request(app).get("/playlists/999999/tracks");
      expect(response.status).toBe(404);
    });

    it("sends 400 if id is not a number", async () => {
      const response = await request(app).get("/playlists/abc/tracks");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /playlists/:id/tracks", () => {
    beforeEach(async () => {
      await db.query("BEGIN");
    });
    afterEach(async () => {
      await db.query("ROLLBACK");
    });

    it("sends 400 if request body is missing", async () => {
      const response = await request(app).post("/playlists/1/tracks");
      expect(response.status).toBe(400);
    });

    it("sends 400 if request body is missing required fields", async () => {
      const response = await request(app).post("/playlists/1/tracks").send({});
      expect(response.status).toBe(400);
    });

    it("sends 400 if track does not exist", async () => {
      const response = await request(app)
        .post("/playlists/1/tracks")
        .send({ trackId: 999 });
      expect(response.status).toBe(400);
    });

    it("sends 400 if trackId is not a number", async () => {
      const response = await request(app).post("/playlists/1/tracks").send({
        trackId: "abc",
      });
      expect(response.status).toBe(400);
    });

    it("sends 404 if playlist does not exist", async () => {
      const response = await request(app).post("/playlists/999/tracks").send({
        trackId: 1,
      });
      expect(response.status).toBe(404);
    });

    it("sends 400 if playlist id is not a number", async () => {
      const response = await request(app).post("/playlists/abc/tracks").send({
        trackId: 1,
      });
      expect(response.status).toBe(400);
    });

    it("creates a new playlist_track", async () => {
      // Create new playlist to ensure no conflicts
      const playlist = (
        await request(app).post("/playlists").send({
          name: "New Playlist",
          description: "New Playlist Description",
        })
      ).body;

      const response = await request(app)
        .post(`/playlists/${playlist.id}/tracks`)
        .send({
          trackId: 1,
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          playlist_id: playlist.id,
          track_id: 1,
        }),
      );
    });

    it("sends 400 if track is already in playlist", async () => {
      // Create new playlist and add track twice to ensure conflict
      const playlist = (
        await request(app).post("/playlists").send({
          name: "New Playlist",
          description: "New Playlist Description",
        })
      ).body;

      const url = `/playlists/${playlist.id}/tracks`;
      await request(app).post(url).send({ trackId: 1 });
      const response = await request(app).post(url).send({ trackId: 1 });
      expect(response.status).toBe(400);
    });
  });
});
