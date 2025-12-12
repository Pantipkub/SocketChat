"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "../context/SocketContext"

const GLOBAL_FONT = "Poppins, sans-serif"

const UI_CONFIG = {
  // Colors - White & Elegant Theme
  CARD_BG: "#FFFFFF",
  PAGE_BG: "#F8F9FA",
  PRIMARY_BLUE: "#2563EB", // More refined blue
  TEXT_COLOR: "#1F2937", // Dark gray for text
  INPUT_BG: "#F9FAFB",
  SUCCESS_COLOR: "#10B981",
  ERROR_COLOR: "#EF4444",
  TAGLINE_COLOR: "#6B7280", // Subtle gray
  BORDER_COLOR: "#E5E7EB",

  // Aesthetics
  BORDER_RADIUS: "16px",
  BOX_SHADOW: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  CARD_SHADOW: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

  // Avatar Colors Array
  AVATAR_COLORS: [
    "#4C6EF5",
    "#9C36B5",
    "#D6336C",
    "#F76707",
    "#FCC419",
    "#E03131",
    "#7950F2",
    "#20C997",
    "#FF922B",
    "#E64980",
    "#5C7CFA",
    "#18BA5D",
  ],
}

const styles = {
  appContainer: {
    minHeight: "100vh",
    backgroundColor: "var(--page-bg, " + UI_CONFIG.PAGE_BG + ")",
    color: "var(--text-color, " + UI_CONFIG.TEXT_COLOR + ")",
    fontFamily: "Poppins, sans-serif",
  },

  loginPage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(135deg, #F8F9FA 0%, #E5E7EB 100%)",
  },

  loginCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px",
    backgroundColor: UI_CONFIG.CARD_BG,
    borderRadius: UI_CONFIG.BORDER_RADIUS,
    boxShadow: UI_CONFIG.CARD_SHADOW,
    width: "420px",
    maxWidth: "90%",
    color: UI_CONFIG.TEXT_COLOR,
    gap: "24px",
    border: "1px solid " + UI_CONFIG.BORDER_COLOR,
  },

  header: {
    fontSize: "32px",
    fontWeight: "700",
    fontFamily: "Poppins, sans-serif",
    color: UI_CONFIG.TEXT_COLOR,
    marginBottom: "0",
    letterSpacing: "-0.02em",
  },

  tagline: {
    fontSize: "15px",
    color: UI_CONFIG.TAGLINE_COLOR,
    marginTop: "4px",
    marginBottom: "8px",
    fontWeight: "400",
  },

  formGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: GLOBAL_FONT,
    color: UI_CONFIG.TEXT_COLOR,
    letterSpacing: "-0.01em",
  },

  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1.5px solid " + UI_CONFIG.BORDER_COLOR,
    backgroundColor: UI_CONFIG.INPUT_BG,
    color: UI_CONFIG.TEXT_COLOR,
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: GLOBAL_FONT,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  button: {
    padding: "14px 28px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: UI_CONFIG.PRIMARY_BLUE,
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    transition: "background-color 0.2s, transform 0.1s, box-shadow 0.2s",
    fontFamily: GLOBAL_FONT,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  error: {
    color: UI_CONFIG.ERROR_COLOR,
    marginTop: "10px",
    fontSize: "14px",
  },

  status: {
    fontSize: "12px",
    marginTop: "15px",
    color: UI_CONFIG.SUCCESS_COLOR,
  },
}

const ColorPicker = ({ selectedColor, onSelect }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: "8px",
      width: "100%",
    }}
  >
    {UI_CONFIG.AVATAR_COLORS.map((color) => (
      <div
        key={color}
        onClick={() => onSelect(color)}
        style={{
          backgroundColor: color,
          width: "100%",
          height: "32px",
          borderRadius: "6px",
          cursor: "pointer",
          border: color === selectedColor ? `3px solid ${UI_CONFIG.TEXT_COLOR}` : "none",
          boxShadow: color === selectedColor ? "0 0 0 1px #fff" : "none",
          transition: "transform 0.1s",
        }}
      />
    ))}
  </div>
)

// ...existing code...

function LoginPage({ onLoginSuccess }) {
  const [nameInput, setNameInput] = useState("")
  const [avatarColor, setAvatarColor] = useState(UI_CONFIG.AVATAR_COLORS[0])
  const [error, setError] = useState(null)
  const socket = useSocket()

  // เก็บชื่อที่เพิ่งส่ง ไว้ใช้เมื่อ server ตอบกลับ
  const pendingNameRef = useRef("")

  useEffect(() => {
    const handleServerMessage = (message) => {
      console.log("server_message", message)
      onLoginSuccess && onLoginSuccess(pendingNameRef.current)
    }

    const handleJoinError = (errorMessage) => {
      setError(errorMessage)
    }

    socket.on("server_message", handleServerMessage)
    socket.on("join_error", handleJoinError)

    return () => {
      socket.off("server_message", handleServerMessage)
      socket.off("join_error", handleJoinError)
    }
  }, [socket, onLoginSuccess])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const trimmed = nameInput.trim()
    if (trimmed) {
      pendingNameRef.current = trimmed
      socket.emit("join", trimmed, { avatarColor })
    }
  }

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div
          style={{
            marginBottom: "8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#EFF6FF",
              padding: "14px",
              borderRadius: "14px",
              marginBottom: "12px",
              border: "1px solid #DBEAFE",
            }}
          >
            <span style={{ fontSize: "32px", lineHeight: "1" }}>💬</span>
          </div>

          <h2 style={styles.header}>SocketChat</h2>
          <p style={styles.tagline}>Connect and communicate in real-time</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>
            Username
          </label>

          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = UI_CONFIG.PRIMARY_BLUE
              e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = UI_CONFIG.BORDER_COLOR
              e.target.style.boxShadow = "none"
            }}
            required
            maxLength={20}
          />

          {/* <div style={{ marginTop: '8px' }}>
            <label style={styles.label}>Choose Avatar Color</label>
            <div style={{ marginTop: '6px' }}>
              <ColorPicker selectedColor={avatarColor} onSelect={setAvatarColor} />
            </div>
          </div> */}

          <button
            type="submit"
            style={{ ...styles.button, marginTop: "12px" }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#1D4ED8"
              e.target.style.transform = "translateY(-1px)"
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = UI_CONFIG.PRIMARY_BLUE
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
            }}
          >
            Join SocketChat
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

export default LoginPage
