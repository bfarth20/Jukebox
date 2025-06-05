import express from "express";
import db from "#db/client";

const router = express.Router();

//GET /tracks all tracks first
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tracks");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tracks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//GET /tracks/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Track ID must be a number" });
  }

  try {
    const result = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Track not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching track:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
