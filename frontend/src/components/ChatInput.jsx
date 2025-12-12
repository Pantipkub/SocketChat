import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../App';
import Confetti from 'react-confetti';



// --- Styles (ปรับปรุงใหม่ทั้งหมด) ---
const inputFormStyle = {
  display: 'flex',
  // 💅 เพิ่ม alignItems: 'center' เพื่อให้ไอคอนและปุ่มอยู่กึ่งกลางแนวตั้ง
  alignItems: 'center', 
  padding: '15px 20px',
  borderTop: '1px solid var(--border-color)',
  background: 'var(--card-divide-fifty)',
  gap: '10px', // 💅 เพิ่มช่องว่างระหว่างไอคอนและ input
};

const inputStyle = {
  flex: 1, // 💅 ทำให้ input ยืดเต็มพื้นที่ที่เหลือ
  // border: 'none', // 💅 ลบขอบ
  padding: '12px 18px', // 💅 ปรับ padding 
  borderRadius: '24px', // 💅 ทำให้ขอบมน (Pill-shaped)
  background: 'var(--input-bg)', // 💅 ใช้สีพื้นหลังสำหรับ input
  color: 'var(--text-color)', // 💅 ใช้สีข้อความตาม theme
  fontSize: '15px',
  outline: 'none', // 💅 ลบ focus outline
};

const iconButtonStyle = {
  background: 'none',
  border: 'none',
  padding: '0',
  margin: '0 5px',
  cursor: 'pointer',
  fontSize: '22px',
  // 💅 ใช้สีข้อความที่จางลงเล็กน้อย
  color: 'var(--system-message-color)', 
};

const sendButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%', // 💅 ทำให้เป็นวงกลม
  border: 'none',
  background: 'var(--accent-color)', // 💅 ใช้สีเน้น
  color: 'white',
  cursor: 'pointer',
  flexShrink: 0, // 💅 ป้องกันปุ่มหดตัว
  fontSize: '18px',
  transition: 'transform 0.1s',
};
// --- End Styles ---

function ChatInput({ currentChat }) {
  const [message, setMessage] = useState("");
  const socket = useSocket();
  const { setShowSnow } = useAppContext(); 

const [showConfetti, setShowConfetti] = useState(false); 

const handleEmojiClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // 🌟 Feature 2: Check for "Christmas" (Logic เดิม)
    if (text.toLowerCase().includes("christmas")) {
      setShowSnow(true);
    } else {
      setShowSnow(false);
    }
  };

  // Logic เดิม (ไม่เปลี่ยนแปลง)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChat) return;

    if (currentChat.type === 'private') {
      // try a few fields for recipient to be robust
      const recipient = currentChat.name || currentChat.username || currentChat.to || currentChat.id;
      if (!recipient) {
        console.warn('ChatInput: private chat but recipient not found', currentChat);
        return;
      }
      const payload = { to: recipient, message: message.trim() };
      console.log('ChatInput: emit private_message', payload);
      socket.emit("private_message", payload);
    }

    if (currentChat.type === 'group') {
      const payload = { room: currentChat.name, message: message.trim() };
      console.log('ChatInput: emit group_message', payload);
      socket.emit("group_message", payload);
    }

    setMessage(""); 
    setShowSnow(false); 
  };

  return (
  <>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={200} gravity={0.2} />} 
    <form onSubmit={handleSubmit} style={inputFormStyle}>
      {/* ไอคอน Emoji (สำหรับตกแต่ง) */}
      <button type="button" style={iconButtonStyle} onClick={handleEmojiClick}>
        <span>🙂</span>
      </button>
      {/* ไอคอน Paperclip (สำหรับตกแต่ง) */}
      <button type="button" style={iconButtonStyle}>
        <span>📎</span>
      </button>

      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        style={inputStyle}
      />

      {/* ปุ่ม Send (ไอคอน) */}
      <button type="submit" style={sendButtonStyle}>
        {/* 💅 ใช้ไอคอน Paper Airplane (หมุน 45 องศา) */}
        <span style={{ transform: 'rotate(-60deg)'}}>➤</span> 
      </button>
    </form>
  </>
  );

}

export default ChatInput;