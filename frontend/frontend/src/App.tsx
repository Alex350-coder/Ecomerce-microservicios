import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {Home, Login, Register, Account, Checkout, Products} from './pages';
import {About, Contact, Support} from './pages/FastLinks';
import {Privacy, Returns, ReturnRequest, Terms} from './pages/Privacy';

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