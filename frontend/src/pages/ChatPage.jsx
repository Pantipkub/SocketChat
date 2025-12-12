import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

// --- Styles (CSS-in-JS) ---
const chatPageStyle = {
  display: "flex",
  height: "100vh",
  backgroundColor: "var(--bg-color)",
  color: "var(--text-color)",
};

const sidebarStyle = {
  width: "300px",
  borderRight: "1px solid var(--border-color)",
  backgroundColor: "var(--card-divide-fifty)",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

const chatWindowStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};
// --- End Styles ---

function ChatPage() {
  const socket = useSocket();
  
  // State นี้สำคัญมาก: บอกว่ากำลังแชทกับใคร
  // เช่น { type: 'private', name: 'Bob' }
  // หรือ { type: 'group', name: 'Developers', members: [...] }
  const [currentChat, setCurrentChat] = useState(null);
  const [groups, setGroups] = useState({});

  // ฟัง group_members_updated event จาก backend
  useEffect(() => {
    const handleGroupMembersUpdated = ({ groupName, members }) => {
      // อัปเดต members ของ currentChat ถ้าเป็นกลุ่มเดียวกัน
      if (currentChat && currentChat.type === "group" && currentChat.name === groupName) {
        setCurrentChat(prev => ({ ...prev, members }));
      }
    };

    socket.on("group_members_updated", handleGroupMembersUpdated);

    return () => {
      socket.off("group_members_updated", handleGroupMembersUpdated);
    };
  }, [socket, currentChat]);

  return (
    <div style={chatPageStyle}>
      <div style={sidebarStyle}>
        <Sidebar
          onSelectChat={setCurrentChat}
          groups={groups}
          setGroups={setGroups}
        />
      </div>

      <div style={chatWindowStyle}>
        <ChatWindow currentChat={currentChat} />
      </div>
    </div>
  );
}

export default ChatPage;
