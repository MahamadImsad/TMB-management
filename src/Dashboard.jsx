/* cspell:disable */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Admin')
  
  // Data
  const [classes, setClasses] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [examResults, setExamResults] = useState([])
  
  // Views
  const [selectedClass, setSelectedClass] = useState(null)
  const [activeTab, setActiveTab] = useState('students') 
  const [viewStudent, setViewStudent] = useState(null)
  const [isArchiveView, setIsArchiveView] = useState(false)

  // Payment States
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [feeStudent, setFeeStudent] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [studentTransactions, setStudentTransactions] = useState([]) 
  const [lastTransaction, setLastTransaction] = useState(null)

  // Exam States
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultStudent, setResultStudent] = useState(null)
  const [marks, setMarks] = useState({ exam_name: 'Annual', math: '', science: '', english: '', hindi: '', sst: '' })

  const fetchInitialData = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('admins').select('full_name').eq('id', user.id).single()
            if (data) setAdminName(data.full_name)
        }

        const { data: classData } = await supabase.from('classes').select('*').order('id')
        setClasses(classData || [])

        const { data: studentData } = await supabase.from('students').select('*, classes(class_name)').order('full_name')
        setAllStudents(studentData || [])

        const { data: resultsData } = await supabase.from('exam_results').select('*')
        setExamResults(resultsData || [])

    } catch (error) { console.error(error) } 
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/') }

  // --- ACTIONS ---

  const handleArchiveStudent = async (id, name) => {
    if(!window.confirm(`Are you sure ${name} has LEFT the school?`)) return;
    setLoading(true)
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('students').update({ status: 'left', left_date: today }).eq('id', id)
    fetchInitialData()
  }

  // --- FEE & RECEIPT LOGIC ---
  const openFeeModal = async (student) => { 
      setFeeStudent(student); 
      setPaymentAmount(''); 
      setSelectedMonth('');
      setLastTransaction(null);
      
      const { data } = await supabase
        .from('fee_transactions')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        
      setStudentTransactions(data || [])
      setFeeModalOpen(true); 
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || !selectedMonth) {
        alert("Please select a month and enter amount.")
        return
    }
    setLoading(true)

    const newTaken = Number(feeStudent.taken_fee) + Number(paymentAmount)
    await supabase.from('students').update({ taken_fee: newTaken }).eq('id', feeStudent.id)

    const { data: transaction } = await supabase.from('fee_transactions').insert([{
        student_id: feeStudent.id, 
        amount: paymentAmount, 
        payment_month: selectedMonth, 
        remarks: `Tuition Fee for ${selectedMonth}`
    }]).select().single()

    setLastTransaction(transaction) 
    setLoading(false)
    fetchInitialData() 
  }

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-area').innerHTML;
    const win = window.open('', '', 'height=500,width=800');
    win.document.write('<html><head><title>Receipt</title>');
    win.document.write('<style>body{font-family:sans-serif; text-align:center;} .receipt{border:2px solid black; padding:20px; margin:20px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:8px; text-align:left;} .header{margin-bottom:20px;}</style>');
    win.document.write('</head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }

  // --- EXAM RESULT LOGIC ---
  const openResultModal = (student) => { setResultStudent(student); setMarks({ exam_name: 'Annual', math: '', science: '', english: '', hindi: '', sst: '' }); setResultModalOpen(true); }

  const handleSaveResult = async (e) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('exam_results').insert([{
        student_id: resultStudent.id, ...marks
    }])
    alert("Result Saved!")
    setResultModalOpen(false)
    fetchInitialData()
  }

  const activeStudents = allStudents.filter(s => s.status !== 'left')
  const leftStudents = allStudents.filter(s => s.status === 'left')
  const currentViewList = isArchiveView ? leftStudents : (selectedClass ? activeStudents.filter(s => s.class_id === selectedClass.id) : [])
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : '-'

  return (
    <div className="min-h-screen w-full relative bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      
      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-75 md:w-125 h-75 md:h-125 bg-purple-200 rounded-full blur-[80px] md:blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-75 md:w-125 h-75 md:h-125 bg-indigo-200 rounded-full blur-[80px] md:blur-[120px] opacity-40 animate-pulse delay-700"></div>
      </div>

      {/* --- RESPONSIVE HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 4.168 6.253v13C4.168 19.383 5.761 19.8 7.5 19.8s3.332-.417 3.332-1.547m4.168-12.003c1.166-.776 2.752-1.253 4.498-1.253 1.746 0 3.332.477 4.498 1.253v13C19.832 19.383 18.246 19.8 16.5 19.8c-1.746 0-3.332-.417-3.332-1.547m0-13v13" /></svg>
                </div>
                <div>
                    <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight text-center md:text-left">THE MATHEMATICS BAZAR</h1>
                    <p className="text-[10px] md:text-xs text-indigo-500 font-bold uppercase tracking-widest text-center md:text-left">Dashboard • {adminName}</p>
                </div>
            </div>
            
            {/* Buttons Section */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full md:w-auto">
                {(selectedClass || isArchiveView) && (
                    <button onClick={() => {setSelectedClass(null); setIsArchiveView(false)}} 
                        className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1">
                        ← Back
                    </button>
                )}
                <button onClick={() => navigate('/add-student')} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition transform active:scale-95 flex items-center gap-1">
                    <span>+</span> Admission
                </button>
                <button onClick={handleLogout} 
                    className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-medium text-sm border border-transparent hover:border-red-100">
                    Logout
                </button>
            </div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="text-indigo-600 font-medium animate-pulse">Loading School Data...</div>
            </div>
        ) : (
            <>
                {/* 1. FOLDER GRID VIEW */}
                {!selectedClass && !isArchiveView && (
                    <div className="animate-fade-in-up">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 gap-4">
                            <h2 className="text-2xl font-bold text-slate-800">Active Classes</h2>
                            <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                                Total Students: <span className="font-bold text-indigo-600">{activeStudents.length}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {classes.map((cls) => {
                                const count = activeStudents.filter(s => s.class_id === cls.id).length
                                return (
                                    <div key={cls.id} onClick={() => setSelectedClass(cls)}
                                        className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm hover:shadow-xl border border-white/50 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-linear-to-bl from-indigo-50 to-transparent w-20 h-20 rounded-bl-full transition group-hover:scale-110"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">ID: {cls.id}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition">{cls.class_name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                <span className="text-sm text-slate-500">{count} Students</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div onClick={() => setIsArchiveView(true)} 
                                className="group bg-red-50/50 backdrop-blur-sm p-5 rounded-2xl border border-red-100 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 md:p-3 bg-red-100 text-red-600 rounded-xl">
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-red-800">Archive</h3>
                                </div>
                                <p className="text-sm text-red-600 font-medium">{leftStudents.length} Left Students</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CLASS DETAIL VIEW (RESPONSIVE TABLE) */}
                {(selectedClass || isArchiveView) && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4 md:pb-6">
                            <div>
                                <h2 className={`text-2xl md:text-3xl font-extrabold ${isArchiveView ? 'text-red-700' : 'text-slate-800'}`}>
                                    {isArchiveView ? '⛔ Students Who Left' : selectedClass.class_name}
                                </h2>
                                <p className="text-slate-500 mt-1 text-sm">Managing {currentViewList.length} records</p>
                            </div>
                            
                            {!isArchiveView && (
                                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex w-full md:w-auto overflow-x-auto">
                                    {['students', 'fees', 'results'].map((tab) => (
                                        <button 
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                                activeTab === tab 
                                                ? 'bg-slate-800 text-white shadow-md' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            {tab === 'students' && '📄 List'}
                                            {tab === 'fees' && '🧾 Fees'}
                                            {tab === 'results' && '📊 Results'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TABLE CONTAINER - SCROLLABLE ON MOBILE */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto w-full"> 
                                <table className="w-full text-left text-sm whitespace-nowrap"> 
                                    <thead className={`uppercase text-xs font-bold tracking-wider ${
                                        activeTab === 'results' ? 'bg-purple-50 text-purple-900' : 
                                        activeTab === 'fees' ? 'bg-yellow-50 text-yellow-900' : 
                                        'bg-slate-50 text-slate-700'
                                    }`}>
                                        <tr>
                                            <th className="p-4 md:p-5 pl-6">Student Name</th>
                                            {activeTab === 'students' && <><th className="p-4 md:p-5">Father</th><th className="p-4 md:p-5">Mobile</th><th className="p-4 md:p-5">{isArchiveView?'Left Date':'Address'}</th></>}
                                            {activeTab === 'fees' && <><th className="p-4 md:p-5">Total Fee</th><th className="p-4 md:p-5">Paid</th><th className="p-4 md:p-5">Pending</th><th className="p-4 md:p-5">Action</th></>}
                                            {activeTab === 'results' && <><th className="p-4 md:p-5">Last Exam</th><th className="p-4 md:p-5">Percentage</th><th className="p-4 md:p-5">Grade</th></>}
                                            <th className="p-4 md:p-5 text-right pr-6 min-w-30">Options</th> 
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentViewList.map((s) => {
                                            const res = examResults.find(r => r.student_id === s.id)
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-4 md:p-5 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            {s.photo_url ? (
                                                                <img src={s.photo_url} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                                            ) : (
                                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                    {s.full_name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-900">{s.full_name}</div>
                                                                {activeTab !== 'students' && <div className="text-xs text-slate-400">ID: {s.id}</div>}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {activeTab === 'students' && (
                                                        <>
                                                            <td className="p-4 md:p-5 text-slate-600">{s.father_name}</td>
                                                            <td className="p-4 md:p-5 font-mono text-slate-500">{s.mobile_1}</td>
                                                            <td className="p-4 md:p-5">
                                                                {isArchiveView ? (
                                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">{formatDate(s.left_date)}</span>
                                                                ) : (
                                                                    <span className="text-slate-500 text-xs truncate max-w-37.5 block" title={s.permanent_address}>{s.permanent_address}</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}

                                                    {activeTab === 'fees' && (
                                                        <>
                                                            <td className="p-4 md:p-5 font-medium">₹{s.total_fee}</td>
                                                            <td className="p-4 md:p-5 text-green-600 font-bold">₹{s.taken_fee}</td>
                                                            <td className="p-4 md:p-5"><span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">₹{s.remaining_fee}</span></td>
                                                            <td className="p-4 md:p-5">
                                                                <button onClick={() => openFeeModal(s)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition">
                                                                    View / Pay
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}

                                                    {activeTab === 'results' && (
                                                        <>
                                                            <td className="p-4 md:p-5">{res ? res.exam_name : <span className="text-slate-300">-</span>}</td>
                                                            <td className="p-4 md:p-5 font-bold text-slate-800">{res ? res.percentage + '%' : '-'}</td>
                                                            <td className="p-4 md:p-5">
                                                                {res ? (
                                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.percentage >= 60 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                        {res.percentage >= 60 ? 'Grade A' : 'Grade B'}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="p-4 md:p-5 pr-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {activeTab === 'results' ? (
                                                                <button onClick={() => openResultModal(s)} className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-md text-xs font-bold border border-purple-200 transition">
                                                                    {res ? 'Update' : 'Add Marks'}
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => setViewStudent(s)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-bold transition shadow-sm whitespace-nowrap">
                                                                        View
                                                                    </button>
                                                                    {!isArchiveView && (
                                                                        <button onClick={() => handleArchiveStudent(s.id, s.full_name)} className="bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1.5 rounded-md text-xs transition border border-red-100 shrink-0" title="Archive">
                                                                            {/* FIXED ICON: Added viewBox and proper sizing */}
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>

      {/* --- MODALS (Responsive) --- */}

      {viewStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        {/* Responsive Image size */}
                        <img src={viewStudent.photo_url || 'https://via.placeholder.com/150'} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 object-cover" />
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold">{viewStudent.full_name}</h2>
                            <p className="text-slate-400 text-xs md:text-sm">Class: {selectedClass?.class_name} • ID: {viewStudent.id}</p>
                        </div>
                    </div>
                    <button onClick={() => setViewStudent(null)} className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition">✕</button>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-sm">
                    <div className="space-y-3 md:space-y-4">
                        <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b pb-2">Family Info</h3>
                        <div><span className="block text-slate-500 text-xs">Father's Name</span> <span className="font-medium text-slate-800">{viewStudent.father_name}</span></div>
                        <div><span className="block text-slate-500 text-xs">Mother's Name</span> <span className="font-medium text-slate-800">{viewStudent.mother_name}</span></div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b pb-2">Contact Info</h3>
                        <div><span className="block text-slate-500 text-xs">Mobile</span> <span className="font-medium text-slate-800">{viewStudent.mobile_1}</span></div>
                        <div><span className="block text-slate-500 text-xs">Address</span> <span className="font-medium text-slate-800">{viewStudent.permanent_address}</span></div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 text-center border-t">
                    <button onClick={() => setViewStudent(null)} className="text-slate-500 font-bold hover:text-slate-800 transition">Close Profile</button>
                </div>
            </div>
        </div>
      )}

      {/* FEE MODAL */}
      {feeModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh]">
                {!lastTransaction ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Fee Payment</h2>
                                <p className="text-slate-500 text-sm">Student: {feeStudent?.full_name}</p>
                            </div>
                            <button onClick={()=>setFeeModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full">✕</button>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
                            {MONTHS.map((m) => {
                                const isPaid = studentTransactions.some(t => t.payment_month === m)
                                return (
                                    <div key={m} onClick={() => !isPaid && setSelectedMonth(m)}
                                        className={`border rounded-xl p-2 md:p-3 text-center cursor-pointer transition-all ${
                                            isPaid 
                                            ? 'bg-green-50 border-green-200 text-green-700 cursor-default opacity-60' 
                                            : (selectedMonth === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white hover:border-indigo-300 text-slate-600')
                                        }`}>
                                        <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider truncate">{m}</div>
                                        <div className="text-[9px] md:text-[10px] mt-1 font-medium">{isPaid ? 'PAID' : 'DUE'}</div>
                                    </div>
                                )
                            })}
                        </div>

                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Month</label><input value={selectedMonth} readOnly className="w-full bg-slate-100 border-none p-3 rounded-lg font-bold text-slate-700" placeholder="Select above" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label><input type="number" autoFocus required className="w-full border border-slate-300 p-3 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} /></div>
                            </div>
                            <button disabled={!selectedMonth} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                {selectedMonth ? `Confirm Payment` : 'Select Month'}
                            </button>
                        </form>

                        <div className="mt-8">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Recent Transactions</h3>
                            <div className="border rounded-xl overflow-hidden">
                                {studentTransactions.length === 0 ? <p className="p-4 text-center text-slate-400 text-sm">No history yet.</p> : 
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Month</th><th className="p-3 text-right">Amount</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {studentTransactions.slice(0,5).map(t => (
                                                <tr key={t.id}><td className="p-3 text-slate-500">{formatDate(t.created_at)}</td><td className="p-3 font-medium text-slate-800">{t.payment_month}</td><td className="p-3 text-right font-bold text-green-600">₹{t.amount}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                }
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500 mb-8">Receipt generated for <b>{lastTransaction.payment_month}</b></p>
                        
                        {/* Hidden Receipt Template */}
                        <div id="receipt-area" className="hidden">
                            <div className="receipt">
                                <div className="header"><h1>THE MATHEMATICS BAZAR</h1><p>Chainiya Chowk, East Champaran</p><hr/><h3>FEE RECEIPT</h3></div>
                                <p><b>Date:</b> {new Date().toLocaleDateString()}</p>
                                <p><b>Student Name:</b> {feeStudent?.full_name}</p>
                                <p><b>Class:</b> {selectedClass?.class_name}</p><br/>
                                <table border="1" cellPadding="10" style={{width:'100%'}}>
                                    <tr><th>Description</th><th>Amount</th></tr>
                                    <tr><td>Tuition Fee ({lastTransaction.payment_month})</td><td>₹{lastTransaction.amount}</td></tr>
                                    <tr><td><b>TOTAL</b></td><td><b>₹{lastTransaction.amount}</b></td></tr>
                                </table><br/><p>Signature: _________________</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 justify-center">
                            <button onClick={printReceipt} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">🖨️ Print Receipt</button>
                            <button onClick={()=>setFeeModalOpen(false)} className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition">Close</button>
                        </div>
                    </div>
                )}
            </div>
         </div>
      )}

      {/* EXAM MODAL */}
      {resultModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-fade-in-up">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Update Marks</h2>
                <form onSubmit={handleSaveResult} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Math</label><input type="number" className="w-full border p-3 rounded-lg font-bold" required onChange={e=>setMarks({...marks, math: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Science</label><input type="number" className="w-full border p-3 rounded-lg font-bold" required onChange={e=>setMarks({...marks, science: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">English</label><input type="number" className="w-full border p-3 rounded-lg font-bold" required onChange={e=>setMarks({...marks, english: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Hindi</label><input type="number" className="w-full border p-3 rounded-lg font-bold" required onChange={e=>setMarks({...marks, hindi: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">SST</label><input type="number" className="w-full border p-3 rounded-lg font-bold" required onChange={e=>setMarks({...marks, sst: e.target.value})} /></div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">Save Result</button>
                        <button type="button" onClick={()=>setResultModalOpen(false)} className="px-6 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  )
}
