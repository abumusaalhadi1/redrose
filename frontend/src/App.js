import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TableSelection from './pages/TableSelection';
import OrderScreen from './pages/OrderScreen';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TableSelection />} />
          <Route path="/order/:tableNumber" element={<OrderScreen />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;