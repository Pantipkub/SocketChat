import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAppContext } from "../App"; // 🛑 (1) นำเข้า useAppContext
import ChatInput from "./ChatInput";
import GroupMembersButton from "./GroupMembersButton";

// --- Styles (ถูกปรับให้ใช้ CSS Variables อย่างเต็มที่) ---

const GLOBAL_FONT = "Poppins, sans-serif";

const chatWindowHeaderStyle = {
  padding: "15px 20px",
  borderBottom: "1px solid var(--border-color)", // 🛑 (3)
  background: "var(--card-divide-fifty)", // 🛑 (3)
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontFamily: GLOBAL_FONT,
  color: "var(--text-color)", // 🛑 (3)
};

const messagesContainerStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  background: "var(--chat-bg)", // 🛑 (3)
};

const messagesListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const messageStyle = {
  marginBottom: "0px",
  padding: "10px 15px",
  borderRadius: "18px 18px 18px 0",
  // maxWidth: "65%",           // 👈 ✅ [ลบออก]
  background: "var(--message-bg)",
  // wordWrap: "break-word",   // 👈 ✅ [ลบออก]
  wordBreak: "break-all",     // 👈 ✅ [เพิ่มอันนี้แทน]
  alignSelf: "flex-start",
  color: "var(--text-color)",
  fontFamily: GLOBAL_FONT,
  fontSize: "15px",
};

const messageMeStyle = {
  ...messageStyle,
  background: "var(--message-me-bg)", // 🛑 (3)
  alignSelf: "flex-end",
  borderRadius: "18px 18px 0 18px",
  color: "var(--message-me-text-color, #FFFFFF)",
};

const messageSenderStyle = {
  fontSize: "0.75em",
  fontWeight: "600",
  marginBottom: "4px",
  color: "var(--system-message-color)", // 🛑 (3)
};

const systemMessageStyle = {
  alignSelf: "center",
  background: "var(--system-message-bg, rgba(76, 110, 245, 0.1))",
  color: "var(--system-message-color, #4C6EF5)",
  padding: "6px 15px",
  borderRadius: "18px",
  fontStyle: "normal",
  fontSize: "0.85em",
  fontWeight: "500",
  marginTop: "5px",
  marginBottom: "10px",
};

// เพิ่ม Style สำหรับ Reaction
const reactionContainerStyle = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
  marginTop: '8px',
  fontSize: '14px',
};

const reactionBubbleStyle = {
  background: 'var(--reaction-bg, rgba(76, 110, 245, 0.1))',
  borderRadius: '12px',
  padding: '2px 8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  border: '1px solid var(--border-color)',
};

const emojiPickerStyle = {
  position: 'absolute',
  background: 'var(--sidebar-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '8px',
  display: 'flex',
  gap: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  zIndex: 1000,
};

// --- End Styles ---

