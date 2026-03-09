import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [tab, setTab] = useState("user"); // "user" | "merchant"
  const navigate = useNavigate();

  // User fields
  const [userForm, setUserForm] = useState({
    username: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  // Merchant fields
  const [merchantForm, setMerchantForm] = useState({
    storeName: "", storeAddress: "", nationalId: "",
    username: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const handleUserChange = (e) =>
    setUserForm({ ...userForm, [e.target.name]: e.target.value });

  const handleMerchantChange = (e) =>
    setMerchantForm({ ...merchantForm, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    const isUser = tab === "user";
    const form = isUser ? userForm : merchantForm;

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const endpoint = isUser
        ? "http://localhost:3001/api/auth/register/user"
        : "http://localhost:3001/api/auth/register/merchant";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Register success!");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#fff",
    borderRadius: 50,
    padding: "12px 22px",
    fontSize: 14,
    color: "#555",
    border: "none",
    outline: "none",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F3E9",
        fontFamily: "sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 16px 60px rgba(0,0,0,0.15)",
          display: "flex",
          minHeight: 520,
        }}
      >
        {/* ===== Left: Image ===== */}
        <div style={{ flex: "0 0 42%", position: "relative", overflow: "hidden" }}>
          <img
            src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"
            alt="Tea"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.08)" }} />

          {/* ATC Logo top-left */}
          <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
            <span
              style={{
                fontFamily: "Georgia,serif", fontWeight: "bold", fontSize: 20,
                color: "#333", textShadow: "0 1px 4px rgba(255,255,255,0.6)",
              }}
            >
              ATC
            </span>
          </div>

          {/* Frosted text bottom */}
          <div style={{ position: "absolute", bottom: 60, left: 20, right: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {["เริ่มต้นชีวิตชากับพวกเรา", "ชุมชนที่อบอุ่นรอคุณอยู่"].map((t, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.45)", backdropFilter: "blur(10px)",
                borderRadius: 10, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.5)",
              }}>
                <p style={{ margin: 0, fontSize: 13, color: "#333", fontWeight: 500 }}>{t}</p>
              </div>
            ))}
          </div>

          {/* Arrow button */}
          <Link
            to="/login"
            style={{
              position: "absolute", bottom: 20, right: 20, zIndex: 10,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#333", fontSize: 16, textDecoration: "none",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            →
          </Link>
        </div>

        {/* ===== Right: Form ===== */}
        <div
          style={{
            flex: 1,
            background: "#F0EDE3",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "36px 44px",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <h1
            style={{
              fontFamily: "Georgia,serif", fontSize: 42, fontWeight: 400,
              color: "#3a3a3a", margin: "0 0 24px 0",
            }}
          >
            Register
          </h1>

          {/* Tab Toggle */}
          <div
            style={{
              display: "flex", background: "#e4e0d6", borderRadius: 50,
              padding: 4, marginBottom: 24, width: "100%",
            }}
          >
            {["user", "merchant"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 50,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#333" : "#999",
                  boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {t === "user" ? "User" : "Merchant"}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>

            {/* Merchant-only fields */}
            {tab === "merchant" && (
              <>
                <input
                  name="storeName"
                  placeholder="Store name"
                  value={merchantForm.storeName}
                  onChange={handleMerchantChange}
                  style={inputStyle}
                />
                <input
                  name="storeAddress"
                  placeholder="Store address"
                  value={merchantForm.storeAddress}
                  onChange={handleMerchantChange}
                  style={inputStyle}
                />
                <input
                  name="nationalId"
                  placeholder="National ID"
                  value={merchantForm.nationalId}
                  onChange={handleMerchantChange}
                  style={inputStyle}
                />
              </>
            )}

            {/* Common fields */}
            {tab === "user" ? (
              <>
                <input name="username" placeholder="Username" value={userForm.username} onChange={handleUserChange} style={inputStyle} />
                <input name="email" placeholder="Email address" value={userForm.email} onChange={handleUserChange} style={inputStyle} />
                <input name="phone" placeholder="Phone number" value={userForm.phone} onChange={handleUserChange} style={inputStyle} />
                <input name="password" type="password" placeholder="Password" value={userForm.password} onChange={handleUserChange} style={inputStyle} />
                <input name="confirmPassword" type="password" placeholder="Confirm password" value={userForm.confirmPassword} onChange={handleUserChange} style={inputStyle} />
              </>
            ) : (
              <>
                <input name="username" placeholder="Username" value={merchantForm.username} onChange={handleMerchantChange} style={inputStyle} />
                <input name="email" placeholder="Email address" value={merchantForm.email} onChange={handleMerchantChange} style={inputStyle} />
                <input name="phone" placeholder="Phone number" value={merchantForm.phone} onChange={handleMerchantChange} style={inputStyle} />
                <input name="password" type="password" placeholder="Password" value={merchantForm.password} onChange={handleMerchantChange} style={inputStyle} />
                <input name="confirmPassword" type="password" placeholder="Confirm password" value={merchantForm.confirmPassword} onChange={handleMerchantChange} style={inputStyle} />
              </>
            )}

            <button
              onClick={handleRegister}
              style={{
                background: "#485B3B", color: "#fff", borderRadius: 50,
                padding: "14px 0", fontSize: 15, fontWeight: "bold",
                border: "none", cursor: "pointer", marginTop: 4,
                boxShadow: "0 4px 16px rgba(72,91,59,0.35)",
              }}
            >
              register
            </button>
          </div>

          <p style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 16, marginBottom: 0 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#485B3B", fontWeight: 600, textDecoration: "none" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}