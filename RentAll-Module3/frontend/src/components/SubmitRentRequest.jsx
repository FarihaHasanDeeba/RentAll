import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './SubmitRentRequest.css'

export default function SubmitRentRequest() {
  const navigate = useNavigate()
  const [users,setUsers]=useState([]); const [items,setItems]=useState([])
  const [form,setForm]=useState({renterId:'',itemId:'',startDate:'',endDate:''})
  const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [success,setSuccess]=useState('')

  useEffect(()=>{ Promise.all([api.get('/api/catalog/users?role=RENTER'),api.get('/api/catalog/items')]).then(([u,i])=>{
    setUsers(u.data.users); setItems(i.data.items)
    const saved=localStorage.getItem('rentallUserId'); setForm(f=>({...f,renterId:saved || u.data.users[0]?._id || ''}))
  }).catch(e=>setError(e.response?.data?.message||'Could not load catalog.')) },[])

  const submit=async e=>{e.preventDefault();setError('');setSuccess('');setLoading(true)
    try { const r=await api.post('/api/rentals',form); localStorage.setItem('rentallUserId',form.renterId); setSuccess('Request created successfully.'); setTimeout(()=>navigate(`/rental/${r.data.rental._id}`),500) }
    catch(e){setError(e.response?.data?.message||'Failed to submit request.')} finally{setLoading(false)}
  }
  const item=items.find(x=>x._id===form.itemId)
  return <div className="container page"><h1>Submit Rent Request</h1><p>Choose a real renter, item and future rental period.</p>
    {error&&<div className="alert alert-error">{error}</div>}{success&&<div className="alert alert-success">{success}</div>}
    <form className="card form-grid" onSubmit={submit}>
      <label>Renter<select value={form.renterId} onChange={e=>setForm({...form,renterId:e.target.value})} required><option value="">Select renter</option>{users.map(u=><option key={u._id} value={u._id}>{u.name} • {u.email}</option>)}</select></label>
      <label>Item<select value={form.itemId} onChange={e=>setForm({...form,itemId:e.target.value})} required><option value="">Select item</option>{items.map(i=><option key={i._id} value={i._id}>{i.title} • ৳{i.rentalPricePerDay}/day</option>)}</select></label>
      <label>Start date<input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} required /></label>
      <label>End date<input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} required /></label>
      {item&&<div className="info-box"><b>{item.title}</b><br/>{item.description}<br/>Daily: ৳{item.rentalPricePerDay} • Deposit: ৳{item.securityDeposit}<br/>Owner: {item.ownerId?.name}</div>}
      <button className="btn btn-primary" disabled={loading}>{loading?'Submitting...':'Submit Request'}</button>
    </form>
  </div>
}
