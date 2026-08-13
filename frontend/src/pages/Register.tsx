import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { getEventPhoto, getEventDetails } from '../utils/eventHelpers';
import { MAIN_WEBSITE_URL } from '../components/Navbar';
import paymentQrJpg from '../assets/payment_qr.jpeg';

// 45 Non-Special Events Grouped By Category
const EVENT_CATEGORIES = [
  {
    category: "Technical Events",
    badgeColor: "#FFE600",
    events: [
      { id: "code-busters", title: "Code Buster" },
      { id: "red-tech", title: "Red Tech" },
      { id: "robo-wars", title: "Robo Wars" },
      { id: "robo-race", title: "Robo Race" },
      { id: "robo-pick-n-place", title: "Robo Pick & Place" },
      { id: "intelliquest", title: "IntelliQuest" },
      { id: "brainstorm-battle", title: "BrainStorm Battle" },
      { id: "circuit-crafter", title: "Circuit Crafter" },
      { id: "electrofix-challenge", title: "Electrofix Challenge" },
      { id: "junkyard-wars", title: "Junkyard Wars" },
      { id: "ai-quizathon", title: "AI Quizathon" },
      { id: "ecoai-challenge", title: "EcoAI Challenge" },
      { id: "project-model-exhibition", title: "Project Model Exhibition" },
      { id: "coding-ladder", title: "Coding Ladder" },
      { id: "web-wizard", title: "Web Wizard" },
      { id: "cyber-shield", title: "Cyber Shield" },
      { id: "app-attack", title: "App Attack" },
      { id: "data-dash", title: "Data Dash" },
      { id: "design-dash", title: "Design Dash" },
      { id: "load-bridging", title: "Load Bridging" }
    ]
  },
  {
    category: "Creative & Gaming Events",
    badgeColor: "#3CE6FC",
    events: [
      { id: "poster-presentation", title: "Poster Presentation" },
      { id: "face-painting", title: "Face Painting" },
      { id: "pot-painting", title: "Pot Painting" },
      { id: "photography", title: "Photography" },
      { id: "greenearth-challenge", title: "Green Earth Challenge" },
      { id: "cricket", title: "Cricket" },
      { id: "need-for-speed", title: "Need For Speed" },
      { id: "bgmi", title: "BGMI (Battle Ground Mobile India)" },
      { id: "free-fire", title: "Free Fire" },
      { id: "technical-debate", title: "Technical Debate" }
    ]
  },
  {
    category: "Cultural & Performing Events",
    badgeColor: "#FF7A00",
    events: [
      { id: "group-ramp-walk", title: "Group Ramp Walk" },
      { id: "solo-ramp-walk", title: "Solo Ramp Walk" },
      { id: "treasure-hunt", title: "Treasure Hunt" },
      { id: "tug-of-war", title: "Tug Of War" },
      { id: "sudoku", title: "Sudoku" },
      { id: "fire-free-cooking", title: "Fire Free Cooking" },
      { id: "solo-singing", title: "Solo Singing" },
      { id: "solo-dance", title: "Solo Dance" },
      { id: "group-singing", title: "Group Singing" },
      { id: "group-dance", title: "Group Dance" },
      { id: "rap", title: "Rap" },
      { id: "beat-boxing", title: "Beat Boxing" },
      { id: "poetry", title: "Poetry" },
      { id: "story-telling", title: "Story Telling" },
      { id: "art-attack", title: "Art Attack" }
    ]
  }
];

