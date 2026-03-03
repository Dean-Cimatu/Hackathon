const express    = require('express');
const OpenAI     = require('openai');
const ffmpeg     = require('fluent-ffmpeg');
const fs         = require('fs');
const { v4: uuidv4 } = require('uuid');
const { toFile } = require('openai/uploads');
const ytdlp      = require('yt-dlp-exec');
const path       = require('path');

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function transcribeAndSummarise(audioPath) {
  const audioFile = await toFile(
    fs.readFileSync(audioPath),
    'audio.mp3',
    { type: 'audio/mpeg' }
  );

  const transcription = await openai.audio.transcriptions.create({
    file:  audioFile,
    model: 'gpt-4o-transcribe',
  });

  const summaryResponse = await openai.responses.create({
    model: 'gpt-5.2',
    input: `Summarise the following transcript into short, concise bullet points (no quotes, 10 words max each):\n\n${transcription.text}`,
  });

  const bullets = summaryResponse.output_text
    .split(/[\n\-•]+/)
    .map(s => s.trim())
    .filter(Boolean);

  return bullets;
}

// ── POST /api/summarise/youtube ───────────────────────────────────────────────
router.post('/youtube', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const videoPath = path.join(UPLOADS_DIR, `${uuidv4()}.mp4`);
  const audioPath = path.join(UPLOADS_DIR, `${uuidv4()}.mp3`);

  try {
    await ytdlp(url, {
      output: videoPath,
      format: 'bestaudio[ext=m4a]+bestvideo[ext=mp4]/best',
    });

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', resolve)
        .on('error', reject);
    });

    const bullets = await transcribeAndSummarise(audioPath);

    res.json({ summary: bullets });
  } catch (err) {
    console.error('YouTube summarise error:', err);
    res.status(500).json({ error: 'Failed to process YouTube video' });
  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

// ── POST /api/summarise/upload ────────────────────────────────────────────────
router.post('/upload', async (req, res) => {
  const uploaded = req.files?.videoFile;
  if (!uploaded) return res.status(400).json({ error: 'No file uploaded' });

  const allowedExt = ['.mp4', '.webm', '.mov', '.mkv'];
  const ext = uploaded.name.substring(uploaded.name.lastIndexOf('.')).toLowerCase();
  if (!allowedExt.includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type. Only video files are allowed.' });
  }

  const videoPath = path.join(UPLOADS_DIR, `${uuidv4()}${ext}`);
  const audioPath = path.join(UPLOADS_DIR, `${uuidv4()}.mp3`);

  try {
    await uploaded.mv(videoPath);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', resolve)
        .on('error', reject);
    });

    const bullets = await transcribeAndSummarise(audioPath);

    res.json({ summary: bullets });
  } catch (err) {
    console.error('Upload summarise error:', err);
    res.status(500).json({ error: 'Failed to process video' });
  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

module.exports = router;
