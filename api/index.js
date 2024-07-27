const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage for tasks
const tasks = [];

// Webhook endpoint with URL parameters
app.post("/api/webhook/:task_id/:status_name", async (req, res) => {
  const { task_id, status_name } = req.params;

  if (!task_id || !status_name) {
    return res.status(400).send("task_id and status_name are required");
  }

  tasks.push({ task_id, status_name });

  // Respond with task_id and status_name
  res.status(200).json({ task_id, status_name });

  // Make an HTTP request to the ClickUp API
  try {
    const response = await axios.post(
      `https://api.clickup.com/api/v2/task/${task_id}/field/3fae2d90-850b-4ad8-b7d7-5846a5ee65a0`,
      {},
      {
        headers: {
          Authorization: "pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM", // Replace with your actual ClickUp API token
          "Content-Type": "application/json",
        },
      },
    );
    console.log("ClickUp API response:", response.data);
  } catch (error) {
    console.error("Error hitting ClickUp API:", error);
  }
});

// Endpoint to get tasks
app.get("/api/tasks", (req, res) => {
  res.status(200).json(tasks);
});

module.exports = app;
