// frontend/src/pages/Register.tsx
import React, { useEffect, useState } from "react";
import api, { getErrorMessage, setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";

function useDebounce<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function Register({ setAuthed }: { setAuthed: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const debouncedEmail = useDebounce(email, 500);

  useEffect(() => {
    let mounted = true;
    setEmailExists(null);
    if (!debouncedEmail || !debouncedEmail.includes("@")) {
      setEmailExists(null);
      return;
    }
    api.get("/auth/check-email", { params: { email: debouncedEmail } })
      .then(r => {
        if (!mounted) return;
        setEmailExists(Boolean(r.data?.exists));
      })
      .catch(() => {
        if (!mounted) return;
        setEmailExists(null);
      });
    return () => { mounted = false; };
  }, [debouncedEmail]);

  const clientValidate = () => {
    if (!email.includes("@")) return "Please enter a valid email.";
    if (password.length < 7) return "Password must be at least 7 characters.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (emailExists) return setError("Email already exists — use another email.");
    const cv = clientValidate();
    if (cv) return setError(cv);
    setBusy(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const token = res.data.token as string;
      const user = res.data.user ?? { email, name };
      setAuthToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setAuthed(true);
      nav("/dashboard");
    } catch (err) {
      if ((err as any)?.response?.data) {
        const d = (err as any).response.data;
        if (d.error) setError(String(d.error));
        else setError(JSON.stringify(d));
      } else setError(String(getErrorMessage(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="glass-card">
        <h2 className="mb-2">Create account</h2>
        <p className="small-muted mb-4">Start managing tasks with a fast, minimal experience.</p>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small-muted">Name (optional)</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="mb-3">
            <label className="form-label small-muted">Email</label>
            <input
              className={`form-control ${emailExists ? "is-invalid" : ""}`}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {emailExists && <div className="text-danger small mt-1">Email already exists — use any other email.</div>}
          </div>

<div className="mb-3">
  <label className="form-label small-muted">Password</label>

  <div className="input-group">
    <input
      className="form-control"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="Choose a strong password (min 7 chars)"
      aria-label="Password"
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

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-primary" type="submit" disabled={busy || !!emailExists}>{busy ? "Creating..." : "Create account"}</button>
            <button type="button" className="btn btn-link" onClick={() => { setName(""); setEmail(""); setPassword(""); }}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
