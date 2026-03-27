import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/auth/admin/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      onLoginSuccess?.(data.token);
      navigate("/admin");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f6f1e7_0%,#dce2cf_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-[0_30px_80px_rgba(48,54,38,0.18)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-[#485b3b] p-8 text-white md:p-12">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">ATC Admin</p>
            <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight">
              Control products, events, and orders from one place.
            </h1>
          </div>

          <div className="space-y-4 text-sm leading-7 text-white/78">
            <p>Use an account marked as admin in the database or listed in the server ADMIN_EMAILS env.</p>
            <p>This login is separated from the user modal and stores its own token.</p>
          </div>
        </section>

        <section className="flex items-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Secure Login</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#2f3529]">Administrator Access</h2>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4b5541]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#d7ceb8] bg-[#faf8f2] px-4 py-3 outline-none transition focus:border-[#485b3b] focus:bg-white"
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#4b5541]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#d7ceb8] bg-[#faf8f2] px-4 py-3 outline-none transition focus:border-[#485b3b] focus:bg-white"
                placeholder="Enter password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#b33a24]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#39492f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Login to Admin"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
