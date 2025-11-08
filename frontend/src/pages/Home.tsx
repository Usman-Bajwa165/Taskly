// frontend/src/pages/Home.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="app-shell" style={{ marginTop: -20 }}>
      <div className="container">
        {/* Hero */}
        <div className="card p-4 mb-4" style={{ borderRadius: 14 }}>
          <div className="row align-items-center g-4">
            <div className="col-md-6">
              <h1 className="mb-2" style={{ fontWeight: 700 }}>
                Taskly — Simple tasks, delightful productivity
              </h1>
              <p className="text-muted">
                Manage personal and team tasks quickly. Create, edit, track deadlines,
                and mark tasks done — all in a lightweight, beautiful UI.
              </p>

              <div className="d-flex gap-2 mt-3">
                <Link to="/register" className="btn btn-primary btn-lg">Get started — it's free</Link>
                <Link to="/login" className="btn btn-outline-secondary btn-lg">Sign in</Link>
              </div>

              <div className="d-flex gap-3 mt-4 small text-muted">
                <div><strong>Fast</strong> — minimal design, instant actions</div>
                <div>•</div>
                <div><strong>Secure</strong> — JWT auth & hashed passwords</div>
                <div>•</div>
                <div><strong>Portable</strong> — use it on desktop & mobile</div>
              </div>
            </div>

            <div className="col-md-6 d-none d-md-block">
              <div style={{
                background: "linear-gradient(180deg,#eef2ff,#fff)",
                borderRadius: 12,
                padding: 18,
                boxShadow: "0 10px 30px rgba(10,10,20,0.04)"
              }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      display: "grid", placeItems: "center", color: "white"
                    }}>
                      <i className="fa-solid fa-list-check" style={{ fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Organize in seconds</div>
                      <div className="small text-muted">Quick create & edit — no reloads.</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: "linear-gradient(135deg,#34d399,#10b981)",
                      display: "grid", placeItems: "center", color: "white"
                    }}>
                      <i className="fa-solid fa-bolt" style={{ fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Blazing fast</div>
                      <div className="small text-muted">Optimized for speed and clarity.</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: "linear-gradient(135deg,#f97316,#fb923c)",
                      display: "grid", placeItems: "center", color: "white"
                    }}>
                      <i className="fa-solid fa-calendar-check" style={{ fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Deadlines made visible</div>
                      <div className="small text-muted">Due dates and quick overdue highlights.</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, textAlign: "right" }}>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon bg-primary text-white rounded-2">
                  <i className="fa-solid fa-plus" />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Create & organize</div>
                  <div className="small text-muted">Add tasks with descriptions and due dates in one click.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon bg-success text-white rounded-2">
                  <i className="fa-solid fa-check" />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Track progress</div>
                  <div className="small text-muted">Switch status to In Progress or Done and keep momentum.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon bg-warning text-white rounded-2">
                  <i className="fa-solid fa-clock" />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Due dates & reminders</div>
                  <div className="small text-muted">Quickly spot overdue tasks and plan your day.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA / footer card */}
        <div className="card p-3" style={{ borderRadius: 12 }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div>
              <div style={{ fontWeight: 700 }}>Ready to simplify your work?</div>
              <div className="small text-muted">Start organizing your tasks in seconds.</div>
            </div>
            <div className="d-flex gap-2">
              <Link to="/register" className="btn btn-primary">Create account</Link>
              <Link to="/login" className="btn btn-outline-secondary">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
