const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = 'content.txt';

app.use(express.json());
app.use(express.static('.'));

app.get('/api/content', async (req, res) => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    res.json({ content });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ content: '' });
    } else {
      res.status(500).json({ error: 'Failed to read file' });
    }
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const { content } = req.body;
    await fs.writeFile(DATA_FILE, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Writing app running at http://localhost:${PORT}`);
});