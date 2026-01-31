const testRouter = require("./Test");
const chatRouter = require("./Chat");
const gitHubRouter = require("./GitHub");
const incidentRouter = require("./Incident");

const apiRouter = require("express").Router();

apiRouter.use("/", testRouter);
apiRouter.use("/github", gitHubRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/incident", incidentRouter);

module.exports = apiRouter;
