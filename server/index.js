const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const PORT = process.env.PORT || 3001;

const requestGPT = async (history, newMessage, res) => {
  const messages = [];
  for (const [input_text, completion_text] of history) {
    messages.push({ role: "user", content: input_text });
    messages.push({ role: "assistant", content: completion_text });
  }

  messages.push({ role: "user", content: newMessage });
  
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: messages,
      temperature: 0.8,
      top_p: 0.8,
    });
    const completion_text = completion.data.choices[0].message.content;
    return [completion_text, [...history, [newMessage, completion_text]]];
  } catch (error) {
    console.log(error);
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
    res.send(JSON.stringify({ message: data.message }));
  }
}

const app = express();
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ message: "Hello from your friend, server!" });
});

app.post("/gpt-chat", async (req, res) => {
  const data = req.body;
  const { history, message } = data;

  const [responseText, newHistory] = await requestGPT(history, message, res);
  console.log('responseText', responseText);
  res.send(JSON.stringify({ ...data, message: responseText, history: newHistory }));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
