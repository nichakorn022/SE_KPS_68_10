import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './frontend/Home.tsx';
import Shop from './frontend/Shop/ShopHome.jsx';
import Login from './frontend/Login.jsx'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;