const express = require("express");
const { processIncident } = require("../controllers/IncidentController");

const incidentRouter = express.Router();

/**
 * POST /api/incident
 * Receives a stacktrace string in the body and logs it
 *
 * Body: { stacktrace: string, app_name: string }
 */
incidentRouter.post("/", async (req, res, next) => {
  try {
    const { stacktrace, app_name } = req.body;
    const result = await processIncident(stacktrace, app_name);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = incidentRouter;
