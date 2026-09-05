import { useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const statuses=['ALL','REQUESTED','ACCEPTED','CHECKED_OUT','IN_USE','RETURNED','DAMAGE_REPORTED','CHECKED_APPROVED','CLOSED','REJECTED']
export default function RentalDashboard(){
 const [users,setUsers]=useState([]),[userId,setUserId]=useState(localStorage.getItem('rentallUserId')||''),[rentals,setRentals]=useState([]),[filter,setFilter]=useState('ALL'),[error,setError]=useState('')
 const load=async id=>{if(!id)return;try{const r=await api.get(`/api/rentals/user/${id}`);setRentals(r.data.rentals)}catch(e){setError(e.response?.data?.message||'Failed to load rentals.')}}
 useEffect(()=>{api.get('/api/catalog/users').then(r=>{setUsers(r.data.users);const id=userId||r.data.users[0]?._id||'';setUserId(id);if(id){localStorage.setItem('rentallUserId',id);load(id)}}).catch(e=>setError('Could not load users.'))},[])
 useEffect(()=>{if(userId)load(userId)},[userId])
 const visible=filter==='ALL'?rentals:rentals.filter(r=>r.status===filter)
 return <div className="container page"><div className="page-head"><div><h1>Rental Dashboard</h1><p>Switch between demo users to test renter/lender workflows.</p></div><Link className="btn btn-primary" to="/submit-request">+ New Request</Link></div>
 {error&&<div className="alert alert-error">{error}</div>}
 <div className="card toolbar"><label>Current user<select value={userId} onChange={e=>{setUserId(e.target.value);localStorage.setItem('rentallUserId',e.target.value)}}>{users.map(u=><option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}</select></label>
 <div className="filters">{statuses.map(s=><button key={s} className={`chip ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>{s.replaceAll('_',' ')}</button>)}</div></div>
 <div className="list">{visible.map(r=><div className="card rental-card" key={r._id}><div><h3>{r.itemId?.title||'Item'}</h3><span className={`status ${r.status}`}>{r.status.replaceAll('_',' ')}</span></div><p><b>Renter:</b> {r.renterId?.name} &nbsp; <b>Lender:</b> {r.lenderId?.name}</p><p>{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()} • ৳{r.rentalAmount} + ৳{r.securityDeposit} deposit</p><p>Deposit: <b>{r.depositStatus}</b> • Payment: <b>{r.paymentStatus}</b></p><Link className="btn btn-secondary" to={`/rental/${r._id}`}>Manage</Link></div>)}</div>
 {!visible.length&&<div className="card empty">No rentals found.</div>}</div>
}
