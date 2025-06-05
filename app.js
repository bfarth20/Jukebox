import express from "express";
import tracksRouter from "./routes/tracks.js";
import playlistsRouter from "./routes/playlists.js";

const app = express();
app.use(express.json());

app.use("/tracks", tracksRouter);
app.use("/playlists", playlistsRouter);

export default app;
