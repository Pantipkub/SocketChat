// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// ----------------------------------------------------------------------

// 1. เชื่อมต่อกับ Backend
// Prefer explicit environment variable; fallback to the current host + port 3001.
// For cross-device testing, set VITE_SERVER_URL to e.g. http://192.168.1.10:3001
const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || `${protocol}://${window.location.hostname}:3001`;
const socket = io(SERVER_URL);

// 2. สร้าง Context
const SocketContext = createContext(socket);

// 3. สร้าง Hook สำหรับเรียกใช้ง่ายๆ
export const useSocket = () => {
  return useContext(SocketContext);
};

// 4. สร้าง Provider เพื่อ "หุ้ม" App ของเรา
export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};