const INSTITUTIONS = [
  "19.Maharishi Mahesh Yogi Ramayan University, Ayodhya", "AIIMS Deoghar", "Ambalika Institute Of Management And Technology Campus, Lucknow, Uttar Pradesh", "Amity International School \u2013 Noida", "Amity University Patna", "Amity University Raipur", "Amity University \u2013 Noida", "Amity University, Ranchi", "Arpa River Valley International School Bilaspur, Chhattisgarh", "Aryabhatta Knowledge University, Patna", "BIT Sindri", "Babasaheb Bhimrao Ambedkar Bihar University", "Babasaheb Bhimrao Ambedkar University, Lucknow", "Babu Banarasi Das University, lucknow", "Banaras Hindu University", "Bankura University", "Bhilai Institute of Technology", "Bihar Engineering University, Patna", "Biju Patnaik University of Technology ,Rourkela, Odisha", "Birla Institute of Technology (BIT) Mesra, Ranchi", "Cambridge institute of technology, Ranchi", "Chaibasa Engineering College", "Chanakya National Law University, Patna", "Chinmaya Vidyalaya, Bokaro", "City Montessori School \u2013 Lucknow", "Deepika English Medium School (CBSE), Rourkela", "Delhi Public School (DPS) Kalinga, Bhubaneswar", "Delhi Public School (DPS), Ranchi", "Delhi Public School Bhilai", "Delhi Public School Bokaro", "Delhi Public School Noida", "Delhi Public School Patna", "Delhi Public School Ruby Park, Kolkata", "Delhi Public School, Bilaspur", "Delhi Public School, Raipur(DPS)", "Delhi Public School, Rourkela", "Dr. A.P.J. Abdul Kalam Technical University \u2013 Lucknow", "Dr. C.V. Raman University (Bilaspur)", "Gangadhar Meher University Sambalpur", "Government Polytechnic Adityapur, Jamshedpur", "Guru Ghasidas Vishwavidyalaya, Bilaspur", "Guru Nanak Public School, Rourkela", "IEM Kolkata", "IERT Prayagraj", "IIEST (Indian Institute of Engineering Science and Technology) ,Shibpur", "Indian Institute of Information Technology Allahabad \u2013 Prayagraj", "Indian Institute of Information Technology Bhagalpur", "Indian Institute of Information Technology Kalyani", "Indian Institute of Information Technology Lucknow", "Indian Institute of Management Calcutta (IIM)", "Indian Institute of Technology (IIT) Dhanbad (ISM)", "Indian Institute of Technology Bhilai", "Indian Institute of Technology Bhubaneswar (IIT Bhubaneswar)", "Indian Institute of Technology Kharagpur", "Indian Institute of Technology Patna", "Indian institute of technology,  Varanasi", "Indira Gandhi National Open University, Patna", "Indo Danish Tool Room, Jamshedpur", "International Institute of Information Technology Naya Raipur", "J.K. Institute of Applied Physics and Technology, prayagraj", "Jadavpur University, Kolkata", "Jamshedpur Women's University", "Jaypee Institute of Information Technology \u2013 Noida", "Kalinga Institute of Industrial Technology (KIIT)", "Kalinga University (Naya Raipur)", "Kameshwar Singh Darbhanga Sanskrit University (KSDSU)", "Karim City College, Jamshedpur", "Khallikote Unitary University (KUU)", "Kolhan University", "Krishnarpit Institute, prayagraj", "La Martiniere College \u2013 Lucknow", "La Martiniere for Boys, Kolkata", "La Martiniere for Girls, Kolkata", "Lalit Narayan Mithila University (LNMU), Darbhanga", "Loyola High School, Patna", "Loyola School Jamshedpur", "Magadh University, Gaya", "Maharaja Sriram Chandra Bhanja Deo University", "Maharishi University of Management and Technology, Bilaspur", "Maulana Mazharul Haque Arabic & Persian University, Patna", "Motilal Nehru National Institute of Technology Allahabad \u2013 Prayagraj", "Muzaffarpur Institute of Technology", "Narula Institute of Technology (JIS)", "National Institute of Technology (NIT) Jamshedpur", "National Institute of Technology Durgapur", "National Institute of Technology Patna", "National Institute of Technology Raipur", "National Institute of Technology Rourkela (NIT Rourkela)", "Netaji Subhas University, Jamshedpur", "ODM Public School , Bhubaneswar", "ODM Sapphire Global School, Ranchi", "Odisha University of Technology and Research, Bhubaneshwar", "Podar International School Raipur (CBSE)", "Presidency University, Kolkata", "Pt. Ravishankar Shukla University, Raipur", "RVS College Of Engineering And Technology, Jamshedpur", "Rajendra University,Balangir", "Rani Rashmoni Green University,Singur, West Bengal 712409", "Sam Higginbottom University of Agriculture, Technology and Sciences, prayagraj", "Sambalpur University", "Sampurnanand Sanskrit University, Varanasi", "Seth Anandram Jaipuria School \u2013 Lucknow", "Shri Davara University, Raipur", "Sidho-Kanho-Birsha University, Purulia", "Sona Devi University , Jamshedpur", "South Point School, Kolkata", "Srinath Public School, Jamshedpur", "Srinath university", "St. Karen's High School, Patna", "St. Michael's High School,Digha Ghat, Patna", "St. Xavier's College, Kolkata", "St. Xavier's Collegiate School, Kolkata, West Bengal", "Subhash Institute of Technology, Deoghar", "Techno India University, Kolkata", "UCER Allahabad", "University of Allahabad", "University of Gour Banga, Mokdumpur, Malda, West Bengal 732103", "University of Kalyani", "Usha Martin University, Ranchi", "Utkal University, Bhubaneshwar", "Utkalmani Gopabandhu Institute of Engineering, Rourkela", "Veer Surendra Sai University of Technology, Burla", "Vikash Residential School - Bhubaneshwar", "Women's Polytechnic , Gamaharia", "XLRI - Xavier School of Management, Jamshedpur", "Others"
];

