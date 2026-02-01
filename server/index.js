import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const SAMPLE_RATE = 22050;
const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;

const buildHannWindow = (size) => {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
};

const hannWindow = buildHannWindow(FRAME_SIZE);

const fftMag = (input) => {
  const n = input.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);

  for (let i = 0; i < n; i += 1) {
    re[i] = input[i];
    im[i] = 0;
  }

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wLenRe = Math.cos(ang);
    const wLenIm = Math.sin(ang);

    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j += 1) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;

        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;
        im[i + j + len / 2] = uIm - vIm;

        const nextWRe = wRe * wLenRe - wIm * wLenIm;
        const nextWIm = wRe * wLenIm + wIm * wLenRe;
        wRe = nextWRe;
        wIm = nextWIm;
      }
    }
  }

  const mags = new Float32Array(n / 2);
  for (let i = 0; i < mags.length; i += 1) {
    mags[i] = Math.hypot(re[i], im[i]);
  }
  return mags;
};

const decodeToPcm = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('FFmpeg introuvable'));
      return;
    }

    const args = [
      '-i', 'pipe:0',
      '-f', 's16le',
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      'pipe:1',
    ];

    const ffmpeg = spawn(ffmpegPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks = [];
    const errors = [];

    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => errors.push(chunk));

    ffmpeg.on('error', (err) => reject(err));

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        const message = Buffer.concat(errors).toString('utf-8') || 'FFmpeg error';
        reject(new Error(message));
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    ffmpeg.stdin.write(buffer);
    ffmpeg.stdin.end();
  });
};

const analyzePcm = (pcmBuffer) => {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const intSample = pcmBuffer.readInt16LE(i * 2);
    samples[i] = intSample / 32768;
  }

  const frameCount = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1;
  const frames = [];
  const rawBands = [];
  let maxBass = 0;
  let maxMid = 0;
  let maxHigh = 0;
  let maxRms = 0;

  const binHz = SAMPLE_RATE / FRAME_SIZE;
  const bassStart = Math.max(1, Math.floor(20 / binHz));
  const bassEnd = Math.min(Math.floor(250 / binHz), FRAME_SIZE / 2);
  const midEnd = Math.min(Math.floor(4000 / binHz), FRAME_SIZE / 2);
  const highEnd = Math.min(Math.floor(20000 / binHz), FRAME_SIZE / 2);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const offset = frame * HOP_SIZE;
    const segment = new Array(FRAME_SIZE);
    let rmsSum = 0;

    for (let i = 0; i < FRAME_SIZE; i += 1) {
      const sample = samples[offset + i] || 0;
      const windowed = sample * hannWindow[i];
      segment[i] = windowed;
      rmsSum += sample * sample;
    }

    const mags = fftMag(segment);

    let bass = 0;
    let mid = 0;
    let high = 0;

    for (let i = bassStart; i < bassEnd; i += 1) {
      bass += mags[i];
    }
    for (let i = bassEnd; i < midEnd; i += 1) {
      mid += mags[i];
    }
    for (let i = midEnd; i < highEnd; i += 1) {
      high += mags[i];
    }

    const rms = Math.sqrt(rmsSum / FRAME_SIZE);

    maxBass = Math.max(maxBass, bass);
    maxMid = Math.max(maxMid, mid);
    maxHigh = Math.max(maxHigh, high);
    maxRms = Math.max(maxRms, rms);

    rawBands.push({ bass, mid, high, rms });
  }

  rawBands.forEach((frameData, index) => {
    frames.push({
      t: (index * HOP_SIZE) / SAMPLE_RATE,
      bass: maxBass ? frameData.bass / maxBass : 0,
      mid: maxMid ? frameData.mid / maxMid : 0,
      high: maxHigh ? frameData.high / maxHigh : 0,
      rms: maxRms ? frameData.rms / maxRms : 0,
    });
  });

  return {
    sampleRate: SAMPLE_RATE,
    frameSize: FRAME_SIZE,
    hopSize: HOP_SIZE,
    frameRate: SAMPLE_RATE / HOP_SIZE,
    duration: samples.length / SAMPLE_RATE,
    frames,
  };
};

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).send('Aucun fichier recu');
      return;
    }

    const pcmBuffer = await decodeToPcm(req.file.buffer);
    const analysis = analyzePcm(pcmBuffer);

    res.json(analysis);
  } catch (error) {
    console.error('[Analyzer] Failed:', error);
    res.status(500).send('Analyse impossible');
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (existsSync(distPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`[Analyzer] Listening on ${port}`);
});
