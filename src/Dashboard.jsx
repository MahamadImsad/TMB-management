import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  // 1. Start loading as TRUE by default
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Admin')
  
  // Data States
  const [classes, setClasses] = useState([])
  const [allStudents, setAllStudents] = useState([])
  
  // View States
  const [selectedClass, setSelectedClass] = useState(null)
  const [activeTab, setActiveTab] = useState('students')
  const [viewStudent, setViewStudent] = useState(null)
  const [isArchiveView, setIsArchiveView] = useState(false)

  // Payment Modal States
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [feeStudent, setFeeStudent] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  // 2. Define the Fetch Function (Wrapped in useCallback)
  const fetchInitialData = useCallback(async () => {
    // NOTE: We DO NOT call setLoading(true) here to prevent the error.
    // The page starts loading=true by default.
    
    try {
        // Get Admin Name
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('admins').select('full_name').eq('id', user.id).single()
            if (data) setAdminName(data.full_name)
        }

        // Get Classes
        const { data: classData } = await supabase.from('classes').select('*').order('id')
        setClasses(classData || [])

        // Get Students
        const { data: studentData } = await supabase
            .from('students')
            .select('*, classes(class_name)')
            .order('full_name')
        
        setAllStudents(studentData || [])
    } catch (error) {
        console.error("Error fetching data:", error)
    } finally {
        // Only turn off loading when done
        setLoading(false)
    }
  }, [])

  // 3. Call it on load (With safety comment)
  useEffect(() => {
    fetchInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) 

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // --- ACTIONS ---

  const handleArchiveStudent = async (id, name) => {
    if(!window.confirm(`Are you sure ${name} has LEFT the school?`)) return;
    
    setLoading(true) // We manually show loader here because this is a button click
    
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('students').update({ status: 'left', left_date: today }).eq('id', id)
    
    if (error) {
        alert(error.message)
        setLoading(false)
    } else {
        fetchInitialData()
    }
  }

  const openFeeModal = (student) => {
    setFeeStudent(student)
    setPaymentAmount('')
    setFeeModalOpen(true)
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount) return

    setLoading(true) // Manually show loader

    const newTaken = Number(feeStudent.taken_fee) + Number(paymentAmount)
    const { error } = await supabase.from('students').update({ taken_fee: newTaken }).eq('id', feeStudent.id)
    
    if (error) {
        alert(error.message)
        setLoading(false)
    } else {
        alert("Payment Added!")
        setFeeModalOpen(false)
        fetchInitialData()
    }
  }

  // --- FILTER LOGIC ---
  const activeStudents = allStudents.filter(s => s.status !== 'left')
  const leftStudents = allStudents.filter(s => s.status === 'left')
  
  const currentViewList = isArchiveView 
    ? leftStudents 
    : (selectedClass ? activeStudents.filter(s => s.class_id === selectedClass.id) : [])

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : '-'

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-linear-to-r from-indigo-900 to-purple-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">THE MATHEMATICS BAZAR</h1>
                <p className="text-indigo-200 text-sm">Welcome, {adminName}</p>
            </div>
            <div className="flex gap-4">
                {(selectedClass || isArchiveView) && (
                    <button onClick={() => {setSelectedClass(null); setIsArchiveView(false)}} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">← Back</button>
                )}
                <button onClick={() => navigate('/add-student')} className="bg-yellow-400 text-indigo-900 px-5 py-2 rounded-lg font-bold hover:bg-yellow-300 shadow-md">+ New Admission</button>
                <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg text-sm">Logout</button>
            </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? <div className="text-center py-20 font-bold text-indigo-600 animate-pulse">Loading Data...</div> : (
            <>
                {!selectedClass && !isArchiveView && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up">
                        {classes.map((cls) => (
                            <div key={cls.id} onClick={() => setSelectedClass(cls)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border cursor-pointer transition hover:-translate-y-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-indigo-50 w-24 h-24 rounded-bl-full -mr-4 -mt-4"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl mb-4">📁</div>
                                    <h3 className="text-xl font-bold">{cls.class_name}</h3>
                                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mt-4 inline-block">
                                        {activeStudents.filter(s => s.class_id === cls.id).length} Active
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div onClick={() => setIsArchiveView(true)} className="bg-red-50 p-6 rounded-2xl shadow-sm hover:shadow-xl border border-red-100 cursor-pointer transition hover:-translate-y-1 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-4xl mb-4">⛔</div>
                                <h3 className="text-xl font-bold text-red-800">Left School</h3>
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mt-4 inline-block">{leftStudents.length} Archived</span>
                            </div>
                        </div>
                    </div>
                )}

                {(selectedClass || isArchiveView) && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-end mb-6 border-b pb-4">
                            <h2 className={`text-3xl font-bold ${isArchiveView ? 'text-red-800' : 'text-indigo-900'}`}>{isArchiveView ? 'Students Who Left' : selectedClass.class_name}</h2>
                            {!isArchiveView && (
                                <div className="flex bg-white rounded-lg p-1 border">
                                    <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded ${activeTab==='students'?'bg-indigo-100 text-indigo-700':''}`}>List</button>
                                    <button onClick={() => setActiveTab('fees')} className={`px-4 py-2 rounded ${activeTab==='fees'?'bg-yellow-100 text-yellow-800':''}`}>Fees</button>
                                </div>
                            )}
                        </div>

                        {activeTab === 'students' && (
                            <div className="bg-white rounded-xl shadow border overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold">
                                        <tr><th className="p-4">Name</th><th className="p-4">Father</th><th className="p-4">Mobile</th><th className="p-4">{isArchiveView ? 'Left Date' : 'Address'}</th><th className="p-4">Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {currentViewList.map((s) => (
                                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-bold flex gap-2 items-center">
                                                    {s.photo_url && <img src={s.photo_url} className="w-8 h-8 rounded-full object-cover" />}
                                                    {s.full_name}
                                                </td>
                                                <td className="p-4">{s.father_name}</td>
                                                <td className="p-4">{s.mobile_1}</td>
                                                <td className="p-4">{isArchiveView ? formatDate(s.left_date) : s.permanent_address}</td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={() => setViewStudent(s)} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">View</button>
                                                    {!isArchiveView && <button onClick={() => handleArchiveStudent(s.id, s.full_name)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Left</button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'fees' && !isArchiveView && (
                            <div className="bg-white rounded-xl shadow border overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-yellow-50 text-yellow-800 uppercase font-bold">
                                        <tr><th className="p-4">Name</th><th className="p-4">Total</th><th className="p-4">Paid</th><th className="p-4">Due</th><th className="p-4">Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {currentViewList.map((s) => (
                                            <tr key={s.id} className="border-b hover:bg-yellow-50/30">
                                                <td className="p-4 font-bold">{s.full_name}</td>
                                                <td className="p-4">₹{s.total_fee}</td>
                                                <td className="p-4 text-green-700 font-bold">₹{s.taken_fee}</td>
                                                <td className="p-4 text-red-600 font-bold">₹{s.remaining_fee}</td>
                                                <td className="p-4"><button onClick={() => openFeeModal(s)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">➕ Pay</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {viewStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-indigo-900 text-white p-6 flex justify-between">
                    <div className="flex gap-4 items-center">
                        {viewStudent.photo_url && <img src={viewStudent.photo_url} className="w-16 h-16 rounded-full border-2 border-white object-cover" />}
                        <h2 className="text-xl font-bold uppercase">{viewStudent.full_name}</h2>
                    </div>
                    <button onClick={() => setViewStudent(null)} className="text-2xl font-bold">×</button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block text-xs">Father</span> <b>{viewStudent.father_name}</b></div>
                    <div><span className="text-gray-500 block text-xs">Mobile</span> <b>{viewStudent.mobile_1}</b></div>
                    <div><span className="text-gray-500 block text-xs">Aadhar</span> <b>{viewStudent.aadhar_no}</b></div>
                    <div><span className="text-gray-500 block text-xs">Address</span> <b>{viewStudent.permanent_address}</b></div>
                </div>
            </div>
        </div>
      )}

      {feeModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Add Payment</h2>
                <p className="mb-4">Student: <b>{feeStudent?.full_name}</b></p>
                <input type="number" autoFocus className="w-full border p-2 rounded mb-4" placeholder="Amount" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} />
                <button onClick={handleAddPayment} className="w-full bg-green-600 text-white py-2 rounded font-bold mb-2">Confirm</button>
                <button onClick={()=>setFeeModalOpen(false)} className="w-full bg-gray-200 py-2 rounded font-bold">Cancel</button>
            </div>
         </div>
      )}
    </div>
  )
}
