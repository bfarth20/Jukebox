import express from "express";
import db from "#db/client";

const router = express.Router();

//GET /playlists
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * from playlists");
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting playlists:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /playlists - make a new playlist
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body ?? {};

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required" });
    }

    const result = await db.query(
      "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating playlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//GET /playlists/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const result = await db.query("SELECT * FROM playlists WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getting playlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /playlists/:id/tracks- the tracks of a playlist
router.get("/:id/tracks", async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid playlist ID" });
    }

    //Check if playtlist exists
    const playlistCheck = await db.query(
      "SELECT * FROM playlists WHERE id = $1",
      [id]
    );
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const result = await db.query(
      `
            SELECT t.* FROM tracks t
            JOIN playlists_tracks pt ON pt.track_id = t.id
            WHERE pt.playlist_id = $1
            `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error getting playlist tracks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /playlists/:id/tracks
router.post("/:id/tracks", async (req, res) => {
  try {
    const { id: playlistId } = req.params;

    //missing items check
    if (!req.body || typeof req.body.trackId === "undefined") {
      return res.status(400).json({ error: "trackId is required in body" });
    }

    const { trackId } = req.body;

    if (isNaN(Number(playlistId))) {
      return res.status(400).json({ error: "invalid playlist ID" });
    }

    if (isNaN(Number(trackId))) {
      return res.status(400).json({ error: "invalid track ID" });
    }

    //check if track exists
    const trackCheck = await db.query("SELECT * FROM tracks WHERE id = $1", [
      trackId,
    ]);
    if (trackCheck.rows.length === 0) {
      return res.status(400).json({ error: "Track not found" });
    }

    //check if playlist exists
    const playlistCheck = await db.query(
      "SELECT * FROM playlists WHERE id = $1",
      [playlistId]
    );
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Add to the junction table
    const result = await db.query(
      `INSERT INTO playlists_tracks (playlist_id, track_id)
            VALUES ($1, $2)
            ON CONFLICT (playlist_id, track_id) DO NOTHING
            RETURNING *`,
      [playlistId, trackId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Track already in playlist" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding track to playlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
