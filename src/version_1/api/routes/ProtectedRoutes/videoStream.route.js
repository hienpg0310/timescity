import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";

const videoStreamRoute = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ffmpegProcesses = {};

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

   if (ffmpegProcesses[channel.id]) {
     console.log(`FFmpeg is already running for channel ${channel.id}`);
     return;
   }

  const channelDir = path.join(HLS_BASE_DIR, channel.id);
  if (!fs.existsSync(channelDir)) fs.mkdirSync(channelDir, { recursive: true });

  console.log(`Starting FFmpeg for channel ${channel.id}`);

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
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-b:v",
    "500k", // Giảm bitrate
    "-r",
    "15", // Giảm FPS
    "-vf",
    "scale=640:360", // Giảm độ phân giải
    "-c:a",
    "aac",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "3",
    "-hls_flags",
    "delete_segments",
    path.join(channelDir, "stream.m3u8"),
  ]);

  ffmpegProcesses[channel.id] = ffmpegProcess;

  process.on("error", (err) => {
    console.error("FFmpeg Error:", err);
  });

  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`FFmpeg log (${channel.id}):`, data.toString());
  });

  // ffmpegProcess.on("exit", (code) => {
  //   console.log(`FFmpeg exited for channel ${channel.id} with code ${code}`);
  // });

  ffmpegProcess.on("exit", (code) => {
    console.log(`FFmpeg exited for channel ${channel.id} with code ${code}`);
    delete ffmpegProcesses[channel.id]; // Xóa khỏi danh sách nếu FFmpeg tắt
  });
};

deleteHLSFolder();

// 🔹 **Chạy tất cả camera ngay khi server khởi động**
CHANNELS.forEach(startFFmpeg);

// API để lấy danh sách stream
videoStreamRoute.get("/list", (req, res) => {
  res.json(
    CHANNELS.map((ch) => ({
      id: ch.id,
      stream: `/stream/${ch.id}/stream.m3u8`,
    }))
  );
});

// Phục vụ file HLS
videoStreamRoute.use("/stream", express.static(HLS_BASE_DIR));

export default videoStreamRoute;
