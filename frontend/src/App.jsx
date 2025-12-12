import React, { useState, createContext, useContext } from 'react';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import Snowfall from 'react-snowfall'; // 🌟 Feature 2: Snow

// สร้าง Context ใหม่สำหรับ State ของ App
export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

function App() {
  const [username, setUsername] = useState(null);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [showSnow, setShowSnow] = useState(false); // 🌟 Feature 2: Snow

  // 🌟 Feature 1: Dark Mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // เซ็ต theme ที่ <html> tag
    document.documentElement.dataset.theme = newTheme;
  };

  // ค่าที่จะส่งให้ Context
  const value = {
    username,
    theme,
    toggleTheme,
    setShowSnow
  };

  if (!username) {
    // ถ้ายังไม่ login, ไปหน้า Login
    return <LoginPage onLoginSuccess={setUsername} />;
  }

  // ถ้า login แล้ว, ไปหน้า Chat
  return (
    <AppContext.Provider value={value}>
      {/* 🌟 Feature 2: แสดงหิมะถ้า showSnow เป็น true */}
      {showSnow && <Snowfall />}
      <ChatPage />
    </AppContext.Provider>
  );
}

export default App;