function ChatWindow({ currentChat }) {
  const socket = useSocket();
  const {
    username,
    currentChat: contextChat,
    theme,
    toggleTheme,
  } = useAppContext(); // 🛑 (1)

  const SERVER_URL =
    import.meta.env.VITE_SERVER_URL ||
    `http://${window.location.hostname}:3001`;

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  // dedupe seen messages to avoid duplicates when server echoes / listeners register twice
  const seenMsgKeysRef = useRef(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  
  const handleReaction = (messageIndex, emoji) => {
    const message = messages[messageIndex];
    if (!message) return;

    // --- 1. ส่ง Event ไปยัง Server (เหมือนเดิม) ---
    socket.emit('add_reaction', {
      messageId: message._id || message.id,
      emoji,
      username,
      chatType: currentChat.type,
      chatName: currentChat.name,
    });

    // --- 2. อัพเดท Local State แบบ IMMUTABLE (แบบใหม่) ---
    setMessages((prevMessages) => {
      // ใช้ .map เพื่อสร้าง array ใหม่
      return prevMessages.map((msg, index) => {
        // ถ้าไม่ใช่ message ที่เราสนใจ ก็ return ตัวเดิมไป
        if (index !== messageIndex) {
          return msg;
        }

        // --- นี่คือการสร้าง "reactions" object ใหม่ ---
        // 1. โคลน reactions เก่ามาทั้งหมด
        const newReactions = { ...(msg.reactions || {}) };

        // 2. โคลน array ของ emoji นั้นๆ (หรือสร้างใหม่ถ้าไม่มี)
        const users = [...(newReactions[emoji] || [])];
        
        // 3. Toggle (เพิ่ม/ลบ) user
        const userIndex = users.indexOf(username);
        if (userIndex > -1) {
          users.splice(userIndex, 1); // ลบ user ออก
        } else {
          users.push(username); // เพิ่ม user เข้าไป
        }

        // 4. อัปเดต newReactions
        if (users.length > 0) {
          newReactions[emoji] = users;
        } else {
          delete newReactions[emoji]; // ลบ key emoji ถ้าไม่มีคนกดแล้ว
        }

        // 5. คืนค่า message object "ใหม่" ที่รวม reactions "ใหม่"
        return {
          ...msg,
          reactions: newReactions,
        };
      });
    });
  };

  // 🔽 FIX 1: แยก "ข้อความต้อนรับ" ออกมา
  useEffect(() => {
    const handleServerMessage = (message) => {
      setMessages((prev) => [...prev, { type: "system", content: message }]);
    };

    socket.on("server_message", handleServerMessage);
    return () => {
      socket.off("server_message", handleServerMessage);
    };
  }, [socket]);

  useEffect(() => {
  // 🔽 (1) ถ้าไม่มี chat ให้เคลียร์ทุกอย่างแล้วออกเลย
  if (!currentChat) {
    setMessages([]);
    return;
  }

  // --- (2) ประกาศฟังก์ชัน Listener ไว้ก่อน (ยังไม่ register) ---
  const handlePrivateMessage = ({ from, message, _id, sender, content }) => {
    const id = _id || (content ? `${from}|${content}` : `${from}|${message}`);
    if (seenMsgKeysRef.current.has(id)) return; // already seen
    const newMessage = { _id: _id, sender: from || sender, content: message || content, type: "chat" };

    if (
      currentChat &&
      currentChat.type === "private" &&
      (newMessage.sender === currentChat.name || newMessage.sender === username)
    ) {
      seenMsgKeysRef.current.add(id);
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const handleGroupMessage = ({ from, message, room, _id, sender, content }) => {
    const id = _id || `${room}|${from}|${content || message}`;
    if (seenMsgKeysRef.current.has(id)) return;
    const newMessage = { _id: _id, sender: from || sender, content: message || content, room, type: "chat" };

    if (
      currentChat &&
      currentChat.type === "group" &&
      newMessage.room === currentChat.name
    ) {
      seenMsgKeysRef.current.add(id);
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  // --- (3) สร้างฟังก์ชันสำหรับโหลดประวัติแชท ---
  const fetchHistoryAndListen = async () => {
    setMessages([]); // เคลียร์ข้อความเก่า
    let apiUrl = "";

    if (currentChat.type === "private") {
      apiUrl = `${SERVER_URL}/api/messages/private/${username}/${currentChat.name}`;
    } else {
      apiUrl = `${SERVER_URL}/api/messages/group/${currentChat.name}`;
    }

    try {
      // (3.1) โหลดประวัติแชท *ให้เสร็จก่อน*
      const res = await fetch(apiUrl);
      const history = await res.json();
      const formattedHistory = history.map((msg) => ({
        ...msg,
        type: "chat",
      }));
      
      // (3.2) *แทนที่* state ด้วยประวัติที่ดึงมา (ห้าม merge)
      setMessages(formattedHistory);

      // เติม seen set จาก history (ใช้ _id หรือ composite key)
      const newSeen = new Set();
      for (const m of formattedHistory) {
        const k = m._id || (m.room ? `${m.room}|${m.sender}|${m.content}` : `${m.sender}|${m.content}`);
        newSeen.add(k);
      }
      seenMsgKeysRef.current = newSeen;

    } catch (err) {
      console.error("Failed to fetch history:", err);
      // แม้จะ fetch ไม่ได้ ก็ยังต้องดักฟังข้อความใหม่อยู่ดี
    }

    // (3.3) *หลังจาก* โหลด history เสร็จ ค่อยเริ่มดักฟัง
    // ป้องกันกรณี race: ถ้า effect ถูก cleanup ก่อน fetch เสร็จ อย่า register listener
    if (!active) {
      console.log(`⚠️ Aborting listener registration for ${currentChat.name} (effect inactive)`);
      return;
    }

    console.log(`🎧 Start listening for ${currentChat.name}`);
    socket.on("private_message", handlePrivateMessage);
    socket.on("group_message", handleGroupMessage);
  };

  // --- (4) เรียกฟังก์ชันหลัก ---
  let active = true;
  fetchHistoryAndListen();

  // --- (5) Cleanup ---
  return () => {
    // เมื่อ component unmount หรือ currentChat เปลี่ยน
    // ให้หยุดดักฟังอันเก่าทันที และหยุดการลงทะเบียนถ้ายังรอ fetch
    active = false;
    console.log(`🛑 Stop listening for ${currentChat.name}`);
    socket.off("private_message", handlePrivateMessage);
    socket.off("group_message", handleGroupMessage);
  };

}, [ currentChat, username, SERVER_URL]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

   // ✅ เพิ่ม useEffect สำหรับรับ reaction updates
  useEffect(() => {
    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          (msg._id || msg.id) === messageId ? { ...msg, reactions } : msg
        )
      );
    };

    socket.on('reaction_updated', handleReactionUpdate);
    return () => {
      socket.off('reaction_updated', handleReactionUpdate);
    };
  }, [socket]);
  
  // --- ส่วน Render ---
  if (!currentChat) {
    return (
      <div
        style={{
          ...messagesContainerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: GLOBAL_FONT,
        }}
      >
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <>
      <div style={chatWindowHeaderStyle}>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-hash text-white"
              >
                <line x1="4" x2="20" y1="9" y2="9"></line>
                <line x1="4" x2="20" y1="15" y2="15"></line>
                <line x1="10" x2="8" y1="3" y2="21"></line>
                <line x1="16" x2="14" y1="3" y2="21"></line>
              </svg>
            </div>
            <h1 className="font-semibold text-lg">
              {currentChat.name} (
              {currentChat.type === "group"
                ? "Group Message"
                : "Direct Message"}
              )
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {currentChat.type === "group" && currentChat.members && currentChat.members.length > 0 && (
                  <GroupMembersButton members={currentChat.members} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "14px",
          }}
        >
          <button
            onClick={toggleTheme} // 🛑 (2)
            style={{
              padding: "8px 15px",
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              background: "var(--toggle-botton-bg)",
              color: "var(--accent-text)",
              cursor: "pointer",
              fontFamily: GLOBAL_FONT,
            }}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>
      
      <div style={messagesContainerStyle}>
        <div style={messagesListStyle}>
          {messages.map((msg, index) => {
            if (msg.type === "system") {
              return (
                <div key={index} style={systemMessageStyle}>
                  {msg.content}
                </div>
              );
            }

            const isMe = msg.sender === username;
            const msgReactions = msg.reactions || {};

            return (
              <div
                key={index}
                style={{ 
                  position: 'relative', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '65%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                onMouseEnter={() => setHoveredMessage(index)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {/* 🔹 Wrapper สำหรับข้อความ + ปุ่ม */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: '6px',
                    flexDirection: isMe ? 'row-reverse' : 'row', // ✅ ถ้าเป็นเรา ให้กลับด้าน
                  }}
                >
                  {/* ข้อความ */}
                  <div
                    style={isMe ? messageMeStyle : messageStyle}
                    className={isMe ? "message-me" : "message-other"}
                  >
                    {!isMe && <div style={messageSenderStyle}>{msg.sender}</div>}
                    {msg.content}
                  </div>

                  {/* ✅ ปุ่มเพิ่ม Reaction (แสดงเมื่อ hover) */}
                  {hoveredMessage === index && (
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === index ? null : index)}
                      style={{
                        background: 'var(--sidebar-bg, #f0f0f0)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        opacity: 0.8,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                      title="Add reaction"
                    >
                      ➕
                    </button>
                  )}
                </div>

                {/* แสดง Reactions ที่มีอยู่ */}
                {Object.keys(msgReactions).length > 0 && (
                  <div 
                    style={{
                      ...reactionContainerStyle,
                      justifyContent: isMe ? 'flex-end' : 'flex-start', // ✅ จัดให้ reactions ตามด้าน
                    }}
                  >
                    {Object.entries(msgReactions).map(([emoji, users]) => (
                      <div
                        key={emoji}
                        style={{
                          ...reactionBubbleStyle,
                          background: users.includes(username) 
                            ? 'var(--accent-color, #4C6EF5)' 
                            : reactionBubbleStyle.background,
                          color: users.includes(username) ? '#fff' : 'inherit',
                        }}
                        onClick={() => handleReaction(index, emoji)}
                        title={users.join(', ')}
                      >
                        <span>{emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {users.length}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker === index && (
                  <div 
                    style={{
                      ...emojiPickerStyle,
                      [isMe ? 'right' : 'left']: '0', // ✅ ถ้าเป็นเรา ให้ติดขวา, ไม่งั้นติดซ้าย
                      top: '100%',
                      marginTop: '4px',
                    }}
                  >
                    {['👍', '❤️', '😂', '🎉', '🔥', '👀'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReaction(index, emoji);
                          setShowEmojiPicker(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '24px',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <ChatInput currentChat={currentChat} />
    </>
  );
}

export default ChatWindow;
