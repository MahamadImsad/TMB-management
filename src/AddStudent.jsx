import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AddStudent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [classList, setClassList] = useState([])

  const [formData, setFormData] = useState({
    full_name: '', aadhar_no: '', blood_group: '', dob: '', gender: 'Male', photo_url: '',
    father_name: '', father_occupation: '', father_designation: '', father_dept: '',
    mother_name: '', mother_occupation: '', mother_designation: '', mother_dept: '',
    class_id: '', previous_school: '', relative_name: '',
    perm_house: '', perm_mohalla: '', perm_post: '', perm_dist: '',
    temp_house: '', temp_mohalla: '', temp_post: '', temp_dist: '',
    mobile_1: '', mobile_2: '', nationality: 'Indian', state: 'Bihar', home_district: '', mother_tongue: 'Hindi',
    religion: '', caste: '', category: 'General', guardian_name: '', guardian_relation: '',
    total_fee: '', taken_fee: ''
  })

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({data}) => setClassList(data || []))
  }, [])

  const handlePhotoUpload = async (e) => {
    try {
        setUploading(true)
        const file = e.target.files[0]
        if (!file) return
        const filePath = `${Date.now()}.${file.name.split('.').pop()}`
        const { error } = await supabase.storage.from('student-photos').upload(filePath, file)
        if (error) throw error
        const { data } = supabase.storage.from('student-photos').getPublicUrl(filePath)
        setFormData(prev => ({ ...prev, photo_url: data.publicUrl }))
    } catch (err) { alert(err.message) } 
    finally { setUploading(false) }
  }

  const handleCopyAddress = (e) => {
    if (e.target.checked) {
        setFormData(prev => ({ ...prev, temp_house: prev.perm_house, temp_mohalla: prev.perm_mohalla, temp_post: prev.perm_post, temp_dist: prev.perm_dist }))
    } else {
        setFormData(prev => ({ ...prev, temp_house: '', temp_mohalla: '', temp_post: '', temp_dist: '' }))
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const handleClassChange = (e) => {
    const cid = e.target.value
    const cls = classList.find(c => c.id.toString() === cid)
    setFormData({ ...formData, class_id: cid, total_fee: cls ? cls.standard_fee : formData.total_fee })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const finalData = {
        full_name: formData.full_name, photo_url: formData.photo_url,
        aadhar_no: formData.aadhar_no, blood_group: formData.blood_group, dob: formData.dob, gender: formData.gender,
        father_name: formData.father_name, father_occupation: `${formData.father_occupation} (Desig: ${formData.father_designation}, Dept: ${formData.father_dept})`,
        mother_name: formData.mother_name, mother_occupation: `${formData.mother_occupation} (Desig: ${formData.mother_designation}, Dept: ${formData.mother_dept})`,
        class_id: formData.class_id, previous_school: formData.previous_school, relative_name: formData.relative_name,
        permanent_address: `House: ${formData.perm_house}, Mohalla: ${formData.perm_mohalla}, Post: ${formData.perm_post}, Dist: ${formData.perm_dist}`,
        temporary_address: `House: ${formData.temp_house}, Mohalla: ${formData.temp_mohalla}, Post: ${formData.temp_post}, Dist: ${formData.temp_dist}`,
        mobile_1: formData.mobile_1, mobile_2: formData.mobile_2,
        nationality: formData.nationality, state: formData.state, home_district: formData.home_district, mother_tongue: formData.mother_tongue,
        religion: formData.religion, caste: formData.caste, category: formData.category,
        guardian_name: formData.guardian_name, guardian_relation: formData.guardian_relation,
        total_fee: formData.total_fee, taken_fee: formData.taken_fee, status: 'active'
    }
    const { error } = await supabase.from('students').insert([finalData])
    setLoading(false)
    if (error) alert(error.message)
    else { alert('Registered!'); navigate('/dashboard') }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-serif">
      <div className="max-w-4xl mx-auto bg-white shadow-xl p-8 border-2 border-black">
        <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
            <div>
                <h1 className="text-3xl font-extrabold uppercase">The Mathematics Bazar</h1>
                <p>Chainiya Chowk, Katkenwa, East Champaran</p>
            </div>
            <div className="text-center">
                <div className="border-2 border-black w-24 h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <span className="text-xs">PHOTO</span>}
                </div>
                <input type="file" onChange={handlePhotoUpload} className="w-24 text-xs mt-1" />
            </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="full_name" required onChange={handleChange} className="border border-black p-2 w-full uppercase" placeholder="Student Name" />
            <div className="grid grid-cols-3 gap-4">
                <input name="aadhar_no" onChange={handleChange} className="border-b border-black w-full" placeholder="Aadhar" />
                <input type="date" name="dob" onChange={handleChange} className="border-b border-black w-full" />
                <select name="gender" onChange={handleChange} className="border-b border-black w-full"><option>Male</option><option>Female</option></select>
            </div>
            <input name="father_name" onChange={handleChange} className="border border-black p-2 w-full mt-4" placeholder="Father's Name" />
            
            <div className="bg-blue-50 p-2 mt-4 flex gap-4 items-center">
                <span className="font-bold">Class:</span>
                <select name="class_id" required onChange={handleClassChange} className="border border-black flex-1"><option value="">Select</option>{classList.map(c=><option key={c.id} value={c.id}>{c.class_name}</option>)}</select>
            </div>

            <div className="grid grid-cols-2 gap-8 bg-gray-50 p-4 border mt-4">
                <div className="space-y-2">
                    <h3 className="font-bold underline">Permanent Address</h3>
                    <input name="perm_mohalla" onChange={handleChange} className="border-b border-black w-full" placeholder="Mohalla/Ward" />
                    <input name="perm_post" onChange={handleChange} className="border-b border-black w-full" placeholder="Post" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between"><h3 className="font-bold underline">Temporary Address</h3><label className="text-xs"><input type="checkbox" onChange={handleCopyAddress} /> Copy</label></div>
                    <input name="temp_mohalla" value={formData.temp_mohalla} onChange={handleChange} className="border-b border-black w-full" placeholder="Mohalla" />
                    <input name="temp_post" value={formData.temp_post} onChange={handleChange} className="border-b border-black w-full" placeholder="Post" />
                </div>
            </div>

            <input name="mobile_1" required onChange={handleChange} className="border-b border-black w-full font-bold mt-4" placeholder="Mobile Number" />

            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mt-4 flex gap-4">
                <div className="flex-1"><label className="text-xs font-bold">Total Fee </label><input name="total_fee" type="number" value={formData.total_fee} onChange={handleChange} className="font-bold text-xl w-full p-1 border" /></div>
                <div className="flex-1"><label className="text-xs font-bold">Paid Now</label><input name="taken_fee" type="number" required onChange={handleChange} className="font-bold text-xl w-full border-b-2 border-green-500" /></div>
            </div>

            <div className="flex gap-4 mt-6">
                <button disabled={loading||uploading} className="flex-1 bg-black text-white py-3 font-bold uppercase">{loading?'Saving...':'Submit'}</button>
                <button type="button" onClick={()=>navigate('/dashboard')} className="px-6 bg-gray-300 font-bold">Cancel</button>
            </div>
        </form>
      </div>
    </div>
  )
}