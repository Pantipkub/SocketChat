import React, { useState, useRef, useEffect } from "react";

function GroupMembersButton({ members }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-border text-text transition-colors duration-200
                   hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
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
          className="lucide lucide-users"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        {members.length} active
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 mt-2 w-48 max-h-60 overflow-y-auto bg-[var(--popover)] text-[var(--popover-foreground)] border border-border rounded-lg shadow-lg z-50">
          {members.map((member) => (
            <li
              key={member}
              className="px-3 py-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors duration-200 cursor-pointer"
            >
              {member}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GroupMembersButton;
