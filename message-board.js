// Get the last selected chat room from localStorage, or default to 'Reburg'
let currentRoom = localStorage.getItem('chatRoom') || 'Reburg';

// Get the user ID from localStorage to identify who is logged in
const userId = localStorage.getItem('userId');

// Redirect to login if user ID is not found (not logged in)
if (!userId) {
  alert("You're not logged in. Redirecting...");
  window.location.href = 'login.html';
}

// Switch to a different chat room
function switchRoom(room) {
  currentRoom = room; // Update the current room
  localStorage.setItem('chatRoom', room); // Save it so it persists after refresh

  // Remove 'active' class from all tab buttons
  document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));

  // Add 'active' class to the selected tab
  document.getElementById(`tab-${room}`).classList.add('active');

  // Load messages for the new room
  fetchMessages();
}

// Convert a timestamp into "time ago" format (e.g. "2m ago")
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (let key in intervals) {
    const value = Math.floor(seconds / intervals[key]);
    if (value > 0) return `${value}${key[0]} ago`;
  }
  return 'Just now';
}

// Load and display messages from the current room
async function fetchMessages() {
  try {
    const res = await fetch(`/messages/${encodeURIComponent(currentRoom)}`);
    const data = await res.json();

    const container = document.getElementById('messages');
    container.innerHTML = '';

    // Make sure the response is an array
    if (!Array.isArray(data)) {
      console.error('Server did not return an array:', data);
      container.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
      return;
    }

    // Handle empty room (no messages yet)
    if (data.length === 0) {
      container.innerHTML = `<p style="color: gray;">No messages in this room yet.</p>`;
      return;
    }

    // Create and display each message (and its replies recursively)
    function createMessageElement(msg, level = 0) {
      const div = document.createElement('div');
      div.className = 'message';
      div.style.marginLeft = `${level * 20}px`; // Indent replies

      // Message layout: username, time ago, text, and reply box
      div.innerHTML = `
        <strong>${msg.username}</strong> (${timeAgo(msg.timestamp)})<br>
        ${msg.text}<br>
        <button class="reply-button" onclick="toggleReplyInput(${msg.id})">↳ Reply</button>
        <div class="reply-box" id="replyInputContainer-${msg.id}">
          <textarea id="replyInput-${msg.id}" placeholder="Type your reply..."></textarea>
          <button class="post-btn" onclick="sendMessage(${msg.id})">Post Reply</button>
        </div>
      `;

      container.appendChild(div);

      // Recursively create elements for replies
      msg.replies.forEach(reply => createMessageElement(reply, level + 1));
    }

    // Render all root-level messages
    data.forEach(msg => createMessageElement(msg));
  } catch (err) {
    console.error('Fetch error:', err);
    document.getElementById('messages').innerHTML = `<p style="color: red;">Fetch error: ${err.message}</p>`;
  }
}

// Toggle visibility of the reply input box for a message
function toggleReplyInput(id) {
  const box = document.getElementById(`replyInputContainer-${id}`);
  box.style.display = box.style.display === 'none' || box.style.display === '' ? 'block' : 'none';
}

// Send a new message or reply
async function sendMessage(parent_id = null) {
  // Get the correct input box (main input or reply)
  const input = parent_id
    ? document.getElementById(`replyInput-${parent_id}`)
    : document.getElementById('messageInput');

  const message = input.value.trim();
  if (!message) return;

  try {
    // Send the message to the backend
    const res = await fetch('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        parent_id,     // null for top-level messages
        user_id: userId,
        room: currentRoom
      })
    });

    const data = await res.json();

    if (data.success) {
      input.value = '';    // Clear the input
      fetchMessages();     // Refresh message list
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Send error:', err);
  }
}

// When the page loads, activate the saved/current room
window.onload = () => {
  switchRoom(currentRoom);
};
