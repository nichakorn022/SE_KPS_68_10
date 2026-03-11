import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from '../App';
import { apiUrl } from "../lib/api";

export default function Login({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();
  const { openRegister } = useAuthModal();

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
    setTimeout(() => { setVisible(false); onClose?.(); }, 350);
  };

   const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    const data = await res.json();
    console.log("res.ok:", res.ok, "data:", data); // ← ดูว่า login สำเร็จไหม
    if (res.ok) {
      console.log("token:", data.token); // ← ดูว่ามี token ไหม
      onLoginSuccess(data.token);
      console.log("onLoginSuccess called"); // ← ดูว่า function ถูกเรียกไหม
      navigate("/");
    } else { 
      alert(data.message); 
    }
  } catch (err) { 
    console.error(err); alert("Server error"); 
  }
};

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .modal-backdrop{position:fixed;inset:0;background:rgba(30,27,20,0);backdrop-filter:blur(0px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;transition:background 0.35s ease,backdrop-filter 0.35s ease;}
        .modal-backdrop.open{background:rgba(30,27,20,0.55);backdrop-filter:blur(6px);}
        .modal-card{width:100%;max-width:860px;border-radius:24px;overflow:hidden;display:flex;min-height:500px;box-shadow:0 32px 80px rgba(0,0,0,0.25);transform:translateY(32px) scale(0.96);opacity:0;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),opacity 0.35s ease;}
        .modal-card.open{transform:translateY(0) scale(1);opacity:1;}
        .close-btn{position:absolute;top:18px;right:18px;z-index:10;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.35);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s,transform 0.2s;backdrop-filter:blur(4px);}
        .close-btn:hover{background:rgba(255,255,255,0.32);}
        .login-input{width:100%;background:#fff;border-radius:50px;padding:13px 22px;font-size:14px;font-family:'DM Sans',sans-serif;color:#444;border:1.5px solid transparent;outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,0.06);}
        .login-input:focus{border-color:#485B3B;box-shadow:0 0 0 3px rgba(72,91,59,0.12);}
        .login-btn{width:100%;background:#485B3B;color:#fff;border-radius:50px;padding:14px 0;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;letter-spacing:0.05em;border:none;cursor:pointer;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;box-shadow:0 4px 16px rgba(72,91,59,0.3);}
        .login-btn:hover{background:#3a4c2e;box-shadow:0 6px 22px rgba(72,91,59,0.42);transform:translateY(-1px);}
      `}</style>
      <div className={`modal-backdrop ${animating?"open":""}`} onClick={handleClose}>
        <div className={`modal-card ${animating?"open":""}`} onClick={e=>e.stopPropagation()} style={{position:"relative"}}>
          <button className="close-btn" onClick={handleClose}>✕</button>
          <div style={{width:"44%",flexShrink:0,background:"#F0EDE3",display:"flex",flexDirection:"column",justifyContent:"center",padding:"52px 44px",boxSizing:"border-box"}}>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:42,fontWeight:400,color:"#2e2e2e",margin:"0 0 32px 0",letterSpacing:"-0.5px"}}>Login</h1>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input className="login-input" type="text" placeholder="Email" value={username} onChange={e=>setUsername(e.target.value)} />
              <input className="login-input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin(e)} />
              <button className="login-btn" onClick={handleLogin}>Login</button>
            </div>
            <p style={{textAlign:"center",color:"#aaa",fontSize:13,marginTop:20,fontFamily:"'DM Sans',sans-serif"}}>
              Don't have an account?{" "}
              <button onClick={()=>{handleClose();setTimeout(openRegister,360);}} style={{color:"#485B3B",fontWeight:500,background:"none",border:"none",cursor:"pointer",padding:0,fontSize:13}}>Sign up</button>
            </p>
          </div>
          <div style={{flex:1,position:"relative",overflow:"hidden"}}>
            <img src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80" alt="Tea" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />
            <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.15) 100%)"}} />
            <div style={{position:"absolute",bottom:36,left:32,right:32,color:"#fff"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400,margin:0,lineHeight:1.5,textShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
                "Good tea, good friends,<br />good life."
              </p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,margin:"8px 0 0 0",opacity:0.7,letterSpacing:"0.05em"}}>— Our Promise </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
