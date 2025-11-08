// src/components/Nav.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "../api";

type Props = { authed: boolean; setAuthed: (v: boolean) => void };

export default function Nav({ authed, setAuthed }: Props) {
  const navigate = useNavigate();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const name = storedUser?.name || storedUser?.email?.split?.("@")?.[0] || "User";

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthed(false);
    navigate("/login");
  };

  return (
    <header className="site-nav bg-white/80 border-bottom">
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="text-decoration-none d-flex align-items-center">
          <div
            className="me-3 d-flex align-items-center justify-content-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: "0 6px 18px rgba(99,102,241,0.18)",
              transform: "translateZ(0)",
              transition: "transform 180ms ease, boxShadow: " as any,
            }}
            title="Taskly"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.03)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(0)")}
            aria-hidden={false}
            role="img"
            aria-label="Taskly logo"
          >
            <span style={{ color: "white", fontSize: 20 }}>
              <i className="fa-solid fa-list-check" />
            </span>
          </div>

          <div>
            <div className="fw-bold" style={{ color: "#4338ca" }}>
              Taskly
            </div>
            <div className="small-muted">Manage your tasks at one place.</div>
          </div>
        </Link>

        <div>
          {!authed ? (
            <>
              <Link to="/login" className="btn btn-sm btn-outline-primary me-2">
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="me-3 small-muted">Welcome, <strong>{name}</strong></span>
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
