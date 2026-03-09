import { useState } from "react";
import { Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    alert(`Login attempt:\nUsername: ${username}`);
  };

  const quotes = [
    { text: "A cup of tea makes everything better.", sub: "— ATC Community" },
    { text: "Slow down. Breathe. Sip.", sub: "— The Tea Way" },
    { text: "Good tea, good friends, good life.", sub: "— ATC Spirit" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-[900px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ minHeight: 520 }}>

        {/* ===== Left: Login Form ===== */}
        <div className="w-full md:w-[45%] bg-[#F0EDE3] flex flex-col justify-center px-12 py-14">
          <h1
            className="text-5xl text-gray-700 mb-10 tracking-tight"
            style={{ fontFamily: "Georgia, serif", fontWeight: 300 }}
          >
            Login
          </h1>

          <div className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white rounded-full px-6 py-3.5 text-[15px] text-gray-600 placeholder-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-[#AEBC9F] transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white rounded-full px-6 py-3.5 text-[15px] text-gray-600 placeholder-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-[#AEBC9F] transition"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-[#485B3B] text-white rounded-full py-3.5 text-[15px] font-semibold hover:bg-[#3a4a2f] transition-all shadow-md active:scale-95 mt-1"
            >
              login
            </button>
          </div>

          <p className="text-center text-gray-400 text-[13px] mt-5">
            Don't have an account?{' '}
            <a href="#" className="text-[#485B3B] hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>

        {/* ===== Right: Image + Quotes ===== */}
        <div className="relative w-full md:w-[55%] overflow-hidden" style={{ minHeight: 400 }}>
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80"
            alt="Tea pouring"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

          {/* Logo top-left */}
          <div className="absolute top-5 left-6 z-10">
            <span style={{ color: "white", fontSize: 22, fontWeight: "bold", fontFamily: "Georgia, serif", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              ATC
            </span>
          </div>

          {/* Positive phrases */}
          <div className="absolute left-6 right-6 z-10 flex flex-col gap-3" style={{ bottom: 56 }}>
            {quotes.map((q, i) => (
              <div
                key={i}
                className="rounded-xl px-5 py-3"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <p className="text-white font-medium leading-snug" style={{ fontSize: 13.5 }}>
                  "{q.text}"
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{q.sub}</p>
              </div>
            ))}
          </div>

          {/* Arrow button bottom-right */}
          <a
            href="/"
            className="absolute z-10 flex items-center justify-center text-white hover:bg-white/50 transition-all shadow-md"
            style={{
              bottom: 20,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.35)",
              fontSize: 18,
              textDecoration: "none",
            }}
          >
            →
          </a>
        </div>

      </div>
    </div>
  );
}