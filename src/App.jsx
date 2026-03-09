import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './frontend/Home.tsx';
import Shop from './frontend/Shop/ShopHome.jsx';
import Events from './frontend/Event/EventPage.tsx';
import EventDetail from './frontend/Event/Eventdetails.tsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;