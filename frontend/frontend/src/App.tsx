import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { Checkout } from './pages/Checkout';
import { Products } from './pages/Products';
import './styles/globals.css';
import './styles/variables.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Account" element={<Account />} />
        <Route path="/Checkout" element={<Checkout />} />
        <Route path="/Products" element={<Products />} />
      </Routes>
    </Router>
  );
}

export default App;