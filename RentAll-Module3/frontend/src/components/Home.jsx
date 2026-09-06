import { Link } from 'react-router-dom'
export default function Home() {
  return <div className="container hero">
    <span className="eyebrow">MODULE 03</span>
    <h1>Rental Lifecycle Tracking</h1>
    <p>Complete workflow for rental requests, status transitions, map-based handover, OTP verification, and damage/escrow handling.</p>
    <div className="hero-actions"><Link className="btn btn-primary" to="/submit-request">Create Rental Request</Link><Link className="btn btn-secondary" to="/dashboard">Open Dashboard</Link></div>
    <div className="feature-grid">
      {[
        ['11','Submit Rent Request','Real DB validation, date conflict checking and automatic pricing.'],
        ['12','Status Workflow','Controlled lifecycle with role-aware transitions and history.'],
        ['13','Geographic Exchange','Pickup radius, Google Maps geocoding and public handover spot.'],
        ['14','Handover Handshake','Expiring, rate-limited OTP with optional Twilio SMS.'],
        ['15','Damage Logger','Incident records, automatic escrow freeze and deposit resolution.']
      ].map(([n,t,d]) => <div className="card" key={n}><b>Feature {n}</b><h3>{t}</h3><p>{d}</p></div>)}
    </div>
  </div>
}
