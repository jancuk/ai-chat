const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const mime = require('mime-types');
require('dotenv').config();

// Server setup
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// API key configuration
const API_KEY = process.env.API_KEY;

// Middleware to validate API key
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// API configurations
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// Claude API streaming function
async function* streamClaudeAPI(message, imageFile) {
  try {
    const messages = prepareClaudeMessages(message, imageFile);
    const response = await makeClaudeAPIRequest(messages);
    yield* processClaudeResponse(response);
  } catch (error) {
    console.error('Claude API Error:', error.message);
    yield JSON.stringify({ error: 'An error occurred while calling the Claude API.' });
  }
}

async function* streamGeminiAPI(message, imageFile) {
  console.log('Starting Gemini API request with message:', message);
  try {
    const requestBody = prepareGeminiRequestBody(message, imageFile);
    const response = await makeGeminiAPIRequest(requestBody);
    yield* processGeminiResponse(response);
  } catch (error) {
    console.error('Gemini API Error:', error);
    logGeminiError(error);
    if (error.response && error.response.status === 500) {
      yield JSON.stringify({ 
        error: "The Gemini API is currently experiencing issues. Please try again later."
      });
    } else {
      yield JSON.stringify({ 
        error: `An error occurred while calling the Gemini API: ${error.message}`
      });
    }
  }
}

async function makeGeminiAPIRequest(requestBody, retries = 5) {
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response;
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.error(`Attempt ${i + 1} failed: ${error.message}`);
        if (i === retries - 1) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } else {
        throw error;
      }
    }
  }
}

function logGeminiError(error) {
  if (error.response) {
    console.error('Error response data:', error.response.data);
    console.error('Error response status:', error.response.status);
    console.error('Error response headers:', error.response.headers);
  } else if (error.request) {
    console.error('Error request:', error.request);
  } else {
    console.error('Error message:', error.message);
  }
  // You might want to log this error to a monitoring service
}

// Chat route
app.post('/chat', upload.single('image'), async (req, res) => {
  console.log('Received chat request');
  try {
    const { message, model } = req.body;
    const imageFile = req.file;
    console.log(`Received request for model: ${model}`);
    
    setupSSEResponse(res);

    const stream = selectAPIStream(model, message, imageFile);
    await streamResponse(stream, res);

    cleanupUploadedFile(imageFile);
  } catch (error) {
    handleChatError(error, res);
  }
});

// Helper functions
function prepareClaudeMessages(message, imageFile) {
  if (imageFile && imageFile.path) {
    return prepareClaudeImageMessage(message, imageFile);
  }
  return [{ role: 'user', content: message }];
}

function prepareClaudeImageMessage(message, imageFile) {
  const imageBuffer = fs.readFileSync(imageFile.path);
  const base64Image = imageBuffer.toString('base64');
  return [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageFile.mimetype,
          data: base64Image,
        },
      },
      {
        type: 'text',
        text: message,
      },
    ],
  }];
}

async function makeClaudeAPIRequest(messages) {
  return axios.post(CLAUDE_API_URL, {
    model: 'claude-3-5-sonnet-20240620',
    messages: messages,
    max_tokens: 2000,
    stream: true,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    responseType: 'stream'
  });
}

async function* processClaudeResponse(response) {
  for await (const chunk of response.data) {
    const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.includes('event: completion')) continue;
      if (line.includes('data: [DONE]')) return;
      if (line.includes('data:')) {
        const data = JSON.parse(line.replace('data: ', ''));
        yield data.delta?.text || '';
      }
    }
  }
}

function prepareGeminiRequestBody(message, imageFile) {
  let contents = [{ parts: [{ text: message }] }];
  if (imageFile && imageFile.path) {
    contents = prepareGeminiImageContent(message, imageFile);
  }
  return {
    contents: contents,
    generationConfig: {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
      stopSequences: []
    },
    safetySettings: []
  };
}

function prepareGeminiImageContent(message, imageFile) {
  const imageBuffer = fs.readFileSync(imageFile.path);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = mime.lookup(imageFile.originalname) || 'application/octet-stream';
  return [{
    parts: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      { text: message }
    ]
  }];
}

async function* processGeminiResponse(response) {
  if (response.data.candidates && response.data.candidates.length > 0) {
    const fullText = response.data.candidates[0]?.content?.parts[0]?.text || '';
    console.log('Full response text:', fullText);
    yield* simulateStreamingResponse(fullText);
  } else {
    console.log('No candidates in response');
    yield 'No response generated.';
  }
}

async function* simulateStreamingResponse(fullText) {
  let buffer = '';
  for (let i = 0; i < fullText.length; i++) {
    buffer += fullText[i];
    if (buffer.length >= 5 || i === fullText.length - 1) {
      console.log('Yielding chunk:', buffer);
      yield buffer;
      buffer = '';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

function setupSSEResponse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}

function selectAPIStream(model, message, imageFile) {
  if (model === 'claude') {
    return streamClaudeAPI(message, imageFile);
  } else if (model === 'gemini') {
    return streamGeminiAPI(message, imageFile);
  } else {
    throw new Error('Invalid model specified');
  }
}

async function streamResponse(stream, res) {
  console.log('Starting to stream response');
  let buffer = '';
  for await (const chunk of stream) {
    console.log('Received chunk:', chunk);
    buffer += chunk;
    
    // Check if we have a complete word or punctuation
    while (buffer.includes(' ') || /[.,!?]$/.test(buffer)) {
      let index = buffer.indexOf(' ');
      if (index === -1) {
        index = buffer.length;
      }
      
      const word = buffer.slice(0, index + 1);
      buffer = buffer.slice(index + 1);
      
      console.log('Sending word:', word);
      res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
    }
  }
  
  // Send any remaining content in the buffer
  if (buffer) {
    console.log('Sending remaining buffer:', buffer);
    res.write(`data: ${JSON.stringify({ content: buffer })}\n\n`);
  }
  
  console.log('Stream completed');
  res.write('data: [DONE]\n\n');
  res.end();
}

function cleanupUploadedFile(imageFile) {
  if (imageFile) {
    fs.unlink(imageFile.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
}

function handleChatError(error, res) {
  console.error('Error in /chat route:', error);
  if (!res.headersSent) {
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  } else {
    res.write(`data: ${JSON.stringify({ error: 'An error occurred while processing your request.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});