const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = 'content.json';
const LEGACY_FILE = 'content.txt';
const ENVIRONMENTS = ['prod', 'staging', 'training', 'dev'];

app.use(express.json());
app.use(express.static('.'));

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const data = {};
    for (const env of ENVIRONMENTS) {
      data[env] = typeof parsed[env] === 'string' ? parsed[env] : '';
    }
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const data = Object.fromEntries(ENVIRONMENTS.map((e) => [e, '']));
      try {
        const legacy = await fs.readFile(LEGACY_FILE, 'utf8');
        data.prod = legacy;
      } catch (legacyErr) {
        if (legacyErr.code !== 'ENOENT') throw legacyErr;
      }
      return data;
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/content', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/api/content/:env', async (req, res) => {
  const { env } = req.params;
  if (!ENVIRONMENTS.includes(env)) {
    return res.status(400).json({ error: 'Unknown environment' });
  }
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    const data = await readData();
    data[env] = content;
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Writing app running at http://localhost:${PORT}`);
});
