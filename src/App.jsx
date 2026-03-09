import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './frontend/Home.tsx';
import Shop from './frontend/Shop/ShopHome.jsx';
import Event from './frontend/Event/EventPage.tsx';
import EventDetail from './frontend/Event/Eventdetails.tsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;