import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './frontend/Home.tsx';
import Shop from './frontend/Shop/ShopHome.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;