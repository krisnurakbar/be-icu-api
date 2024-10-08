const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const {Client} = require('pg');

const app = express();

// PostgreSQL connection setup
const client = new Client({
  user: 'default',
  host: 'ep-quiet-recipe-a1f508g5-pooler.ap-southeast-1.aws.neon.tech',
  database: 'verceldb',
  password: '3iNOK9SFPqtI',
  port: 5432, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false // You might need this for self-signed certificates
  }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage for tasks
const tasks = [];

app.get('/api/project-progress', async (req, res) => {
  try {
    client.connect();
      const result = await client.query('SELECT * FROM t_project_progress');
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  client.end;
});

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
          Authorization: "pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM", // Replace with your actual ClickUp API token
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

// Helper function to clean, trim last character, and convert to number
function cleanAndConvert(value) {
  // Replace %25 with an empty string
  const cleanedValue = value.replace(/%25/g, "");
  // Remove the last character
  const trimmedValue = cleanedValue.slice(0, -1);
  // Convert to number
  return Number(trimmedValue);
}

// New SPI endpoint with URL parameters
app.post(
  "/api/spi/:task_id/:status_name/:plan_progress/:actual_progress",
  async (req, res) => {
    const { task_id, status_name, plan_progress, actual_progress } = req.params;

    // Log the raw values to debug
    console.log(
      `Raw plan_progress: ${plan_progress}, Raw actual_progress: ${actual_progress}`,
    );

    let cleanedPlanProgress, cleanedActualProgress;

    try {
      cleanedPlanProgress = cleanAndConvert(plan_progress);
      cleanedActualProgress = cleanAndConvert(actual_progress);
    } catch (error) {
      return res
        .status(400)
        .send("Invalid URL encoding in plan_progress or actual_progress");
    }

    // Log the cleaned values to debug
    console.log(
      `Cleaned plan_progress: ${cleanedPlanProgress}, Cleaned actual_progress: ${cleanedActualProgress}`,
    );

    if (isNaN(cleanedPlanProgress) || isNaN(cleanedActualProgress)) {
      return res
        .status(400)
        .send(
          `plan_progress (${cleanedPlanProgress}) and actual_progress (${cleanedActualProgress}) must be numbers`,
        );
    }

    // Calculate SPI based on conditions
    if (cleanedPlanProgress === 0 && cleanedActualProgress === 0) {
      spi = 1;
    } else {
      // If plan_progress is not 0 and actual_progress is 0, set actual_progress to 1
      if (cleanedPlanProgress !== 0 && cleanedActualProgress === 0) {
        cleanedActualProgress = 1;
      }

      // If actual_progress is not 0 and plan_progress is 0, set plan_progress to 1
      if (cleanedActualProgress !== 0 && cleanedPlanProgress === 0) {
        cleanedPlanProgress = 1;
      }

      // Calculate SPI and round to 2 decimal places
      spi = (cleanedActualProgress / cleanedPlanProgress).toFixed(2);
    }

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
        plan_progress: cleanedPlanProgress,
        actual_progress: cleanedActualProgress,
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

// CPI endpoint with URL parameters
app.post("/api/cpi/:task_id/:plan_cost/:actual_cost", async (req, res) => {
  const { task_id, plan_cost, actual_cost } = req.params;

  // Convert plan_cost and actual_cost to numbers
  let planCost = parseFloat(plan_cost);
  let actualCost = parseFloat(actual_cost);

  // Handle cases where actual_cost or plan_cost is 0
  if (actualCost === 0) {
    actualCost = 1; // Avoid division by zero
  }

  if (planCost === 0) {
    planCost = 1; // Avoid division by zero
  }

  // Calculate CPI
  const cpi = (planCost / actualCost).toFixed(2);

  // Make an HTTP request to the ClickUp API (if needed)
  try {
    const clickUpResponse = await axios.post(
      `https://api.clickup.com/api/v2/task/${task_id}/field/6388f1ee-66ba-480a-a187-e400442e99e1`,
      {
        value: cpi, // Send the calculated CPI value
      },
      {
        headers: {
          Authorization: "pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM", // Replace with your actual ClickUp API token
          "Content-Type": "application/json",
        },
      },
    );

    console.log("ClickUp API response:", clickUpResponse.data);

    // Respond with task_id, plan_cost, actual_cost, and the calculated CPI
    res.status(200).json({
      task_id,
      plan_cost: planCost,
      actual_cost: actualCost,
      cpi: parseFloat(cpi),
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

// Endpoint to get tasks
app.get("/api/tasks", (req, res) => {
  res.status(200).json(tasks);
});

module.exports = app;
