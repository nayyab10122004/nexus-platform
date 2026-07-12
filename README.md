Nexus - Investor & Entrepreneur Collaboration Platform

Overview
Nexus is a full-stack platform connecting investors and entrepreneurs for collaboration, meetings, video calls, and document management.

Features
- 🔐 **Authentication**: JWT-based secure login with role-based access
- 👥 **User Profiles**: Extended profiles for investors and entrepreneurs
- 📅 **Meeting Scheduling**: Schedule meetings with conflict detection
- 🎥 **Video Calling**: WebRTC-based video calls with Socket.IO
- 📄 **Document Management**: Upload, preview, and sign documents
- ✍️ **E-Signature**: Digital signatures for documents
- 🔍 **User Discovery**: Find and connect with other users

Tech Stack

Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Socket.IO (WebRTC signaling)
- Cloudinary (File Storage)

Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router

Project Structure
nexus-platform/
├── backend/
│ ├── config/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ ├── socketServer.js
│ └── server.js
└── nexus/
├── src/
│ ├── components/
│ ├── pages/
│ ├── context/
│ ├── services/
│ └── App.tsx
└── package.json

