import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './components/Home'
import SubmitRentRequest from './components/SubmitRentRequest'
import RentalDashboard from './components/RentalDashboard'
import RentalDetails from './components/RentalDetails'
import './App.css'

export default function App() {
  return <BrowserRouter>
    <div className="app">
      <nav className="navbar"><div className="nav-container">
        <Link to="/" className="nav-logo">RentAll</Link>
        <div className="nav-links">
          <Link to="/">Home</Link><Link to="/submit-request">New Request</Link><Link to="/dashboard">Dashboard</Link>
        </div>
      </div></nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit-request" element={<SubmitRentRequest />} />
          <Route path="/dashboard" element={<RentalDashboard />} />
          <Route path="/rental/:rentalId" element={<RentalDetails />} />
        </Routes>
      </main>
      <footer className="footer">RentAll • Module 3: Rental Lifecycle Tracking</footer>
    </div>
  </BrowserRouter>
}
