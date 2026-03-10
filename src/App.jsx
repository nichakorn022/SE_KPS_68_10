import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './frontend/Home.jsx';
import Shop from './frontend/Shop/ShopHome.jsx';
import Events from './frontend/Event/EventPage.jsx';
import Login from './frontend/Login.jsx';
import Register from './frontend/Regist.jsx';
import EventDetails from './frontend/Event/Eventdetails.jsx';
import EventReview from "./frontend/Event/EventReview.jsx";
import ShopProfile from './frontend/Shop/ShopProfile.jsx';

export const AuthModalContext = createContext(null);
export const useAuthModal = () => useContext(AuthModalContext);

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin    = () => { setIsRegisterOpen(false); setIsLoginOpen(true); };
  const openRegister = () => { setIsLoginOpen(false); setIsRegisterOpen(true); };
  const closeAll     = () => { setIsLoginOpen(false); setIsRegisterOpen(false); };

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister }}>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/home"       element={<Home />} />
          <Route path="/shop"       element={<Shop />} />
          <Route path="/shop/:id"   element={<ShopProfile />} />
          <Route path="/events"     element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
          <Route path="/review/:id" element={<EventReview />} />
          
        </Routes>
        <Login    isOpen={isLoginOpen}    onClose={closeAll} />
        <Register isOpen={isRegisterOpen} onClose={closeAll} />
      </BrowserRouter>
    </AuthModalContext.Provider>
  );
}

export default App;