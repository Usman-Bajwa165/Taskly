// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage, setAuthToken } from "../api";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type Task = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: "todo" | "in-progress" | "done";
  createdAt?: string;
};

const statusLabel = (s?: string) => {
  if (!s || s === "todo") return "Pending";
  if (s === "in-progress") return "In Progress";
  if (s === "done") return "Done";
  return s ?? "";
};

function formatDateShort(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/** Helper to get a local YYYY-MM-DD string from an ISO date string */
function toLocalDateInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<{ open: boolean; task?: Task }>({
    open: false,
  });
  const [showDelete, setShowDelete] = useState<{
    open: boolean;
    id?: string;
    title?: string;
  }>({ open: false });
  const [error, setError] = useState<string | null>(null);

  // fetch tasks
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "" | "todo" | "in-progress" | "done"
  >("");

  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    fetchTasks({ q: debouncedSearch, status: filterStatus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus]);

  // small centralised API error handler: if 401 -> clear auth and redirect
  const handleApiError = (err: any) => {
    console.error(err?.response?.data ?? err);

    const status = err?.response?.status;
    if (status === 401) {
      // clear auth client-side and navigate to login quietly
      console.warn("Unauthorized — clearing token and redirecting to login");
      setAuthToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      return true; // handled
    }

    // otherwise show the server error (same behaviour as before)
    setError(String(err?.response?.data?.error ?? getErrorMessage(err)));
    return false;
  };

  const fetchTasks = async (opts?: { q?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (opts?.q ?? search) params.q = opts?.q ?? search;
      if (opts?.status ?? filterStatus)
        params.status = opts?.status ?? filterStatus;
      const res = await api.get("/tasks", { params });
      const got = res.data?.tasks ?? res.data ?? [];
      setTasks(Array.isArray(got) ? got : []);
    } catch (err: any) {
      // if it's a 401 we handle and redirect; otherwise show error
      if (handleApiError(err)) return;
      console.error("GET /tasks failed:", err?.response?.data ?? err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // create
  const createTask = async (payload: {
    title: string;
    description?: string;
    dueDate?: string;
  }) => {
    setError(null);
    try {
      const res = await api.post("/tasks", payload);
      const created = res.data ?? res.data?.task;
      if (!created || !created._id) {
        console.warn("Unexpected create response", res.data);
      }
      setTasks((prev) => [created, ...prev].filter(Boolean));
      setShowCreate(false);
    } catch (err: any) {
      if (handleApiError(err)) return;
      console.error("POST /tasks failed:", err?.response?.data ?? err);
    }
  };

  // update
  const updateTask = async (id: string, payload: any) => {
    setError(null);
    try {
      const res = await api.put(`/tasks/${id}`, payload);
      const updated = res.data;
      if (!updated || !updated._id) {
        console.warn("Unexpected update response", res.data);
      }
      setTasks((prev) => prev.map((t) => (t._id === id ? updated || t : t)));
      setShowEdit({ open: false });
    } catch (err: any) {
      if (handleApiError(err)) return;
      console.error(`PUT /tasks/${id} failed:`, err?.response?.data ?? err);
    }
  };

  // delete
  const deleteTask = async (id: string) => {
    setError(null);
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setShowDelete({ open: false });
    } catch (err: any) {
      if (handleApiError(err)) return;
      console.error(`DELETE /tasks/${id} failed:`, err?.response?.data ?? err);
    }
  };

  // don't reuse/mutate a single Date instance across calls.
  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    if (task.status === "done") return false;
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const d = new Date(task.dueDate);
    const dueStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dueStart.getTime() < todayStart.getTime();
  };

  // responsive layout: container-fluid + wide card styling
  return (
    <div className="app-shell" style={{ marginTop: -30 }}>
      <div className="container-fluid">
        <div
          className="card p-4"
          style={{
            borderRadius: 14,
            background: "rgba(255,255,255,0.86)",
            boxShadow: "0 12px 30px rgba(10,10,20,0.06)",
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
            <div>
              <h4 className="mb-1">Your Tasks</h4>
              <div className="text-muted small">
                Manage tasks quickly — create, edit, delete without reload.
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreate(true)}
              >
                <i className="fa-solid fa-plus me-2" /> Create task
              </button>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select form-select-sm me-2"
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as any);
                  fetchTasks({ q: search, status: e.target.value });
                }}
              >
                <option value="">All</option>
                <option value="todo">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <input
                className="form-control form-control-sm me-2"
                style={{ width: 220 }}
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    fetchTasks({ q: search, status: filterStatus });
                }}
              />

              <button
                className="btn btn-outline-secondary"
                onClick={() => fetchTasks({ q: search, status: filterStatus })}
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="table-responsive table-responsive-scroll">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 220 }}>Title</th>
                  <th className="d-none d-md-table-cell">Description</th>
                  <th style={{ minWidth: 180 }}>Due</th>
                  <th style={{ width: 160 }}>Status</th>
                  <th style={{ minWidth: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading…</td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No tasks yet</td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <tr
                        key={task._id}
                        className={
                          overdue ? "table-danger" : task.status === "done" ? "table-success" : ""
                        }
                      >
                        <td style={{ minWidth: 220 }}>
                          <div className="fw-semibold">{task.title}</div>
                          <div className="text-muted small d-md-none">
                            {task.description ?? "-"}
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          {task.description ?? "-"}
                        </td>
                        <td style={{ minWidth: 180 }}>
                          {formatDateShort(task.dueDate)}
                        </td>
                        <td style={{ width: 160 }}>
                          <select
                            className="form-select form-select-sm"
                            value={task.status ?? "todo"}
                            onChange={(e) =>
                              updateTask(task._id, { status: e.target.value })
                            }
                          >
                            <option value="todo">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => setShowEdit({ open: true, task })}
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setShowDelete({
                                open: true,
                                id: task._id,
                                title: task.title,
                              })
                            }
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create task" onClose={() => setShowCreate(false)}>
          <TaskForm
            onSubmit={(p) => createTask(p)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit.open && showEdit.task && (
        <Modal title="Edit task" onClose={() => setShowEdit({ open: false })}>
          <TaskForm
            initial={showEdit.task}
            onSubmit={(p) => updateTask(showEdit.task!._id, p)}
            onCancel={() => setShowEdit({ open: false })}
            allowStatus={true}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {showDelete.open && showDelete.id && (
        <Modal
          title="Confirm Delete"
          onClose={() => setShowDelete({ open: false })}
        >
          <p>
            Are you sure you want to delete{" "}
            <strong>{showDelete.title ?? "this"}</strong> task? This cannot be
            undone.
          </p>
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => setShowDelete({ open: false })}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => deleteTask(showDelete.id!)}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* Simple modal component */
function Modal({
  title,
  children,
  onClose,
}: {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6,7,14,0.48)",
        }}
      />
      <div
        className="card p-4"
        style={{ width: "min(100%,900px)", borderRadius: 12, zIndex: 2 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* TaskForm used for create & edit */
function TaskForm({
  initial,
  onSubmit,
  onCancel,
  allowStatus,
}: {
  initial?: Partial<Task>;
  onSubmit: (payload: any) => void;
  onCancel: () => void;
  allowStatus?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  // date-only input value (YYYY-MM-DD). For create we ask only date, not time.
  const [dateValue, setDateValue] = useState<string>(() =>
    toLocalDateInput(initial?.dueDate ?? null)
  );
  const [status, setStatus] = useState(initial?.status ?? "todo");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("Title is required");
    setBusy(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description || undefined,
      };

      if (dateValue) {
        // construct local Date at 23:59 local time for the selected date
        const [y, m, d] = dateValue.split("-");
        const due = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 0);
        payload.dueDate = due.toISOString();
      } else {
        payload.dueDate = undefined;
      }

      if (allowStatus) payload.status = status;

      await onSubmit(payload);
    } catch (e: any) {
      console.error("TaskForm submit failed:", e?.response?.data ?? e);
      setErr(String(e?.response?.data?.error ?? getErrorMessage(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className="form-label small text-muted">Title</label>
        <input
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small text-muted">Description</label>
        <textarea
          className="form-control"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label small text-muted">
          Due date (MM/DD/YYYY)
        </label>
        {/* date-only input: user picks a date; time will default to 11:59 PM */}
        <input
          className="form-control"
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
        />
      </div>

      {allowStatus && (
        <div className="mb-3">
          <label className="form-label small text-muted">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "todo" | "in-progress" | "done")
            }
          >
            <option value="todo">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}