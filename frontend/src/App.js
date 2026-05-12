import './App.css';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import TableSelection from './pages/TableSelection';
import OrderScreen from './pages/OrderScreen';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from './components/ui/sonner';

function App() {
  const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<TableSelection />} />
          <Route path="/order/:tableNumber" element={<OrderScreen />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
