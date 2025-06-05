import "dotenv/config";
import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  const tracks = Array.from({ length: 20 }, (_, i) => ({
    name: `Track ${i + 1}`,
    duration_ms: 180000 + i * 5000,
  }));

  const playlists = Array.from({ length: 10 }, (_, i) => ({
    name: `Playlist ${i + 1}`,
    description: `Vibes for playlist ${i + 1}`,
  }));

  const playlistTracks = [
    { playlistIndex: 0, trackIndex: 0 },
    { playlistIndex: 0, trackIndex: 1 },
    { playlistIndex: 1, trackIndex: 2 },
    { playlistIndex: 1, trackIndex: 3 },
    { playlistIndex: 2, trackIndex: 4 },
    { playlistIndex: 2, trackIndex: 5 },
    { playlistIndex: 3, trackIndex: 6 },
    { playlistIndex: 4, trackIndex: 7 },
    { playlistIndex: 5, trackIndex: 8 },
    { playlistIndex: 6, trackIndex: 9 },
    { playlistIndex: 7, trackIndex: 10 },
    { playlistIndex: 8, trackIndex: 11 },
    { playlistIndex: 9, trackIndex: 12 },
    { playlistIndex: 0, trackIndex: 13 },
    { playlistIndex: 1, trackIndex: 14 },
    { playlistIndex: 2, trackIndex: 15 },
  ];

  // Clean up functions
  await db.query(`DELETE FROM playlists_tracks`);
  await db.query(`DELETE FROM playlists`);
  await db.query(`DELETE FROM tracks`);

  //Insertions tracks
  const trackResults = [];
  for (const track of tracks) {
    const result = await db.query(
      `INSERT INTO tracks (name, duration_ms) VALUES ($1, $2) RETURNING *`,
      [track.name, track.duration_ms]
    );
    trackResults.push(result.rows[0]);
  }

  //Playlists insertion
  const playlistResults = [];
  for (const playlist of playlists) {
    const result = await db.query(
      `INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *`,
      [playlist.name, playlist.description]
    );
    playlistResults.push(result.rows[0]);
  }

  // playlist-track associations
  for (const pt of playlistTracks) {
    const playlist_id = playlistResults[pt.playlistIndex].id;
    const track_id = trackResults[pt.trackIndex].id;
    await db.query(
      `INSERT INTO playlists_tracks (playlist_id, track_id) VALUES($1, $2)`,
      [playlist_id, track_id]
    );
  }
}
