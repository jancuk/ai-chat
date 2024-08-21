const scripts = [
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.2/marked.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-javascript.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-python.min.js",
];

const styles = [
  "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-okaidia.min.css",
];

const additionalStyles = `
  .code-block-wrapper {
    position: relative;
    margin: 1rem 0;
  }
  .code-block-wrapper pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 1rem;
    margin: 0;
    overflow-x: auto;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    border-radius: 0.25rem;
    background-color: rgba(75, 85, 99, 0.8);
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s;
  }
  .copy-button:hover {
    background-color: rgba(75, 85, 99, 1);
    color: rgba(255, 255, 255, 1);
  }
  .copy-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(75, 85, 99, 0.5);
  }
`;

function loadScripts(scripts, callback) {
  function loadScript(index) {
    if (index < scripts.length) {
      const script = document.createElement("script");
      script.src = scripts[index];
      script.onload = () => loadScript(index + 1);
      script.onerror = (error) => console.error(`Error loading script: ${scripts[index]}`, error);
      document.head.appendChild(script);
    } else {
      callback();
    }
  }
  loadScript(0);
}

function loadStyles(styles) {
  styles.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
}

function initializeChatInterface() {
  const containerId = 'ai-chat-container';
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  container.innerHTML = `
    <div id="chat-window" class="ai-chat-styles fixed bottom-0 right-0 w-full sm:w-96 bg-white shadow-lg rounded-t-lg transition-all duration-300 ease-in-out">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold">AI Chat</h2>
        <div class="flex items-center">
          <select id="model-selector" class="border rounded px-2 py-1 mr-2">
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>
          <button id="maximize-btn" class="text-gray-500 hover:text-gray-700 focus:outline-none mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button id="minimize-btn" class="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div id="chat-content" class="h-80 overflow-y-auto p-4">
        <!-- Chat messages will be inserted here -->
      </div>
      <div id="chat-input" class="p-4 border-t">
        <form id="chat-form" class="flex flex-col">
          <div class="flex items-center mb-2">
            <textarea id="user-input" class="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Type your message..." rows="3"></textarea>
            <button type="button" id="screen-capture-btn" class="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button type="button" id="file-upload-btn" class="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
          <div id="image-preview" class="mb-2 hidden">
            <div class="flex items-center">
              <div class="relative w-16 h-16">
                <img id="captured-image" class="w-16 h-16 object-cover rounded-lg mr-2" />
                <div id="image-loading" class="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center rounded-lg hidden">
                  <svg class="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <button type="button" id="remove-image-btn" class="text-sm text-red-600 hover:text-red-800">Remove Image</button>
            </div>
          </div>
          <button type="submit" id="send-button" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
            <span>Send</span>
            <svg id="send-loading" class="animate-spin ml-2 h-5 w-5 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', `<style>${additionalStyles}</style>`);

  const chatWindow = document.getElementById("chat-window");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatContent = document.getElementById("chat-content");
  const modelSelector = document.getElementById("model-selector");
  const minimizeBtn = document.getElementById("minimize-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const screenCaptureBtn = document.getElementById("screen-capture-btn");
  const imagePreview = document.getElementById("image-preview");
  const capturedImage = document.getElementById("captured-image");
  const removeImageBtn = document.getElementById("remove-image-btn");
  const sendButton = document.getElementById("send-button");
  const sendLoading = document.getElementById("send-loading");
  const imageLoading = document.getElementById("image-loading");

  let isMinimized = true;
  let isMaximized = false;
  let capturedImageBlob = null;

  function toggleMinimize() {
    if (isMinimized) {
      chatWindow.style.height = "56px";
      chatContent.style.display = "none";
      chatForm.style.display = "none";
      minimizeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      `;
    } else {
      chatWindow.style.height = "";
      chatContent.style.display = "";
      chatForm.style.display = "";
      minimizeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      `;
    }
    isMinimized = !isMinimized;
  }

  function toggleMaximize() {
    isMaximized = !isMaximized;
    if (isMaximized) {
      chatWindow.classList.remove("sm:w-96", "right-0", "bottom-0");
      chatWindow.classList.add("inset-0", "rounded-none");
      chatContent.classList.remove("h-80");
      chatContent.classList.add("h-[calc(100vh-200px)]"); // Adjust the height to accommodate the input area
      maximizeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4l5 5m11-5l-5 5m5 11l-5-5m-11 5l5-5" />
        </svg>
      `;
    } else {
      chatWindow.classList.add("sm:w-96", "right-0", "bottom-0");
      chatWindow.classList.remove("inset-0", "rounded-none");
      chatContent.classList.add("h-80");
      chatContent.classList.remove("h-[calc(100vh-200px)]");
      maximizeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      `;
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      sendButton.disabled = true;
      sendLoading.classList.remove("hidden");
      sendButton.querySelector("span").textContent = "Sending...";
      if (capturedImageBlob) {
        imageLoading.classList.remove("hidden");
      }
    } else {
      sendButton.disabled = false;
      sendLoading.classList.add("hidden");
      sendButton.querySelector("span").textContent = "Send";
      imageLoading.classList.add("hidden");
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    const selectedModel = modelSelector.value;

    if (!userMessage && !capturedImageBlob) return;

    setLoadingState(true);

    addMessage("user", userMessage);
    userInput.value = "";

    const formData = new FormData();
    formData.append("message", userMessage);
    formData.append("model", selectedModel);
    if (capturedImageBlob) {
      formData.append("image", capturedImageBlob, "screenshot.jpg");
    }

    try {
      const response = await fetch("https://ai-chat-w50i.onrender.com/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();
      let aiResponseDiv = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6).trim();

            if (dataContent === "[DONE]") {
              break;
            }

            try {
              const data = JSON.parse(dataContent);

              if (!aiResponseDiv) {
                aiResponseDiv = addMessage("ai", "");
              }

              if (data.error) {
                appendToMessage(aiResponseDiv, `Error: ${data.error}`);
                break;
              }

              if (data.content) {
                appendToMessage(aiResponseDiv, data.content);
              }
            } catch (jsonError) {
              console.error("Error parsing JSON:", jsonError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage("system", "Sorry, there was an error processing your request.");
    } finally {
      setLoadingState(false);
      capturedImageBlob = null;
      capturedImage.src = "";
      imagePreview.classList.add("hidden");
    }
  }

  function addMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(
      "mb-4",
      role === "user" ? "text-right" : "text-left"
    );

    const messageParagraph = document.createElement("p");
    messageParagraph.classList.add(
      "rounded-lg",
      "py-2",
      "px-4",
      "inline-block",
      "max-w-3/4"
    );

    if (role === "user") {
      messageParagraph.classList.add("bg-blue-100", "text-blue-800");
    } else {
      messageParagraph.classList.add("bg-green-100", "text-green-800");
    }

    messageParagraph.textContent = content;
    messageDiv.appendChild(messageParagraph);
    chatContent.appendChild(messageDiv);
    chatContent.scrollTop = chatContent.scrollHeight;

    return messageParagraph;
  }

  let isInCodeBlock = false;
  let codeBlockContent = '';
  let codeLanguage = '';
  let accumulatedContent = '';

  function appendToMessage(messageElement, content) {
    if (!isInCodeBlock && content.includes('```')) {
      isInCodeBlock = true;
      const parts = content.split('```');
      if (parts[0]) {
        accumulatedContent += parts[0];
        renderAccumulatedContent(messageElement);
      }
      codeBlockContent = parts[1] || '';
      const firstLineBreak = codeBlockContent.indexOf('\n');
      if (firstLineBreak !== -1) {
        codeLanguage = codeBlockContent.slice(0, firstLineBreak).trim();
        codeBlockContent = codeBlockContent.slice(firstLineBreak + 1);
      }
      createCodeBlockElement(messageElement);
    } else if (isInCodeBlock && content.includes('```')) {
      const parts = content.split('```');
      codeBlockContent += parts[0];
      updateCodeBlockContent(messageElement, codeBlockContent);
      isInCodeBlock = false;
      codeBlockContent = '';
      codeLanguage = '';
      if (parts[1]) {
        accumulatedContent += parts[1];
      }
    } else if (isInCodeBlock) {
      codeBlockContent += content;
      updateCodeBlockContent(messageElement, codeBlockContent);
    } else {
      accumulatedContent += content;
      if (content.endsWith('\n') || content.endsWith('.') || content.endsWith('!') || content.endsWith('?')) {
        renderAccumulatedContent(messageElement);
      }
    }

    chatContent.scrollTop = chatContent.scrollHeight;
  }

  function renderAccumulatedContent(messageElement) {
    if (accumulatedContent.trim()) {
      appendRegularContent(messageElement, accumulatedContent);
      accumulatedContent = '';
    }
  }

  function appendRegularContent(messageElement, content) {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = marked.parse(content);

    contentDiv.querySelectorAll('p').forEach(p => {
      p.style.marginBottom = '0.5em';
    });
    contentDiv.querySelectorAll('ul, ol').forEach(list => {
      list.style.marginLeft = '1.5em';
      list.style.marginBottom = '0.5em';
    });
    contentDiv.querySelectorAll('li').forEach(li => {
      li.style.marginBottom = '0.25em';
    });
    contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      heading.style.marginTop = '0.5em';
      heading.style.marginBottom = '0.5em';
    });

    messageElement.appendChild(contentDiv);

    contentDiv.querySelectorAll('pre code').forEach((block) => {
      Prism.highlightElement(block);
    });
  }

  function createCodeBlockElement(messageElement) {
    const codeBlockWrapper = document.createElement('div');
    codeBlockWrapper.className = 'code-block-wrapper relative my-4';

    const preElement = document.createElement('pre');
    preElement.className = 'whitespace-pre overflow-x-auto p-4 bg-gray-800 text-gray-200 rounded-md text-sm';
    
    const codeElement = document.createElement('code');
    if (codeLanguage) {
      codeElement.className = `language-${codeLanguage}`;
    }
    codeElement.textContent = codeBlockContent;
    preElement.appendChild(codeElement);

    codeBlockWrapper.appendChild(preElement);
    addCopyButton(codeBlockWrapper, preElement);

    messageElement.appendChild(codeBlockWrapper);
  }

  function updateCodeBlockContent(messageElement, content) {
    const codeBlockWrapper = messageElement.querySelector('.code-block-wrapper:last-child');
    if (codeBlockWrapper) {
      const codeElement = codeBlockWrapper.querySelector('code');
      if (codeElement) {
        codeElement.textContent = content;
        if (codeLanguage) {
          codeElement.className = `language-${codeLanguage}`;
          Prism.highlightElement(codeElement);
        }
      }
    }
  }

  function addCopyButton(wrapper, codeElement) {
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'copy-button absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(codeElement.textContent).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => copyButton.textContent = 'Copy', 2000);
      });
    });
    wrapper.appendChild(copyButton);
  }

  screenCaptureBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
  
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  
      canvas.toBlob(
        (blob) => {
          capturedImageBlob = blob;
          capturedImage.src = URL.createObjectURL(blob);
          imagePreview.classList.remove("hidden");
          updateImagePreviewSize();
        },
        "image/jpeg",
        0.8
      );
  
      track.stop();
    } catch (error) {
      console.error("Error capturing screen:", error);
    }
  });
  
  function updateImagePreviewSize() {
    capturedImage.style.width = "64px";
    capturedImage.style.height = "64px";
    capturedImage.style.objectFit = "cover";
  }
  
  removeImageBtn.addEventListener("click", () => {
    capturedImageBlob = null;
    capturedImage.src = "";
    imagePreview.classList.add("hidden");
  });

  minimizeBtn.addEventListener("click", toggleMinimize);
  maximizeBtn.addEventListener("click", toggleMaximize);

  chatForm.addEventListener("submit", handleFormSubmit);

  userInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  userInput.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  const fileUploadBtn = document.getElementById("file-upload-btn");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
  fileInput.style.display = "none";

  fileUploadBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      capturedImageBlob = file;
      capturedImage.src = URL.createObjectURL(file);
      imagePreview.classList.remove("hidden");
      updateImagePreviewSize();
    }
  });
}

loadStyles(styles);
loadScripts(scripts, initializeChatInterface);