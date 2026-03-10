import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './frontend/Home.jsx';
import Shop from './frontend/Shop/ShopHome.jsx';
import Events from './frontend/Event/EventPage.jsx';
import EventDetail from './frontend/Event/Eventdetails.jsx';
import Login from './frontend/Login.jsx';
import Register from './frontend/Regist.jsx';
import ShopProfile from './frontend/Shop/ShopProfile.jsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ShopProfile />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
