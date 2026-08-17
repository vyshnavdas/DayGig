const OpenAI =
  require("openai");
  require("dotenv").config();


const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

module.exports = client;