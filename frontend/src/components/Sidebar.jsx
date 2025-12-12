import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAppContext } from "../App";
import ThemeToggle from "./ThemeToggle";

const GLOBAL_FONT = "Poppins, sans-serif";

// --- Styles ---
const sidebarHeaderStyle = {
  padding: "10px",
  borderBottom: "1px solid var(--border-color)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const listStyle = { listStyle: "none", padding: 0, margin: 0 };
const listMeStyle = {
  padding: "10px",
  borderBottom: "1px solid var(--border-color)",
};
const listItemStyle = {
  padding: "10px",
  cursor: "pointer",
  borderBottom: "1px solid var(--border-color)",
};
const listHeaderStyle = {
  padding: "10px",
  background: "var(--chat-bg)",
  fontWeight: "bold",
};
const buttonContainerStyle = { display: "flex", gap: "5px", padding: "10px" };
// --- End Styles ---

function Sidebar({ onSelectChat }) {
  const socket = useSocket();
  const { username } = useAppContext(); // ชื่อของเราเอง
  const [users, setUsers] = useState([]); // (R4)
  const [groups, setGroups] = useState({}); // (R9)
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    // ฟัง event จาก server
    socket.on("user_list", (userList) => {
      setUsers(userList);
    });

    socket.on("group_list", (groupList) => {
      setGroups(groupList);
    });

    // 🔽 2. เพิ่มส่วนนี้: ร้องขอ list "ปัจจุบัน" ทันที 🔽
    socket.emit("get_initial_lists");

    // Cleanup
    return () => {
      socket.off("user_list");
      socket.off("group_list");
    };
  }, [socket]);

  // (R8)
  const handleCreateGroup = () => {
    const groupName = prompt("Enter new group name:");
    if (groupName) {
      socket.emit("create_group", groupName);

      // สั่งให้ ChatPage เปลี่ยนหน้าต่างแชทไปที่กลุ่มใหม่ทันที
      // ส่ง members array ว่างเพราะยังรอให้ backend ส่ง group_members_updated
      onSelectChat({
        type: "group",
        name: groupName,
        members: [],
      });
    }
  };

  // (R10)
  const handleJoinGroup = (groupName) => {
    socket.emit("join_group", groupName);
    // ส่ง members array ว่างเพราะยังรอให้ backend ส่ง group_members_updated
    onSelectChat({
      type: "group",
      name: groupName,
      members: groups[groupName] || [],
    });
  };

  return (
    <div
      style={{ fontFamily: GLOBAL_FONT }}
      className="bg-card backdrop-blur-sm border-r border-border flex flex-col relative z-10"
    >
      <div className="p-4 border-b border-border">
        {/* <div className="h-1 w-12 animated-gradient rounded-full mb-3"></div> */}
        <div className="mb-3"></div>
        <h2 className="font-bold text-2xl text-foreground">
          SocketChat Server
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          Welcome, {username}!
        </p>
      </div>
      {/* <div style={sidebarHeaderStyle}>
          Logged in as: <strong>{username}</strong>
          <ThemeToggle />
        </div> */}

      {/* (R4) Private Messages List */}
      <div className="p-3 border-b border-border">
        <div className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Private Messages
        </div>
        <div className="space-y-0.5">
          <button
            key={username}
            className="w-full flex gap-2 px-2 py-3 rounded-2xl text-base transition-all duration-200"
          >
            <div className="flex gap-1">
              <span>{username} </span>
              <span className="flex text-xs items-center">(me)</span>
            </div>

          </button>
          {users
            .filter((u) => u !== username)
            .map((user) => (
              <button
                key={user}
                onClick={() => {
                  setSelectedChat({ type: "private", name: user });
                  onSelectChat({ type: "private", name: user });
                }}
                className={`w-full flex items-center gap-2 px-2 py-3 rounded-2xl text-base transition-all duration-200 ${
                  selectedChat?.type === "private" && selectedChat?.name === user
                    ? "bg-[var(--primary-divide-ten)] text-[var(--primary)] font-medium shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{user}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className="text-green-500"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* <div style={buttonContainerStyle}>
        <button onClick={handleCreateGroup} style={{ width: "100%" }}>
          Create Group
        </button>
      </div> */}

      {/* (R9) Group Messages List */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
            Groups
          </h3>
          <button
            data-slot="button"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-full gap-1.5 has-[&gt;svg]:px-2.5 h-5 w-5 p-0 transition-colors
         bg-transparent text-[var(--muted-foreground)]
         hover:bg-[var(--primary-divide-ten)]
         hover:text-[var(--primary)]"
            onClick={handleCreateGroup}
          >
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
              className="lucide lucide-plus"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
          </button>
        </div>
        <div className="space-y-0.5">
          {Object.keys(groups).map((groupName) => (
            <button
              key={groupName}
              onClick={() => {
                setSelectedChat({ type: "group", name: groupName });
                handleJoinGroup(groupName);
              }}
              className={`w-full flex items-center gap-2 px-2 py-3 rounded-2xl text-base transition-all duration-200 ${
                  selectedChat?.type === "group" && selectedChat?.name === groupName
                    ? "bg-[var(--primary-divide-ten)] text-[var(--primary)] font-medium shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-hash shrink-0"
              >
                <line x1="4" x2="20" y1="9" y2="9"></line>
                <line x1="4" x2="20" y1="15" y2="15"></line>
                <line x1="10" x2="8" y1="3" y2="21"></line>
                <line x1="16" x2="14" y1="3" y2="21"></line>
              </svg>
              <span className="flex-1 text-left truncate">{groupName}</span>
              <span className="text-base opacity-60 bg-muted px-1.5 py-0.5 rounded">
                {groups[groupName].length}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
