const express = require("express");
const imageSearch = require('image-search-google');
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const google = new imageSearch(process.env.GOOGLE_CUSTOM_SEARCH_ID, process.env.GOOGLE_API_KEY);

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
  console.log('message', message);

  const [responseText, newHistory] = await requestGPT(history, message, res);
  console.log('responseText', responseText);
  res.send(JSON.stringify({ ...data, message: responseText, history: newHistory }));
});

app.post("/google-image-search", async (req, res) => {
  const data = req.body;
  const { itemNames, searchTerms } = data;
  console.log('message', searchTerms);

  const responses = await Promise.all(searchTerms.map(searchTerm => google.search(searchTerm, { page: 1 })));
  console.log('first response', responses[0])
  const results = Object.fromEntries(
    itemNames.map((itemName, i) => ([
      itemName,
      responses[i].slice(0, 3).map(item => item.url),
    ]))
  )
  res.send(JSON.stringify({ images: results }));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
