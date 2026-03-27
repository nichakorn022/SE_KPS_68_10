import { useState, useEffect } from "react";
import { useAuthModal } from "../App";
import { apiUrl } from "../lib/api";

function Toast({ message, type = "success", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        top: 28,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
        background: type === "success" ? "#485B3B" : "#c0392b",
        color: "#fff",
        padding: "14px 28px",
        borderRadius: 50,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        whiteSpace: "nowrap",
      }}
    >
      <span>{type === "success" ? "OK" : "X"}</span>
      {message}
    </div>
  );
}

export default function Register({ isOpen, onClose }) {
  const [tab, setTab] = useState("user");
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openLogin } = useAuthModal();

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [merchantForm, setMerchantForm] = useState({
    storeName: "",
    storeAddress: "",
    nationalId: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleUserChange = (event) =>
    setUserForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleMerchantChange = (event) =>
    setMerchantForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 350);
  };

  const handleRegister = async () => {
    const isUser = tab === "user";
    const form = isUser ? userForm : merchantForm;

    if (form.password !== form.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isUser ? apiUrl("/auth/register/user") : apiUrl("/auth/register/merchant");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setToast({ message: data.message || "Registration failed", type: "error" });
        return;
      }

      setToast({ message: "Register success", type: "success" });
      setTimeout(() => handleClose(), 1500);
    } catch (error) {
      setToast({ message: "Server error", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .reg-backdrop{position:fixed;inset:0;background:rgba(30,27,20,0);backdrop-filter:blur(0px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;transition:background 0.35s ease,backdrop-filter 0.35s ease;overflow-y:auto;}
        .reg-backdrop.open{background:rgba(30,27,20,0.55);backdrop-filter:blur(6px);}
        .reg-card{width:100%;max-width:820px;border-radius:24px;overflow:hidden;display:flex;min-height:520px;box-shadow:0 32px 80px rgba(0,0,0,0.25);transform:translateY(32px) scale(0.96);opacity:0;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),opacity 0.35s ease;margin:auto;}
        .reg-card.open{transform:translateY(0) scale(1);opacity:1;}
        .reg-close-btn{position:absolute;top:16px;right:16px;z-index:20;width:34px;height:34px;border-radius:50%;background:rgba(72,91,59,0.12);border:1.5px solid rgba(72,91,59,0.2);color:#485B3B;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s,transform 0.25s;}
        .reg-close-btn:hover{background:rgba(72,91,59,0.2);}
        .reg-input{width:100%;background:#fff;border-radius:50px;padding:12px 22px;font-size:14px;font-family:'DM Sans',sans-serif;color:#444;border:1.5px solid transparent;outline:none;box-shadow:0 1px 4px rgba(0,0,0,0.06);box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;}
        .reg-input:focus{border-color:#485B3B;box-shadow:0 0 0 3px rgba(72,91,59,0.12);}
        .reg-tab-btn{flex:1;padding:9px 0;border-radius:50px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:0.03em;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);}
        .reg-submit-btn{width:100%;background:#485B3B;color:#fff;border-radius:50px;padding:14px 0;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;letter-spacing:0.05em;border:none;cursor:pointer;margin-top:4px;box-shadow:0 4px 16px rgba(72,91,59,0.32);transition:background 0.2s,transform 0.15s,box-shadow 0.2s;}
        .reg-submit-btn:hover{background:#3a4c2e;box-shadow:0 6px 22px rgba(72,91,59,0.42);transform:translateY(-1px);}
        .reg-submit-btn:disabled{opacity:.72;cursor:not-allowed;transform:none;}
        .reg-fields{display:flex;flex-direction:column;gap:11px;animation:fadeSlide 0.25s ease forwards;}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className={`reg-backdrop ${animating ? "open" : ""}`} onClick={handleClose}>
        <div className={`reg-card ${animating ? "open" : ""}`} onClick={(event) => event.stopPropagation()} style={{ position: "relative" }}>
          <div style={{ flex: "0 0 40%", position: "relative", overflow: "hidden" }}>
            <img
              src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"
              alt="Tea"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.28) 100%)" }} />
          </div>

          <div
            style={{
              flex: 1,
              background: "#F0EDE3",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "40px 44px",
              boxSizing: "border-box",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button className="reg-close-btn" onClick={handleClose} type="button">
              X
            </button>

            <h1
              style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontSize: 40,
                fontWeight: 400,
                color: "#2e2e2e",
                margin: "0 0 22px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Register
            </h1>

            <div style={{ display: "flex", background: "#e4e0d6", borderRadius: 50, padding: 4, marginBottom: 20 }}>
              {["user", "merchant"].map((item) => (
                <button
                  key={item}
                  className="reg-tab-btn"
                  onClick={() => setTab(item)}
                  type="button"
                  style={{
                    background: tab === item ? "#fff" : "transparent",
                    color: tab === item ? "#333" : "#999",
                    boxShadow: tab === item ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {item === "user" ? "User" : "Merchant"}
                </button>
              ))}
            </div>

            <div className="reg-fields" key={tab}>
              {tab === "merchant" && (
                <>
                  <input className="reg-input" name="storeName" placeholder="Store name" value={merchantForm.storeName} onChange={handleMerchantChange} />
                  <input className="reg-input" name="storeAddress" placeholder="Store address" value={merchantForm.storeAddress} onChange={handleMerchantChange} />
                  <input className="reg-input" name="nationalId" placeholder="National ID" value={merchantForm.nationalId} onChange={handleMerchantChange} />
                </>
              )}

              {tab === "user" ? (
                <>
                  <input className="reg-input" name="username" placeholder="Username" value={userForm.username} onChange={handleUserChange} />
                  <input className="reg-input" name="email" placeholder="Email address" value={userForm.email} onChange={handleUserChange} />
                  <input className="reg-input" name="password" type="password" placeholder="Password" value={userForm.password} onChange={handleUserChange} />
                  <input className="reg-input" name="confirmPassword" type="password" placeholder="Confirm password" value={userForm.confirmPassword} onChange={handleUserChange} />
                </>
              ) : (
                <>
                  <input className="reg-input" name="username" placeholder="Username" value={merchantForm.username} onChange={handleMerchantChange} />
                  <input className="reg-input" name="email" placeholder="Email address" value={merchantForm.email} onChange={handleMerchantChange} />
                  <input className="reg-input" name="phone" placeholder="Phone number" value={merchantForm.phone} onChange={handleMerchantChange} />
                  <input className="reg-input" name="password" type="password" placeholder="Password" value={merchantForm.password} onChange={handleMerchantChange} />
                  <input className="reg-input" name="confirmPassword" type="password" placeholder="Confirm password" value={merchantForm.confirmPassword} onChange={handleMerchantChange} />
                </>
              )}

              <button className="reg-submit-btn" onClick={handleRegister} disabled={isSubmitting} type="button">
                {isSubmitting ? "Submitting..." : "Create account"}
              </button>
            </div>

            <p style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 18, fontFamily: "'DM Sans',sans-serif" }}>
              Already have an account?{" "}
              <button
                onClick={() => {
                  handleClose();
                  setTimeout(openLogin, 360);
                }}
                style={{ color: "#485B3B", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
