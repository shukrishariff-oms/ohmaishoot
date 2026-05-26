import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import EventPage from './pages/EventPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<EventPage />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;
