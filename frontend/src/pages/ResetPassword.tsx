// frontend/src/pages/ResetPassword.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    async function validate() {
      setValidating(true);
      setValid(null);
      setError(null);
      try {
        if (!token) {
          setValid(false);
          setValidating(false);
          return;
        }
        const res = await api.get("/auth/validate-reset", { params: { token } });
        if (res.data?.valid) {
          setValid(true);
          setUserName(res.data?.name ?? null);
        } else {
          setValid(false);
        }
      } catch (err: any) {
        // server returns 400 for expired/used/invalid with reason; treat as invalid
        setValid(false);
      } finally {
        setValidating(false);
      }
    }
    validate();
  }, [token]);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfo(null);

    if (!token) return setError("Missing or invalid reset token.");
    if (password.length < 7) return setError("Password must be at least 7 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      await api.post("/auth/reset", { token, password });
      setInfo("Password reset successfully. Redirecting to login...");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      setError(String((err as any)?.response?.data?.error ?? getErrorMessage(err)));
    } finally {
      setBusy(false);
    }
  };

  // Render: if validating -> spinner; if invalid show modal / message with CTA
  if (validating) {
    return (
      <div className="app-shell">
        <div className="glass-card" style={{ maxWidth: 540 }}>
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border" role="status" />
            <div>Verifying reset link…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!valid) {
    // token is invalid / expired / used
    return (
      <div className="app-shell">
        <div className="glass-card" style={{ maxWidth: 540 }}>
          <h2 className="mb-2 text-center">Reset link expired or invalid</h2>
          <p className="small-muted mb-3">
            The link you used has expired or was already used. For security, reset links are valid for one hour and can be used only once.
          </p>
          <div className="mb-3">
            <button className="btn btn-primary me-2" onClick={() => nav("/login") /* go to login where user can request again */}>
              Request a new reset link
            </button>
            <button className="btn btn-outline-secondary" onClick={() => nav("/login")}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // valid == true
  return (
    <div className="app-shell">
      <div className="glass-card" style={{ maxWidth: 540 }}>
        <h2 className="mb-2 text-center">Reset password for {userName ?? "this account"}</h2>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small-muted">New password</label>

            <div className="input-group input-group-password">
              <input
                className="form-control"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                aria-label="New password"
              />
              <button
                type="button"
                className="btn btn-icon"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small-muted">Confirm new password</label>

            <div className="input-group input-group-password">
              <input
                className="form-control"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                aria-label="Confirm new password"
              />
              <button
                type="button"
                className="btn btn-icon"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowConfirm(s => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                <i className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {info && <div className="alert alert-success py-2">{info}</div>}

          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Resetting..." : "Reset password"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => nav("/login")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
