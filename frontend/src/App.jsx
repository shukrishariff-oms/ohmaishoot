import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import EventPage from './pages/EventPage';
import Shop from './pages/Shop';
import ShopReturn from './pages/ShopReturn';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<EventPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop/return" element={<ShopReturn />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;
