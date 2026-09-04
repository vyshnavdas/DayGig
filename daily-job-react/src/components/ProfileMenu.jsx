import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DayGigLogo from "./DayGigLogo";
import "./ProfileMenu.css";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Derive avatar letter from email or name
  const initial = (user?.name || user?.email || "U")[0].toUpperCase();
  const displayName = user?.name || user?.email || "Account";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
  }

  function handleSettings() {
    setOpen(false);
    // TODO: navigate to settings page
    navigate("/settings");
  }

  return (
    <div className="profile-menu-root" ref={menuRef}>
      {/* Avatar trigger */}
      <button
        id="profile-menu-trigger"
        className={`profile-avatar-btn${open ? " open" : ""}`}
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar-letter" aria-hidden="true">
          {initial}
        </span>
        {/* online dot */}
        <span className="profile-online-dot" aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="profile-dropdown"
          role="menu"
          aria-label="Profile options"
        >
          {/* User info header */}
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar" aria-hidden="true">
              {initial}
            </div>
            <div className="profile-dropdown-info">
              <p className="profile-dropdown-name">{displayName}</p>
              {user?.email && user?.name && (
                <p className="profile-dropdown-email">{user.email}</p>
              )}
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Menu items */}
          <button
            id="profile-menu-settings"
            className="profile-menu-item"
            type="button"
            role="menuitem"
            onClick={handleSettings}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            Settings
          </button>

          <div className="profile-dropdown-divider" />

          <button
            id="profile-menu-logout"
            className="profile-menu-item danger"
            type="button"
            role="menuitem"
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>

          <div className="profile-dropdown-brand">
            <DayGigLogo size={16} />
          </div>
        </div>
      )}
    </div>
  );
}
