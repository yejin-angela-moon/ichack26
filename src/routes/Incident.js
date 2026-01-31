const express = require("express");
const { HttpError } = require("../util/HttpError");

const incidentRouter = express.Router();

/**
 * POST /api/incident
 * Receives a stacktrace string in the body and logs it
 *
 * Body: { stacktrace: string }
 */
incidentRouter.post("/", (req, res, next) => {
  try {
    const { stacktrace } = req.body;

    if (stacktrace === undefined || stacktrace === null) {
      return next(new HttpError(400, "Missing required field: stacktrace"));
    }

    const trace = typeof stacktrace === "string" ? stacktrace : String(stacktrace);
    console.log("[Incident] Stacktrace received:\n", trace);

    res.status(200).json({ success: true, message: "Stacktrace logged" });
  } catch (error) {
    next(error);
  }
});

module.exports = incidentRouter;
