/* cspell:disable */
import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) 
  const [showContact, setShowContact] = useState(false) 

  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    
    if (isSignUp && (!formData.fullName || !formData.contact)) {
        alert("Please fill in all details (Name and Contact are mandatory).")
        return
    }

    setLoading(true)

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            // This ensures the user comes back to the dashboard after clicking the link
            emailRedirectTo: window.location.origin + '/dashboard'
        }
      })

      if (error) {
        alert(error.message)
      } else {
        // 1. Save Admin Profile
        if (data?.user) {
            const { error: profileError } = await supabase.from('admins').insert([
                {
                    id: data.user.id,
                    full_name: formData.fullName,
                    contact_number: formData.contact
                }
            ])
            if (profileError) console.error(profileError)
        }

        // 2. Check if Email Confirmation is required
        if (data.user && !data.session) {
            alert('Registration Successful! ✉️ Please check your email to verify your account before logging in.')
            setIsSignUp(false) // Switch back to login view
        } else {
            // If confirmation is OFF in Supabase, just log in
            alert('Account created! Logging you in...')
            navigate('/dashboard')
        }
      }
    } else {
      // --- LOGIN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        // Specific error message for unverified emails
        if (error.message.includes("Email not confirmed")) {
            alert("Please verify your email address before logging in. Check your inbox.")
        } else {
            alert(error.message)
        }
      } else {
        navigate('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-purple-500 opacity-20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-yellow-500 opacity-20 rounded-full blur-[100px]"></div>
      </div>

      {/* --- TOP NAVBAR --- */}
      <nav className="w-full p-6 flex justify-between items-center z-20 absolute top-0 left-0">
        
        {/* LEFT: Home Button */}
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/20 font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </button>

        {/* RIGHT: Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => setShowContact(true)}
            className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/20 font-semibold"
          >
            Contact
          </button>
          
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="bg-yellow-400 text-indigo-900 px-5 py-2 rounded-full font-bold shadow-lg hover:bg-yellow-300 hover:scale-105 transition"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </nav>

      {/* --- CENTER CONTENT --- */}
      <div className="grow flex flex-col items-center justify-center p-4 z-10 mt-16">
        
        {/* 1. BIG CENTER HEADING */}
        <div className="text-center mb-8 animate-fade-in-down">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-yellow-100 to-yellow-400 drop-shadow-2xl mb-4 tracking-tight">
                THE MATHEMATICS BAZAR
            </h1>
            <div className="inline-block bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                <p className="text-gray-200 text-sm md:text-lg font-light tracking-wide">
                    📍 Chainiya Chowk, Katkenwa, East Champaran (845301)
                </p>
            </div>
        </div>

        {/* 2. LOGIN / SIGNUP CARD */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md text-white relative animate-fade-in-up">
          
          <div className="mb-6 text-center border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? 'Create Admin Account' : 'Admin Dashboard Login'}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Sign Up Fields */}
            {isSignUp && (
                <>
                    <div>
                        <input name="fullName" type="text" placeholder="Full Name" required
                            value={formData.fullName} onChange={handleChange}
                            className="input-field-custom" />
                    </div>
                    <div>
                        <input name="contact" type="text" placeholder="Contact Number" required
                            value={formData.contact} onChange={handleChange}
                            className="input-field-custom" />
                    </div>
                </>
            )}

            {/* Email & Pass */}
            <div>
              <input name="email" type="email" placeholder="Email Address" required
                value={formData.email} onChange={handleChange}
                className="input-field-custom" />
            </div>
            
            <div>
              <input name="password" type="password" placeholder="Password" required
                value={formData.password} onChange={handleChange}
                className="input-field-custom" />
            </div>

            <button 
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-linear-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:from-yellow-400 hover:to-orange-500 transition transform active:scale-95 text-lg tracking-wide">
              {loading ? 'Processing...' : (isSignUp ? 'Register Now' : 'Login Securely')}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            School Management System &copy; 2024
          </p>

        </div>
      </div>

      {/* --- CONTACT MODAL --- */}
      {showContact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full relative animate-bounce-in border-4 border-yellow-400">
            <button 
              onClick={() => setShowContact(false)}
              className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-center mb-6 text-indigo-900">Contact Us</h3>

            <div className="space-y-4">
              <div className="bg-linear-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-500 uppercase">Director</p>
                <p className="font-bold text-xl text-gray-800">Ashique Roshan</p>
                <p className="text-sm text-blue-600 font-medium">📞 9999xxxxxxxx</p>
              </div>

              <div className="bg-linear-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
                <p className="text-xs font-bold text-pink-500 uppercase">Principal</p>
                <p className="font-bold text-xl text-gray-800">Md. Shani Ansari</p>
              </div>
            </div>

            <button 
              onClick={() => setShowContact(false)}
              className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS for this page */}
      <style>{`
        .input-field-custom {
            width: 100%;
            padding: 14px 20px;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 16px;
            outline: none;
            transition: all 0.3s;
        }
        .input-field-custom:focus {
            background-color: rgba(0, 0, 0, 0.3);
            border-color: #FBBF24;
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .input-field-custom::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out; }
      `}</style>
    </div>
  )
}
