import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RentalListPage from './pages/RentalListPage';
import CheckoutPage from './pages/CheckoutPage';
import MockGatewayPage from './pages/MockGatewayPage';
import PaymentResultPage from './pages/PaymentResultPage';
import ReturnPage from './pages/ReturnPage';
import AgreementPage from './pages/AgreementPage';
import MailboxPage from './pages/MailboxPage';
import RemindersPage from './pages/RemindersPage';
import DisputePage from './pages/DisputePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminRentalPage from './pages/AdminRentalPage';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<RentalListPage />} />
          <Route path="/checkout/:rentalId" element={<CheckoutPage />} />
          <Route path="/mock-gateway/:tranId" element={<MockGatewayPage />} />
          <Route path="/payment/result/:tranId" element={<PaymentResultPage />} />
          <Route path="/return/:rentalId" element={<ReturnPage />} />
          <Route path="/agreement/:rentalId" element={<AgreementPage />} />
          <Route path="/mailbox" element={<MailboxPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/dispute/:rentalId" element={<DisputePage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/rentals/:rentalId" element={<AdminRentalPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
