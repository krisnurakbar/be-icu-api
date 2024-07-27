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

  // Make an HTTP request to the ClickUp API
  try {
    const clickUpResponse = await axios.post(
      `https://api.clickup.com/api/v2/task/${task_id}/field/3fae2d90-850b-4ad8-b7d7-5846a5ee65a0`,
      {
        value: 123, // Replace 123 with the actual number you want to send
      },
      {
        headers: {
          Authorization: "Bearer YOUR_CLICKUP_API_TOKEN", // Replace with your actual ClickUp API token
          "Content-Type": "application/json",
        },
      },
    );

    console.log("ClickUp API response:", clickUpResponse.data);

    // If the ClickUp API request is successful, store the task and respond
    tasks.push({ task_id, status_name });

    // Respond with task_id and status_name
    res.status(200).json({
      task_id,
      status_name,
      clickUpResponse: clickUpResponse.data,
    });
  } catch (error) {
    console.error(
      "Error hitting ClickUp API:",
      error.response ? error.response.data : error.message,
    );

    // Respond with an error if the ClickUp API request fails
    res.status(500).json({
      error: "Error hitting ClickUp API",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// New SPI endpoint with URL parameters
app.post(
  "/api/spi/:task_id/:status_name/:plan_progress/:actual_progress",
  async (req, res) => {
    const { task_id, status_name, plan_progress, actual_progress } = req.params;

    // Decode URL-encoded parameters
    const decodedPlanProgress = decodeURIComponent(plan_progress).replace(
      "%",
      "",
    );
    const decodedActualProgress = decodeURIComponent(actual_progress).replace(
      "%",
      "",
    );

    if (isNaN(decodedPlanProgress) || isNaN(decodedActualProgress)) {
      return res
        .status(400)
        .send("plan_progress and actual_progress must be numbers");
    }

    const spi = Number(decodedActualProgress) / Number(decodedPlanProgress);

    // Make an HTTP request to the ClickUp API
    try {
      const clickUpResponse = await axios.post(
        `https://api.clickup.com/api/v2/task/${task_id}/field/3fae2d90-850b-4ad8-b7d7-5846a5ee65a0`,
        {
          value: spi, // Send the calculated SPI value
        },
        {
          headers: {
            Authorization: "pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM", // Replace with your actual ClickUp API token
            "Content-Type": "application/json",
          },
        },
      );

      console.log("ClickUp API response:", clickUpResponse.data);

      // If the ClickUp API request is successful, store the task and respond
      tasks.push({ task_id, status_name });

      // Respond with task_id, status_name, plan_progress, actual_progress, and the calculated SPI
      res.status(200).json({
        task_id,
        status_name,
        plan_progress: Number(decodedPlanProgress),
        actual_progress: Number(decodedActualProgress),
        spi: spi,
        clickUpResponse: clickUpResponse.data,
      });
    } catch (error) {
      console.error(
        "Error hitting ClickUp API:",
        error.response ? error.response.data : error.message,
      );

      // Respond with an error if the ClickUp API request fails
      res.status(500).json({
        error: "Error hitting ClickUp API",
        details: error.response ? error.response.data : error.message,
      });
    }
  },
);

// Endpoint to get tasks
app.get("/api/tasks", (req, res) => {
  res.status(200).json(tasks);
});

module.exports = app;
