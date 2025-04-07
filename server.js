const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Error handling
const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('SQLite Connection Error:', err.message);
    } else {
        console.log('Connected to SQLite Database');
    }
});

// Auto-delete messages older than 1 minute (can be made longer, just here for demonstration)
setInterval(() => {
    db.run(`DELETE FROM messages WHERE timestamp <= datetime('now', '-1 minute')`, (err) => {
        if (err) {
            console.error('Error deleting old messages:', err.message);
        } else {
            console.log('Deleted messages older than 1 minute.');
        }
    });
}, 30000); //This number checks every minute

/*
setInterval(() => {
    db.run(`DELETE FROM messages WHERE timestamp <= datetime('now', '-7 days')`, (err) => {
      if (err) {
        console.error('Error deleting old messages:', err.message);
      } else {
        console.log('Deleted messages older than 7 days.');
      }
    });
  }, 3600000); // This number checks every hour
*/

//User login logic
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        res.json({ success: true, message: 'Login successful!', userId: user.id });
    });
});

//User signup logic
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
            [name, email, hashedPassword],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: 'User exists or DB error.' });
                res.json({ success: true, message: 'User registered!', userId: this.lastID });
            }
        );
    } catch {
        res.status(500).json({ success: false, message: 'Error processing request.' });
    }
});

//Post message to a specific room
app.post('/message', (req, res) => {
    const { message, parent_id = null, user_id, room = 'Reburg' } = req.body;
    if (!message || !user_id || !room) {
        return res.status(400).json({ success: false, message: 'Missing fields.' });
    }

    db.run(
        `INSERT INTO messages (text, user_id, parent_id, room, timestamp) VALUES (?, ?, ?, ?, datetime('now'))`,
        [message, user_id, parent_id, room],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: 'Insert failed.' });
            res.json({ success: true, message: 'Message posted.', messageId: this.lastID });
        }
    );
});

// Get messages for each specific room
app.get('/messages/:room', (req, res) => {
    const room = req.params.room;

    const query = `
        SELECT messages.id, messages.text, messages.timestamp, messages.parent_id, users.name AS username
        FROM messages
        JOIN users ON messages.user_id = users.id
        WHERE messages.room = ?
        ORDER BY messages.timestamp ASC
    `;

    db.all(query, [room], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Fetch failed.' });

        const messages = [];
        const messageMap = {};

        rows.forEach(msg => {
            msg.replies = [];
            messageMap[msg.id] = msg;
            if (msg.parent_id === null) {
                messages.push(msg);
            } else {
                if (messageMap[msg.parent_id]) {
                    messageMap[msg.parent_id].replies.push(msg);
                } else {
                    messageMap[msg.parent_id] = { replies: [msg] };
                }
            }
        });

        res.json(messages);
    });
});

// Serve pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/message-board', (req, res) => res.sendFile(path.join(__dirname, 'public', 'message-board.html')));

// Start  the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
