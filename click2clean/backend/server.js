const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// static front-end
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// In-memory DB
let reports = []; // {reportId,citizenId,description,lat,long,photoPath,status,cleanedPhotoPath,timestamp}
let scores = {};  // {citizenId: points}

// API endpoints
app.post('/api/report', upload.single('photo'), (req, res) => {
  const { citizenId, description, latitude, longitude } = req.body;
  const reportId = Date.now().toString();
  const timestamp = new Date().toISOString();
  const photoPath = '/uploads/' + req.file.filename;

  const report = {
    reportId, citizenId, description, latitude, longitude,
    photoPath, status: 'Pending', cleanedPhotoPath: null, timestamp
  };
  reports.push(report);
  res.json(report);
});

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.post('/api/mark-cleaned/:reportId', upload.single('cleanedPhoto'), (req, res) => {
  const { reportId } = req.params;
  const report = reports.find(r => r.reportId === reportId);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  const cleanedPhotoPath = '/uploads/' + req.file.filename;
  report.status = 'Cleaned';
  report.cleanedPhotoPath = cleanedPhotoPath;
  report.cleanedTimestamp = new Date().toISOString();

  // award points
  if (!scores[report.citizenId]) scores[report.citizenId] = 0;
  scores[report.citizenId] += 10;

  res.json(report);
});

app.get('/api/score/:citizenId', (req, res) => {
  const score = scores[req.params.citizenId] || 0;
  res.json({ citizenId: req.params.citizenId, score });
});

app.get('/api/leaderboard', (req, res) => {
  const lb = Object.entries(scores)
    .map(([citizenId, score]) => ({ citizenId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(lb);
});

// start
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
