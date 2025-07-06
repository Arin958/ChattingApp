# 💬 Real-Time Chat App

A real-time chat application built with the MERN stack that supports user authentication, private messaging, and image sharing.

---

## Features

-  User authentication (Login/Register)
-  View all registered users
-  Real-time messaging (1-on-1)
-  Send and view image messages
-  Persistent chat history
-  Responsive design
-  Built with REST API and WebSocket (Socket.IO)

---

## Tech Stack

**Frontend:**
- React (Vite)
- Redux Toolkit
- Axios
- Tailwind CSS

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT for authentication
- Multer / Cloudinary (for image uploads)

---

## 📦 Installation

### 1. Install the repository

### 2. Create environment files

Copy the example files and fill in your own credentials:

For backend:
cd server
cp .env.example .env
Edit .env and set your MongoDB URI, JWT secret, Cloudinary keys, and PORT.

For frontend:
cd client
cp .env.example .env
Edit .env and set the API URL 

### 3. Install dependencies

Backend:
cd ../server
npm install

Frontend:
cd client
npm install

### 4. Run the application

Open two terminals.

In terminal 1 (backend):

cd server
npm run dev

In terminal 2 (frontend):
cd client
npm run dev