const SEMESTERS = [
  ...Array.from({ length: 10 }, (_, i) => `Class ${i + 3}`),
  ...Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`),
  "Others"
];

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    whatsapp: '',
    dob: '',
    age: '',
    gender: '',
    institution: '',
    otherInstitution: '',
    course: '',
    semester: '',
    otherSemester: '',
    password: '',
    confirmPassword: '',
    paymentUTR: '',
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP State
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [activeModalEvent, setActiveModalEvent] = useState<any>(null);
  const [regId, setRegId] = useState('');
  const [participantName, setParticipantName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleCategoryAll = (eventIds: string[]) => {
    const allSelected = eventIds.every((id) => selectedEvents.includes(id));
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((id) => !eventIds.includes(id)));
    } else {
      setSelectedEvents((prev) => Array.from(new Set([...prev, ...eventIds])));
    }
  };

  // Calculate age in years from DOB string
  const calculateAge = (dobString: string): string => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '';
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    const computedAge = calculateAge(dobVal);
    setFormData((prev) => ({
      ...prev,
      dob: dobVal,
      age: computedAge,
    }));
  };

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Invalid file type! Only image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large! Maximum allowed size before upload is 5MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim().endsWith('@gmail.com')) {
      setError('Please enter a valid Gmail address to send OTP.');
      return;
    }
    setSendingOtp(true);
    setError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP.');
      setIsOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setError('Please enter the OTP.');
    setVerifyingOtp(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify OTP.');
      setIsEmailVerified(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      setError('Please verify your email address using the OTP sent to your Gmail.');
      return;
    }
    setError('');

    // Field Matching checks
    if (formData.password !== formData.confirmPassword) {
      setError('Password mismatch. Please check your password fields.');
      return;
    }

    if (!formData.email.trim().endsWith('@gmail.com')) {
      setError('Registration requires a valid Gmail account (must end with @gmail.com).');
      return;
    }

    if (!selectedFile) {
      setError('Please upload your payment verification screenshot.');
      return;
    }

    setLoading(true);

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'institution' && formData.institution === 'Others') {
        submissionData.append(key, formData.otherInstitution);
      } else if (key === 'semester' && formData.semester === 'Others') {
        submissionData.append(key, formData.otherSemester);
      } else if (key !== 'otherInstitution' && key !== 'otherSemester') {
        submissionData.append(key, val as string);
      }
    });
    submissionData.append('paymentScreenshot', selectedFile);
    submissionData.append('selectedEvents', JSON.stringify(selectedEvents));

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: submissionData,
      });

      if (!response.ok) {
        let errMsg = 'Registration failed. Please verify your inputs.';
        try {
          const jsonError = await response.json();
          errMsg = jsonError.message || errMsg;
        } catch (jsonErr) {
          // Response was not JSON
        }
        throw new Error(errMsg);
      }

      // Successful Registration - Response contains JSON details
      const result = await response.json();
      const registrationId = result.registrationId || '';
      const nameVal = result.name || formData.name;

      setRegId(registrationId);
      setParticipantName(nameVal);

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '4.8vh' }}>
      <header className="main-header">
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: '12px',
          }}
          onClick={() => window.location.href = MAIN_WEBSITE_URL}
        >
          {/* Row 1: TECH + NIKA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '3rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}>TECH</span>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '3rem',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              color: '#000000',
              background: 'var(--brut-lime, #3ce6fc)',
              border: '3px solid var(--foreground)',
              boxShadow: '3px 3px 0px 0px var(--foreground)',
              padding: '2px 14px',
              display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>NIKA</span>
          </div>
          {/* Row 2: 6.0 */}
          <div>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.8rem',
              letterSpacing: '-0.02em',
              color: 'var(--background)',
              background: 'var(--foreground)',
              border: '3px solid var(--foreground)',
              padding: '2px 14px',
              display: 'inline-block',
            }}>6.0</span>
          </div>
        </div>
        <p className="tagline">Create an account, verify payment, and gain access to event registrations and team management.</p>
      </header>


      {!success ? (
        <>
          <form onSubmit={handleSubmit} className="form-data-collection" style={{ marginTop: '20px' }}>
            {/* Section 1: Personal Profile (Yellow Box) */}
            <div className="brut-section brut-section-yellow">
              <div className="brut-section-title">
                <span className="brut-badge brut-badge-pink"></span>
                1. PERSONAL PROFILE
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    FULL NAME <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="e.g. Adeeb Razi"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="whatsapp">
                    WHATSAPP NUMBER <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    id="whatsapp"
                    required
                    placeholder="+91 9876543210"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    GMAIL ADDRESS <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    placeholder="you@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isOtpSent || isEmailVerified}
                  />
                  <small style={{ color: '#000000', fontWeight: 600, fontSize: '0.75rem', marginTop: '2px' }}>Gmail accounts only.</small>
                </div>

                {!isEmailVerified && (
                  <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexDirection: 'row' }}>
                    {!isOtpSent ? (
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp} style={{ padding: '12px 20px', background: 'var(--brut-blue)', color: '#fff', border: '3px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>
                        {sendingOtp ? 'Sending...' : 'Send OTP'}
                      </button>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <label htmlFor="otp">ENTER OTP <span className="required">*</span></label>
                          <input
                            type="text"
                            name="otp"
                            id="otp"
                            placeholder="6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                          />
                        </div>
                        <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp} style={{ padding: '12px 20px', background: 'var(--brut-green)', color: '#000', border: '3px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>
                          {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="dob">
                    DATE OF BIRTH (DOB) <span className="required">*</span>
                    {formData.age && (
                      <span style={{ marginLeft: '8px', color: '#000000', fontWeight: 900, textTransform: 'none', background: '#ffffff', border: '1.5px solid #000', padding: '1px 6px', fontSize: '0.75rem' }}>
                        Age: {formData.age} yrs
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    required
                    value={formData.dob}
                    onChange={handleDobChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">
                    GENDER <span className="required">*</span>
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Profile (Cyan Blue Box) */}
            <div className="brut-section brut-section-blue">
              <div className="brut-section-title">
                <span className="brut-badge brut-badge-yellow"></span>
                2. ACADEMIC PROFILE
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="institution">
                    ACADEMIC INSTITUTION <span className="required">*</span>
                  </label>
                  <select
                    name="institution"
                    id="institution"
                    required
                    value={formData.institution}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Select your institution</option>
                    {INSTITUTIONS.map((inst, idx) => (
                      <option key={idx} value={inst}>{inst}</option>
                    ))}
                  </select>
                  {formData.institution === 'Others' && (
                    <input
                      type="text"
                      name="otherInstitution"
                      id="otherInstitution"
                      required
                      placeholder="Enter your institution name"
                      value={formData.otherInstitution}
                      onChange={handleInputChange}
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="course">
                    COURSE / STREAM <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="course"
                    id="course"
                    required
                    placeholder="e.g. B.Tech CSE"
                    value={formData.course}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="semester">
                    SEMESTER / STANDARD <span className="required">*</span>
                  </label>
                  <select
                    name="semester"
                    id="semester"
                    required
                    value={formData.semester}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Select semester or standard</option>
                    {SEMESTERS.map((sem, idx) => (
                      <option key={idx} value={sem}>{sem}</option>
                    ))}
                  </select>
                  {formData.semester === 'Others' && (
                    <input
                      type="text"
                      name="otherSemester"
                      id="otherSemester"
                      required
                      placeholder="Enter your semester/standard"
                      value={formData.otherSemester}
                      onChange={handleInputChange}
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Credentials Setup (Neon Lime Box) */}
            <div className="brut-section brut-section-lime">
              <div className="brut-section-title">
                <span className="brut-badge brut-badge-pink"></span>
                3. ACCOUNT CREDENTIALS
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="password">
                    PASSWORD <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    CONFIRM PASSWORD <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Event Selection (45 Events Grouped by Category) */}
            <div className="brut-section brut-section-orange">
              <div className="brut-section-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="brut-badge brut-badge-blue"></span>
                  4. EVENT SELECTION
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, background: '#ffffff', color: '#000000', border: '2px solid #000000', padding: '4px 12px', boxShadow: '2px 2px 0px 0px #000000' }}>
                  SELECTED: {selectedEvents.length} EVENT{selectedEvents.length !== 1 ? 'S' : ''}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', marginBottom: '20px', fontWeight: 700, opacity: 0.9 }}>
                Select all the technical, creative, and cultural events you wish to participate in during Technika 6.0:
              </p>

              {EVENT_CATEGORIES.map((cat, catIdx) => (
                <div key={catIdx} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.08)', border: '2.5px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', background: cat.badgeColor, border: '1.5px solid #000' }}></span>
                      {cat.category} ({cat.events.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleCategoryAll(cat.events.map(e => e.id))}
                      style={{
                        background: '#ffffff',
                        border: '2px solid #000000',
                        color: '#000000',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '2px 2px 0px 0px #000000'
                      }}
                    >
                      {cat.events.every(e => selectedEvents.includes(e.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="register-events-grid">
                    {cat.events.map((evt, evtIdx) => {
                      const isChecked = selectedEvents.includes(evt.id);
                      const evtDetail = getEventDetails(evt.id);
                      const dateText = evtDetail?.date || 'Day 1';
                      const timeText = evtDetail?.time || '10:30 AM';
                      const venueText = evtDetail?.venue || 'Campus Arena';
                      const descText = evtDetail?.description || 'Fest competition arena event.';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => toggleEventSelection(evt.id)}
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '160px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            color: '#ffffff',
                            border: isChecked ? '3.5px solid #FFE600' : '3px solid #ffffff',
                            boxShadow: isChecked ? '6px 6px 0px 0px #FFE600, 8px 8px 0px 0px #ffffff' : '5px 5px 0px 0px #ffffff',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                            background: '#000000',
                          }}
                        >
                          {/* Event Photo Full Card Background */}
                          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                            <img
                              src={getEventPhoto(evt.id, evtIdx)}
                              alt={evt.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                            />
                            {/* Dark Gradient Overlay for Maximum Legibility */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%)'
                            }} />
                          </div>

                          {/* Card Content Layer */}
                          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '6px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', textShadow: '2px 2px 0px #000000', lineHeight: 1 }}>
                                  {String(evtIdx + 1).padStart(2, '0')}
                                </span>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', margin: 0, textShadow: '2px 2px 0px #000000', lineHeight: 1.1 }}>
                                  {evt.title}
                                </h3>
                              </div>
                              <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#cbd5e1', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.2 }}>
                                {descText}
                              </p>
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveModalEvent(evtDetail || { ...evt, category: cat.category, description: descText, date: dateText, time: timeText, venue: venueText });
                                  }}
                                  style={{
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 900,
                                    background: '#8aebee',
                                    color: '#000000',
                                    border: '1.5px solid #000000',
                                    boxShadow: '2px 2px 0px 0px #000000',
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View details →
                                </button>

                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 900,
                                    background: isChecked ? '#FFE600' : '#ffffff',
                                    color: '#000000',
                                    border: '1.5px solid #000000',
                                    boxShadow: '2px 2px 0px 0px #000000',
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isChecked ? 'SELECTED ✓' : 'SELECT EVENT +'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Section 5: Payment Details (Neon Yellow/Pink Box) */}
            <div className="brut-section brut-section-yellow">
              <div className="brut-section-title">
                <span className="brut-badge brut-badge-pink"></span>
                5. PAYMENT VERIFICATION
              </div>

              {/* QR Code Scan Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                padding: '24px',
                background: '#ffffff',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px 0px #000000',
                marginBottom: '24px',
                textAlign: 'center',
                color: '#000000'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, background: '#FFE600', border: '2px solid #000000', padding: '4px 12px', textTransform: 'uppercase', boxShadow: '2px 2px 0px 0px #000000' }}>
                  Scan to Pay (Registration Fee)
                </div>
                <img 
                  src={paymentQrJpg} 
                  alt="Payment QR Code" 
                  style={{ 
                    width: '180px', 
                    height: '180px', 
                    border: '3px solid #000000',
                    boxShadow: '3px 3px 0px 0px #000000',
                    objectFit: 'contain'
                  }} 
                />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.4, maxWidth: '600px' }}>
                  Scan the QR code above using GPay, PhonePe, Paytm, or any UPI app to pay the entry fee. Once complete, enter your unique 12-digit transaction UTR/UPI Ref No. and upload the payment screenshot below for verification.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="paymentUTR">
                    TRANSACTION UTR <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="paymentUTR"
                    id="paymentUTR"
                    required
                    placeholder="12-digit UTR"
                    value={formData.paymentUTR}
                    onChange={handleInputChange}
                  />
                  <small style={{ color: '#000000', fontWeight: 600, fontSize: '0.75rem', marginTop: '2px' }}>Must be unique.</small>
                </div>

                <div className="form-group">
                  <label>
                    PAYMENT SCREENSHOT <span className="required">*</span>
                  </label>
                  <div
                    className={`brut-dropzone ${dragActive ? 'dragover' : ''}`}
                    id="drop-zone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                  >
                    <input
                      type="file"
                      id="paymentScreenshot"
                      name="paymentScreenshot"
                      accept="image/*"
                      className="hidden-file-input"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    {!selectedFile ? (
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}>
                          DROP OR BROWSE
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444444', marginTop: '4px' }}>
                          JPG · PNG · WEBP · Max 5MB
                        </div>
                      </div>
                    ) : (
                      <div className="file-preview" style={{ color: '#000000' }}>
                        <div className="file-preview-info">
                          <i className="fa-solid fa-image file-icon" style={{ color: '#000000' }}></i>
                          <div>
                            <p className="file-name" style={{ color: '#000000', fontWeight: 800 }}>{selectedFile.name}</p>
                            <p className="file-size" style={{ color: '#444444' }}>{formatBytes(selectedFile.size)}</p>
                          </div>
                        </div>
                        <button type="button" className="remove-file-btn" onClick={removeFile} style={{ color: '#000000' }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-panel" style={{ display: 'flex', background: '#ffffff', border: '3px solid #000000', color: '#ef4444', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-exclamation error-icon"></i>
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button type="submit" className="brut-btn-pink" disabled={loading}>
                {!loading ? (
                  <span>COMPLETE REGISTRATION →</span>
                ) : (
                  <span>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> PROCESSING...
                  </span>
                )}
              </button>

              <Link
                to="/login"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  textTransform: 'uppercase',
                  color: 'var(--foreground)',
                  textDecoration: 'underline',
                  letterSpacing: '0.05em',
                }}
              >
                HAVE AN ACCOUNT? LOG IN
              </Link>
            </div>
          </form>
        </>
    ) : (
        /* Success Card Component */
        <div className="card success-card glassmorphism" id="success-card">
          <div className="success-header">
            <div className="success-icon-wrapper">
              <i className="fa-solid fa-circle-check success-icon"></i>
            </div>
            <h2>Registration Complete!</h2>
            <p className="success-subtitle">Welcome to Technika 6.0. Your registration details have been securely recorded.</p>
          </div>

          <div className="success-details">
            <div className="success-row">
              <span className="success-label">Participant Name:</span>
              <span className="success-value">{participantName}</span>
            </div>
            <div className="success-row reg-id-row">
              <span className="success-label">Registration ID:</span>
              <span className="success-value reg-id-badge">{regId}</span>
            </div>
            <p className="success-alert" style={{ background: 'rgba(255, 230, 0, 0.1)', borderColor: '#FFE600', color: '#ffffff' }}>
              <i className="fa-solid fa-key"></i> Please make sure to save your Registration ID. Use it along with your chosen password to log into the dashboard.
            </p>
          </div>

          <div className="success-actions">
            <Link to="/login" className="action-btn-primary" style={{ textDecoration: 'none' }}>
              <i className="fa-solid fa-arrow-right-to-bracket"></i> Proceed to Login
            </Link>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <p>&copy; 2026 Technika Core Operations. All rights reserved.</p>
      </footer>

      <EventDetailsModal event={activeModalEvent} onClose={() => setActiveModalEvent(null)} />
    </div>
  );
};
