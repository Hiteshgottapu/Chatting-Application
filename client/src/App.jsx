import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on('past_messages', (pastMsgs) => {
      // Sort in ascending order based on timestamp to appear correctly in chat
      const sorted = [...pastMsgs].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(sorted);
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('room_users', (activeUsers) => {
      setUsers(activeUsers);
    });

    return () => {
      socket.off('past_messages');
      socket.off('receive_message');
      socket.off('room_users');
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (username !== '' && room !== '') {
      socket.emit('join_room', { username, room });
      setJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message !== '') {
      const msgData = {
        room,
        user: username,
        text: message,
        timestamp: new Date()
      };
      socket.emit('send_message', msgData);
      
      // We directly add to messages locally since we don't broadcast back to sender in socket.to() usually
      // Because we used io.to(room).emit() in backend though, it might duplicate, so we just handle locally.
      // Wait, in server.js we do `io.to(room).emit('receive_message', data);` which goes to EVERYONE.
      // So we don't append it directly here otherwise it will duplicate. But to avoid lag:
      // We actually rely on the server to bounce it back or we can append and not bounce.
      // In this specific backend implementation, it sends to everyone including sender. 
      // So we DO NOT setMessages here manually to prevent duplicates.
      
      setMessage('');
    }
  };

  if (!joined) {
    return (
      <div style={styles.container}>
        <h2>Join Classroom</h2>
        <form onSubmit={joinRoom} style={styles.form}>
          <input
            type="text"
            placeholder="Your Name"
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Room Name"
            onChange={(e) => setRoom(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.sidebar}>
        <h3>Room: {room}</h3>
        <h4 style={{ marginTop: '1rem' }}>Active Students:</h4>
        <ul style={styles.userList}>
          {users.map((u, i) => (
            <li key={i} style={{ padding: '0.25rem 0' }}>🟢 {u}</li>
          ))}
        </ul>
      </div>
      <div style={styles.main}>
        <div style={styles.messagesBox}>
          {messages.map((msg, idx) => (
            <div key={idx} style={msg.user === username ? styles.myMsg : styles.otherMsg}>
              <strong>{msg.user}</strong>: {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} style={styles.chatForm}>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Send</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', flex: 1 },
  button: { padding: '0.8rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
  chatContainer: { display: 'flex', width: '800px', height: '600px', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  sidebar: { width: '200px', background: '#2c3e50', color: '#fff', padding: '1rem' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  messagesBox: { flex: 1, padding: '1rem', overflowY: 'auto', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  myMsg: { background: '#dcf8c6', padding: '0.5rem', borderRadius: '4px', alignSelf: 'flex-end', maxWidth: '80%', wordBreak: 'break-word' },
  otherMsg: { background: '#fff', padding: '0.5rem', borderRadius: '4px', alignSelf: 'flex-start', maxWidth: '80%', border: '1px solid #eee', wordBreak: 'break-word' },
  chatForm: { display: 'flex', padding: '1rem', background: '#fff', borderTop: '1px solid #ccc', gap: '0.5rem' },
  userList: { listStyle: 'none', padding: 0 }
};

export default App;
