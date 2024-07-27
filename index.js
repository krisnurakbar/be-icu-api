const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage for tasks
const tasks = [];

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const { task_id, status_name } = req.body;

  if (!task_id || !status_name) {
    return res.status(400).send('task_id and status_name are required');
  }

  tasks.push({ task_id, status_name });
  res.status(200).send('Task received');
});

// Endpoint to get tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
