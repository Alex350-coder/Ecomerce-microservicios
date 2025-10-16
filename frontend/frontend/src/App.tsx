import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { Checkout } from './pages/Checkout';
import { Products } from './pages/Products';
import { About } from './pages/FastLinks/About';
import { Contact } from './pages/FastLinks/Contact';
import { Support } from './pages/FastLinks/Support';
import { Privacy } from './pages/Privacy/Privacy';
import { Returns } from './pages/Privacy/Returns';
import { ReturnRequest } from './pages/Privacy/ReturnRequest';
import { Terms } from './pages/Privacy/Terms';

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
        <Route path="/About" element={<About />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Support" element={<Support />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Returns" element={<Returns />} />
        <Route path="/ReturnRequest" element={<ReturnRequest />} />
        <Route path="/Terms" element={<Terms />} />
      </Routes>
    </Router>
  );
}

export default App;