// frontend/src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import api, { getErrorMessage, setAuthToken } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login({
  setAuthed,
}: {
  setAuthed: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  // email-exists states (for forgot mode)
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // debounce email input when in forgot mode
  useEffect(() => {
    if (mode !== "forgot") {
      setEmailExists(null);
      setCheckingEmail(false);
      return;
    }
    const val = email?.trim();
    if (!val || !val.includes("@")) {
      setEmailExists(null);
      setCheckingEmail(false);
      return;
    }

    let mounted = true;
    setCheckingEmail(true);
    const id = setTimeout(() => {
      api
        .get("/auth/check-email", { params: { email: val } })
        .then((r) => {
          if (!mounted) return;
          setEmailExists(Boolean(r.data?.exists));
        })
        .catch(() => {
          if (!mounted) return;
          setEmailExists(null);
        })
        .finally(() => {
          if (!mounted) return;
          setCheckingEmail(false);
        });
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [email, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token as string;
      const user = res.data.user ?? { email };
      setAuthToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setAuthed(true);
      nav("/dashboard");
    } catch (err) {
      setError(
        String((err as any)?.response?.data?.error ?? getErrorMessage(err))
      );
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !email.includes("@")) return setError("Please enter a valid email.");

    // require emailExists === true to proceed
    if (emailExists !== true) {
      return setError("Email not found — register your account.");
    }

    setBusy(true);
    try {
      // server will respond 200 even if email doesn't exist (but we already checked)
      await api.post("/auth/forgot", { email });
      setInfo("We've sent a reset password link to this Email. Click it.");
    } catch (err) {
      setError(String((err as any)?.response?.data?.error ?? getErrorMessage(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="glass-card" style={{ maxWidth: 540 }}>
        {mode === "login" ? (
          <>
            <h2 className="mb-2 text-center">Sign in</h2>
            <p className="small-muted mb-4 text-center">Enter your credentials to continue.</p>

            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label small-muted">Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small-muted">Password</label>

                <div className="input-group input-group-password">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password"
                  />

                  {/* tasteful icon button */}
                  <button
                    type="button"
                    className="btn btn-icon"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="d-flex justify-content-between align-items-center">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Signing in..." : "Sign in"}
                </button>

                <div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    className="btn btn-link text-danger"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setInfo(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-center">Reset Password</h2>
            <p className="small-muted mb-3 text-center">Enter your account email — we'll send a reset link if it exists.</p>

            <form onSubmit={submitForgot}>
              <div className="mb-3">
                <label className="form-label small-muted">Email</label>

                <div className="input-group">
                  <input
                    className={`form-control ${emailExists === false ? "is-invalid" : ""}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby="email-help"
                  />

                  {/* small inline spinner while checking */}
                  {checkingEmail && (
                    <span className="input-group-text small px-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {emailExists === false && (
                  <div id="email-help" className="text-danger small mt-1">
                    Email not found — <Link to="/register">register your account</Link>.
                  </div>
                )}
                {emailExists === true && (
                  <div id="email-help" className="text-success small mt-1">
                    Email found — you can request a reset link.
                  </div>
                )}
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}
              {info && <div className="alert alert-success py-2">{info}</div>}

              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busy || emailExists !== true}
                >
                  {busy ? "Sending..." : "Send reset link"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
