import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function AdminRoute({ adminToken, onLogout, openLogin }) {
  const [status, setStatus] = useState(adminToken ? "loading" : "unauthorized");
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (!adminToken) {
      setStatus("unauthorized");
      setAdminUser(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch(apiUrl("/auth/admin/profile"), {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();

        if (!cancelled) {
          setAdminUser(data.user);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          onLogout?.();
          setStatus("unauthorized");
        }
      }
    }

    setStatus("loading");
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [adminToken, onLogout]);

  useEffect(() => {
    if (status === "unauthorized") {
      openLogin?.();
    }
  }, [openLogin, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] text-[#485b3b]">
        Loading admin area...
      </div>
    );
  }

  if (status !== "ready") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout adminUser={adminUser} onLogout={onLogout}>
      <Outlet context={{ adminUser, adminToken }} />
    </AdminLayout>
  );
}
