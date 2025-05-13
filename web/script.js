class ClickChat {
  constructor() {
    this.socket = io();
    this.currentTheme = localStorage.getItem('chat-theme') || 'blue-light';
    this.initializeElements();
    this.setupEventListeners();
    this.messageTone = new Audio('assets/messageRingtone.mp3');
    this.applyTheme(this.currentTheme);
  }

  initializeElements() {
    this.elements = {
      clientsTotal: document.getElementById('client-total'),
      messageContainer: document.getElementById('message-container'),
      nameInput: document.getElementById('name-input'),
      messageForm: document.getElementById('message-form'),
      messageInput: document.getElementById('message-input'),
      themeSelect: document.getElementById('theme-select')
    };
    
    // Set the select value to match saved theme
    if (this.elements.themeSelect) {
      this.elements.themeSelect.value = this.currentTheme;
    }
  }

  setupEventListeners() {
    this.elements.messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.elements.themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    this.socket.on('clients-total', (count) => {
      this.updateClientCount(count);
    });

    this.socket.on('chat-message', (data) => {
      this.messageTone.play();
      this.addMessage(false, data);
    });

    this.socket.on('feedback', (data) => {
      this.showTypingIndicator(data.feedback);
    });

    const { messageInput } = this.elements;
    messageInput.addEventListener('focus', () => this.handleTyping(true));
    messageInput.addEventListener('blur', () => this.handleTyping(false));
    messageInput.addEventListener('keypress', () => this.handleTyping(true));
  }

  applyTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove(
      'theme-blue-light', 
      'theme-purple-light', 
      'theme-brown-light',
      'theme-blue-dark', 
      'theme-purple-dark', 
      'theme-brown-dark'
    );
    
    // Add the new theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Save theme preference
    localStorage.setItem('chat-theme', theme);
    this.currentTheme = theme;
  }

  sendMessage() {
    const { messageInput, nameInput } = this.elements;
    if (!messageInput.value.trim()) return;

    const messageData = {
      name: nameInput.value || '*anonymous',
      message: messageInput.value,
      dateTime: new Date()
    };

    this.socket.emit('message', messageData);
    this.addMessage(true, messageData);
    messageInput.value = '';
    this.handleTyping(false);
  }

  addMessage(isOwnMessage, { name, message, dateTime }) {
    this.clearTypingIndicator();
    
    const messageElement = document.createElement('li');
    messageElement.className = `message ${isOwnMessage ? 'message-right' : 'message-left'}`;
    
    messageElement.innerHTML = `
      <p>${message}
        <span class="message-time">${name} • ${moment(dateTime).fromNow()}</span>
      </p>
    `;
    
    this.elements.messageContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.elements.messageContainer.scrollTop = this.elements.messageContainer.scrollHeight;
  }

  updateClientCount(count) {
    this.elements.clientsTotal.textContent = `Online: ${count}`;
  }

  handleTyping(isTyping) {
    const { nameInput } = this.elements;
    if (!nameInput.value) return;
    
    this.socket.emit('feedback', {
      feedback: isTyping ? `✍️ ${nameInput.value} is typing...` : ''
    });
  }

  showTypingIndicator(feedback) {
    this.clearTypingIndicator();
    if (!feedback) return;

    const indicator = document.createElement('li');
    indicator.className = 'typing-indicator';
    indicator.textContent = feedback;
    this.elements.messageContainer.appendChild(indicator);
    this.scrollToBottom();
  }

  clearTypingIndicator() {
    const indicators = document.querySelectorAll('.typing-indicator');
    indicators.forEach(indicator => indicator.remove());
  }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ClickChat();
});