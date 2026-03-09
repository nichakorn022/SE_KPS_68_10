import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {

      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem("token", data.token);

        alert("Login success");

        console.log(data);

        // 👇 ไปหน้าหลัก
        navigate("/");

      } else {

        alert(data.message);

      }

    } catch (err) {

      console.error(err);
      alert("Server error");

    }
  };

  const quotes = [
    { text: "A cup of tea makes everything better.", sub: "— ATC Community" },
    { text: "Slow down. Breathe. Sip.", sub: "— The Tea Way" },
    { text: "Good tea, good friends, good life.", sub: "— ATC Spirit" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-[900px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ minHeight: 520 }}>

        {/* Login Form */}
        <div className="w-full md:w-[45%] bg-[#F0EDE3] flex flex-col justify-center px-12 py-14">

          <h1 className="text-5xl text-gray-700 mb-10 tracking-tight">
            Login
          </h1>

          <div className="flex flex-col gap-5">

            <input
              type="text"
              placeholder="Email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white rounded-full px-6 py-3.5"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white rounded-full px-6 py-3.5"
            />

            <button
              onClick={handleLogin}
              className="w-full bg-[#485B3B] text-white rounded-full py-3.5"
            >
              login
            </button>

          </div>

          <p className="text-center text-gray-400 text-[13px] mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#485B3B] hover:underline">
              Sign up
            </Link>
          </p>

        </div>

        {/* Right image */}
        <div className="relative w-full md:w-[55%] overflow-hidden">

          <img
            src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80"
            alt="Tea"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/40" />

        </div>

      </div>
    </div>
  );
}