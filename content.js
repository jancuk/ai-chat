function injectChatInterface() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'ai-chat-container';
  document.body.appendChild(chatContainer);

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('chat.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

injectChatInterface();