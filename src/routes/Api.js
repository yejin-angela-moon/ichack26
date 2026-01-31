const testRouter = require("./Test");

const apiRouter = require("express").Router();

apiRouter.use("/", testRouter);

module.exports = apiRouter;