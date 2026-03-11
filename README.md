# Real-Time Student Collaboration App

A simple project teaching students MERN stack deployment and real-time communication.

## 1. Project Idea
A chat app where students can:
* Join a classroom
* Send messages instantly
* See live updates when others join
* View shared announcements

## 2. Technology Stack
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (MongoDB Atlas)
* **Real-Time Communication:** WebSockets (Socket.io)
* **Deployment Platforms:** 
  * Frontend → Vercel or Netlify
  * Backend → Render or Railway
  * Database → MongoDB Atlas

## 3. Application Features
* **User System:** Student enters name and joins a room.
* **Real-Time Chat:** Messages appear instantly without page refresh.
* **Live User List:** Display active users in the room.
* **Announcements:** Teacher can send announcements to all students.
* **Message History:** Store chat messages in MongoDB.

## 4. System Architecture
User Browser → React Frontend
Frontend → API requests → Express Backend
Backend → MongoDB Database

**Real-time communication:**
React Frontend ↔ WebSocket Connection ↔ Express Server

## 5. Deployment Architecture
GitHub Repository
↓
Frontend hosted on Vercel
Backend hosted on Render
Database hosted on MongoDB Atlas

*(The system supports public access through a deployed URL.)*

## 6. Key Concepts Demonstrated
* Frontend build process (Production build, Optimized static assets)
* Backend server deployment (Running API services in the cloud)
* Environment variables (Database connection string, Secret keys)
* Common deployment issues (Port configuration, CORS errors)

## 7. Folder Structure
```text
project-root/
├── client/          # React Frontend
│   ├── src/         # React components and logic
│   └── package.json # Frontend dependencies
├── server/          # Express and Socket.io Backend
│   ├── server.js    # Main server file
│   └── package.json # Backend dependencies
└── README.md
```
