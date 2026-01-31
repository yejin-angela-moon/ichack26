const { createAnthropic } = require("@ai-sdk/anthropic");

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = { anthropic };
