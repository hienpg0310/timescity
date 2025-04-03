import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";

const videoStreamRoute = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANNELS = [
  {
    id: "101",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/101",
  },
  {
    id: "201",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/201",
  },
  {
    id: "301",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/301",
  },
  {
    id: "401",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/401",
  },
  {
    id: "501",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/501",
  },
  {
    id: "601",
    url: "rtsp://admin:Camera24h@b07timecity.cameraddns.net:554/Streaming/Channels/601",
  },
];

// HLS Base Directory
const HLS_BASE_DIR = path.join(__dirname, "../../hls");
if (!fs.existsSync(HLS_BASE_DIR))
  fs.mkdirSync(HLS_BASE_DIR, { recursive: true });

// Function to delete HLS directory when restart
const deleteHLSFolder = () => {
  if (fs.existsSync(HLS_BASE_DIR)) {
    console.log("Removing old HLS folder...");
    fs.rmSync(HLS_BASE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(HLS_BASE_DIR, { recursive: true });
};

// Function to start FFmpeg for each channel
const startFFmpeg = (channel) => {
  const channelDir = path.join(HLS_BASE_DIR, channel.id);
  if (!fs.existsSync(channelDir)) fs.mkdirSync(channelDir, { recursive: true });

  // console.log(`Starting FFmpeg for channel ${channel.id}`);

  // const ffmpegProcess = spawn("ffmpeg", [
  //   "-rtsp_transport",
  //   "tcp",
  //   "-i",
  //   channel.url,
  //   "-c:v",
  //   "libx264",
  //   "-preset",
  //   "ultrafast",
  //   "-tune",
  //   "zerolatency",
  //   "-c:a",
  //   "aac",
  //   "-f",
  //   "hls",
  //   "-hls_time",
  //   "2",
  //   "-hls_list_size",
  //   "5",
  //   "-hls_flags",
  //   "delete_segments",
  //   path.join(channelDir, "stream.m3u8"),
  // ]);

  const ffmpegProcess = spawn("ffmpeg", [
    "-rtsp_transport",
    "tcp",
    "-i",
    channel.url,
    "-fflags",
    "nobuffer",
    "-flags",
    "+global_header",
    "-rtbufsize",
    "64M",
    "-vf",
    "scale=640:360",
    "-r",
    "15",
    "-b:v",
    "500k",
    "-maxrate",
    "500k",
    "-bufsize",
    "1000k",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "6",
    "-hls_flags",
    "delete_segments",
    path.join(channelDir, "stream.m3u8"),
  ]);

  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`FFmpeg log (${channel.id}):`, data.toString());
  });

  ffmpegProcess.on("exit", (code) => {
    // console.log(`FFmpeg exited for channel ${channel.id} with code ${code}`);
  });
};

// Remove the HLS folder before starting
deleteHLSFolder();

// Start streaming for all channels
CHANNELS.forEach(startFFmpeg);

// videoStreamRoute.use("/", express.static(HLS_BASE_DIR));

// Cấu hình route HLS với header tối ưu
videoStreamRoute.use(
  "/",
  express.static(HLS_BASE_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-store");
      }
      if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/mp2t");
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    },
  })
);

videoStreamRoute.get("/list", (req, res) => {
  res.json(
    CHANNELS.map((ch) => ({ id: ch.id, stream: `/hls/${ch.id}/stream.m3u8` }))
  );
});

export default videoStreamRoute;
