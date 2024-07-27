const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage for tasks
const tasks = [];

// Webhook endpoint with URL parameters
app.post('/api/webhook/:task_id/:status_name', async (req, res) => {
  const { task_id, status_name } = req.params;

  if (!task_id || !status_name) {
    return res.status(400).send('task_id and status_name are required');
  }

  // Make an HTTP request to the ClickUp API
  try {
    const clickUpResponse = await axios.post(
      `https://api.clickup.com/api/v2/task/${task_id}/field/3fae2d90-850b-4ad8-b7d7-5846a5ee65a0`,
      {
        value: 123 // Replace 123 with the actual number you want to send
      },
      {
        headers: {
          'Authorization': 'pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM',  // Replace with your actual ClickUp API token
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('ClickUp API response:', clickUpResponse.data);

    // If the ClickUp API request is successful, store the task and respond
    tasks.push({ task_id, status_name });

    // Respond with task_id and status_name
    res.status(200).json({
      task_id,
      status_name,
      clickUpResponse: clickUpResponse.data
    });

  } catch (error) {
    console.error('Error hitting ClickUp API:', error.response ? error.response.data : error.message);

    // Respond with an error if the ClickUp API request fails
    res.status(500).json({
      error: 'Error hitting ClickUp API',
      details: error.response ? error.response.data : error.message
    });
  }
});

// Helper function to clean, trim last character, and convert to number
function cleanAndConvert(value) {
  // Replace %25 with an empty string
  const cleanedValue = value.replace(/%25/g, '');
  // Remove the last character
  const trimmedValue = cleanedValue.slice(0, -1);
  // Convert to number
  return Number(trimmedValue);
}

// New SPI endpoint with URL parameters
app.post('/api/spi/:task_id/:status_name/:plan_progress/:actual_progress', async (req, res) => {
  const { task_id, status_name, plan_progress, actual_progress } = req.params;

  // Log the raw values to debug
  console.log(`Raw plan_progress: ${plan_progress}, Raw actual_progress: ${actual_progress}`);

  let cleanedPlanProgress, cleanedActualProgress;

  try {
    cleanedPlanProgress = cleanAndConvert(plan_progress);
    cleanedActualProgress = cleanAndConvert(actual_progress);
  } catch (error) {
    return res.status(400).send('Invalid URL encoding in plan_progress or actual_progress');
  }

  // Log the cleaned values to debug
  console.log(`Cleaned plan_progress: ${cleanedPlanProgress}, Cleaned actual_progress: ${cleanedActualProgress}`);

  if (isNaN(cleanedPlanProgress) || isNaN(cleanedActualProgress)) {
    return res.status(400).send(`plan_progress (${cleanedPlanProgress}) and actual_progress (${cleanedActualProgress}) must be numbers`);
  }

  const spi = cleanedActualProgress / cleanedPlanProgress;

  // Make an HTTP request to the ClickUp API
  try {
    const clickUpResponse = await axios.post(
      `https://api.clickup.com/api/v2/task/${task_id}/field/3fae2d90-850b-4ad8-b7d7-5846a5ee65a0`,
      {
        value: spi // Send the calculated SPI value
      },
      {
        headers: {
          'Authorization': 'pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM',  // Replace with your actual ClickUp API token
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('ClickUp API response:', clickUpResponse.data);

    // If the ClickUp API request is successful, store the task and respond
    tasks.push({ task_id, status_name });

    // Respond with task_id, status_name, plan_progress, actual_progress, and the calculated SPI
    res.status(200).json({
      task_id,
      status_name,
      plan_progress: cleanedPlanProgress,
      actual_progress: cleanedActualProgress,
      spi: spi,
      clickUpResponse: clickUpResponse.data
    });

  } catch (error) {
    console.error('Error hitting ClickUp API:', error.response ? error.response.data : error.message);

    // Respond with an error if the ClickUp API request fails
    res.status(500).json({
      error: 'Error hitting ClickUp API',
      details: error.response ? error.res
