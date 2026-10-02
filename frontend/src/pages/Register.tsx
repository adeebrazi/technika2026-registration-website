import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { CommonRulesModal } from '../components/CommonRulesModal';
import { getEventPhoto, getEventDetails } from '../utils/eventHelpers';
import { MAIN_WEBSITE_URL } from '../components/Navbar';
import { FestAnnouncement } from '../components/FestAnnouncement';
import { DatePicker } from '../components/DatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { INSTITUTIONS } from '../data/institutions';
import {
  COURSE_OPTIONS,
  getSemestersForCourse,
  isArkaJainUniversity,
  isAjuExemptEngineeringCourse
} from '../data/courses';
import QRCode from 'qrcode';

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
    otherCourse: '',
    semester: '',
    otherSemester: '',
    password: '',
    confirmPassword: '',
    paymentUTR: '',
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Official ARKA JAIN UNIVERSITY UPI Payment Config
  const UPI_ID = '3217855a@bandhan';
  const PAYEE_NAME = 'ARKA JAIN UNIVERSITY';
  const NOTE = 'Technika 6.0 Registration';

  // Derived values for ARKA JAIN University and engineering course exemption
  const effectiveInstitution = formData.institution === 'Others' ? formData.otherInstitution : formData.institution;
  const effectiveCourse = formData.course === 'Others' ? formData.otherCourse : formData.course;
  const isAju = isArkaJainUniversity(effectiveInstitution);
  const isAjuExempt = isAju && isAjuExemptEngineeringCourse(effectiveCourse);
  const availableSemesters = getSemestersForCourse(formData.course);

  // Calculate dynamic registration fee total (Rs. 150 flat fee)
  const calculateTotalAmount = () => {
    return selectedEvents.length > 0 ? 150 : 0;
  };

  const totalAmount = calculateTotalAmount();
  const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(NOTE)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiString)}`;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (totalAmount > 0) {
      const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(NOTE)}`;
      QRCode.toDataURL(upiUri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => {
          console.error('QR generation error:', err);
          setQrCodeDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiUri)}`);
        });
    } else {
      setQrCodeDataUrl('');
    }
  }, [totalAmount]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Additional file upload states for ARKA JAIN University No-Dues exemption
  const [noDuesSlipFile, setNoDuesSlipFile] = useState<File | null>(null);
  const [collegeIdCardFile, setCollegeIdCardFile] = useState<File | null>(null);
  const [noDuesDragActive, setNoDuesDragActive] = useState(false);
  const [collegeIdDragActive, setCollegeIdDragActive] = useState(false);
  const noDuesInputRef = useRef<HTMLInputElement>(null);
  const collegeIdInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP State
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [topNotification, setTopNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (topNotification) {
      const timer = setTimeout(() => {
        setTopNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [topNotification]);

  const triggerTopNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setTopNotification({ message, type });
  };

  const [activeModalEvent, setActiveModalEvent] = useState<any>(null);
  const [regId, setRegId] = useState('');
  const [participantName, setParticipantName] = useState('');

  // Team Registration Configuration State
  const [eventConfigs, setEventConfigs] = useState<Record<string, { mode: 'solo' | 'create_team' | 'join_team'; teamName: string; teamId: string }>>({});
  const [teamCheckStatus, setTeamCheckStatus] = useState<Record<string, { loading: boolean; valid?: boolean; message?: string; leaderName?: string }>>({});
  const [createdTeams, setCreatedTeams] = useState<Array<{ eventId: string; eventName: string; teamId: string; teamName: string; minMembers: number; maxMembers: number }>>([]);

  // Rules Acceptance State
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showCommonRulesModal, setShowCommonRulesModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { eventSlug } = useParams<{ eventSlug?: string }>();

  // Deep-linking: sync URL /register/:eventSlug with activeModalEvent
  useEffect(() => {
    if (eventSlug) {
      const detail = getEventDetails(eventSlug);
      if (detail) {
        setActiveModalEvent(detail);
      }
    } else {
      setActiveModalEvent(null);
    }
  }, [eventSlug]);

  // Purge Treasure Hunt if user selects ARKA JAIN University
  useEffect(() => {
    if (isAju && selectedEvents.includes('treasure-hunt')) {
      setSelectedEvents((prev) => prev.filter((id) => id !== 'treasure-hunt'));
      triggerTopNotification(
        'Treasure Hunt is exclusively for outside colleges and is not permitted for ARKA JAIN University students.',
        'error'
      );
    }
  }, [isAju, selectedEvents]);

  const handleOpenEventModal = (eventId: string) => {
    const detail = getEventDetails(eventId);
    setActiveModalEvent(detail || { id: eventId, title: eventId, category: 'Event', description: '' });
    navigate(`/register/${eventId}`);
  };

  const handleCloseEventModal = () => {
    setActiveModalEvent(null);
    navigate('/register');
  };

  const toggleEventSelection = (eventId: string, minMembers?: number) => {
    if (eventId === 'treasure-hunt' && isAju) {
      triggerTopNotification(
        'Treasure Hunt is exclusively for outside colleges and is not permitted for ARKA JAIN University students.',
        'error'
      );
      return;
    }

    setSelectedEvents((prev) => {
      const isSelected = prev.includes(eventId);
      if (isSelected) {
        return prev.filter((id) => id !== eventId);
      } else {
        if (!eventConfigs[eventId]) {
          const detail = getEventDetails(eventId);
          const resolvedMin = minMembers !== undefined ? minMembers : (detail?.minMembers ?? 1);
          const isTeamOnly = resolvedMin > 1;
          setEventConfigs((cPrev) => ({
            ...cPrev,
            [eventId]: {
              mode: isTeamOnly ? 'create_team' : 'solo',
              teamName: '',
              teamId: ''
            }
          }));
        }
        return [...prev, eventId];
      }
    });
  };

  const updateEventConfig = (eventId: string, updates: Partial<{ mode: 'solo' | 'create_team' | 'join_team'; teamName: string; teamId: string }>) => {
    setEventConfigs((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || { mode: 'solo', teamName: '', teamId: '' }),
        ...updates
      }
    }));
  };

  const handleValidateTeamCode = async (slug: string, teamId: string) => {
    if (!teamId.trim()) return;
    setTeamCheckStatus((prev) => ({ ...prev, [slug]: { loading: true } }));
    try {
      const res = await fetch('/api/teams/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: teamId.trim(), eventSlug: slug })
      });
      const data = await res.json();
      setTeamCheckStatus((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          valid: data.valid,
          message: data.message,
          leaderName: data.leaderName
        }
      }));
    } catch (err: any) {
      setTeamCheckStatus((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          valid: false,
          message: 'Server connection error during validation.'
        }
      }));
    }
  };

  const toggleCategoryAll = (eventIds: string[]) => {
    const selectableIds = isAju ? eventIds.filter((id) => id !== 'treasure-hunt') : eventIds;
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedEvents.includes(id));
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedEvents((prev) => Array.from(new Set([...prev, ...selectableIds])));
      setEventConfigs((cPrev) => {
        const next = { ...cPrev };
        selectableIds.forEach((id) => {
          if (!next[id]) {
            const detail = getEventDetails(id);
            const isTeamOnly = (detail?.minMembers ?? 1) > 1;
            next[id] = {
              mode: isTeamOnly ? 'create_team' : 'solo',
              teamName: '',
              teamId: ''
            };
          }
        });
        return next;
      });
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

  const handleDobChange = (valOrEvent: string | React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent.target.value;
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    if (name === 'paymentUTR') {
      // Strictly digits only, maximum 12 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 12);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
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

  const handleNoDuesFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type! Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large! Maximum allowed size before upload is 5MB.');
      return;
    }
    setNoDuesSlipFile(file);
    setError('');
  };

  const handleCollegeIdFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type! Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large! Maximum allowed size before upload is 5MB.');
      return;
    }
    setCollegeIdCardFile(file);
    setError('');
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
      triggerTopNotification('Please enter a valid Gmail address to send OTP.', 'error');
      return;
    }
    setSendingOtp(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP.');
      setIsOtpSent(true);
      triggerTopNotification(data.message || 'OTP sent successfully to your Gmail.', 'success');
    } catch (err: any) {
      triggerTopNotification(err.message || 'Failed to send OTP.', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !otp.trim()) {
      triggerTopNotification('Please enter the OTP.', 'error');
      return;
    }
    setVerifyingOtp(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), otp: otp.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP.');
      setIsEmailVerified(true);
      triggerTopNotification(data.message || 'Email verified successfully!', 'success');
    } catch (err: any) {
      triggerTopNotification(err.message || 'Invalid OTP.', 'error');
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

    if (isAjuExempt) {
      if (!noDuesSlipFile) {
        setError('Please upload your ₹600 manual payment slip paid during No-Dues.');
        return;
      }
      if (!collegeIdCardFile) {
        setError('Please upload your College ID Card for student verification.');
        return;
      }
    } else {
      if (!selectedFile) {
        setError('Please upload your payment verification screenshot.');
        return;
      }

      if (!formData.paymentUTR.trim()) {
        setError('Please enter your 12-digit Transaction UTR / UPI Reference Number.');
        return;
      }

      if (!/^\d{12}$/.test(formData.paymentUTR.trim())) {
        setError('Transaction UTR Number must be exactly 12 numeric digits (check your UPI payment receipt).');
        return;
      }
    }

    if (!acceptedRules) {
      setError('Please accept the Event Common Rules & Regulations and Disqualification Criteria before completing registration.');
      return;
    }

    // Event selection validation
    if (selectedEvents.length === 0) {
      setError('Please select at least one event you wish to participate in.');
      return;
    }

    // Validate team configs for join_team
    for (const slug of selectedEvents) {
      const config = eventConfigs[slug];
      if (config && config.mode === 'join_team') {
        if (!config.teamId || !config.teamId.trim()) {
          setError(`Please enter the Team ID to join your friend's team, or select "Register as Leader".`);
          return;
        }
        if (teamCheckStatus[slug] && teamCheckStatus[slug].valid === false) {
          setError(teamCheckStatus[slug].message || `The Team ID entered for one of your selected events is invalid.`);
          return;
        }
      }
    }

    setLoading(true);

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'institution' && formData.institution === 'Others') {
        submissionData.append(key, formData.otherInstitution);
      } else if (key === 'course' && formData.course === 'Others') {
        submissionData.append(key, formData.otherCourse);
      } else if (key === 'semester' && formData.semester === 'Others') {
        submissionData.append(key, formData.otherSemester);
      } else if (
        key !== 'otherInstitution' &&
        key !== 'otherCourse' &&
        key !== 'otherSemester' &&
        !(isAjuExempt && key === 'paymentUTR')
      ) {
        submissionData.append(key, val as string);
      }
    });

    if (isAjuExempt) {
      submissionData.append('noDuesSlip', noDuesSlipFile!);
      submissionData.append('collegeIdCard', collegeIdCardFile!);
      submissionData.append('isAjuExempt', 'true');
    } else {
      submissionData.append('paymentScreenshot', selectedFile!);
    }

    const selectedEventsPayload = selectedEvents.map((slug) => {
      const detail = getEventDetails(slug);
      const isTeamOnly = (detail?.minMembers ?? 1) > 1;
      const defaultMode = isTeamOnly ? 'create_team' : 'solo';
      const config = eventConfigs[slug] || { mode: defaultMode, teamName: '', teamId: '' };
      return {
        slug,
        mode: config.mode || defaultMode,
        teamName: config.teamName || '',
        teamId: config.teamId || ''
      };
    });
    submissionData.append('selectedEvents', JSON.stringify(selectedEventsPayload));

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

      if (result.createdTeams && Array.isArray(result.createdTeams)) {
        setCreatedTeams(result.createdTeams);
      }

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
      {/* Top-Right Notification Toast (Auto-vanishes in 2 seconds) */}
      {topNotification && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '380px',
            minWidth: '260px',
            background: topNotification.type === 'success' ? '#10b981' : '#ff2d55',
            color: '#ffffff',
            border: '3.5px solid #000000',
            boxShadow: '4px 4px 0px 0px #000000',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            fontWeight: 800,
            fontSize: '0.92rem',
            letterSpacing: '0.01em',
            animation: 'toastPopIn 0.2s ease-out',
          }}
        >
          <i
            className={topNotification.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}
            style={{ fontSize: '1.25rem', flexShrink: 0 }}
          ></i>
          <span style={{ lineHeight: 1.3 }}>{topNotification.message}</span>
        </div>
      )}

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
              fontSize: 'clamp(2.1rem, 7vw, 3rem)',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}>TECH</span>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2.1rem, 7vw, 3rem)',
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
              fontSize: 'clamp(1.3rem, 4.5vw, 1.8rem)',
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

      {/* 45 Events ₹150 Announcement in Neo-Brutalism */}
      <FestAnnouncement />

      {!success ? (
        <>
          <form onSubmit={handleSubmit} className="form-data-collection" style={{ marginTop: '20px' }}>
            {/* Section 1: Personal Profile (Yellow Box) */}
            <div className="brut-section brut-section-yellow">
              <div
                className="brut-section-title"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="brut-badge brut-badge-pink"></span>
                  1. PERSONAL PROFILE
                </div>

                <Link
                  to="/login"
                  className="btn-forgot-password"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    padding: '4px 10px',
                  }}
                >
                  ALREADY REGISTERED? LOG IN →
                </Link>
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
                  <div className="form-group">
                    {!isOtpSent ? (
                      <>
                        <label className="otp-desktop-spacer" aria-hidden="true">
                          OTP VERIFICATION
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            style={{
                              height: '47px',
                              padding: '0 24px',
                              background: 'var(--brut-blue)',
                              color: '#fff',
                              border: '3px solid #000',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              boxShadow: '3px 3px 0px 0px #000',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sendingOtp ? 'Sending...' : 'Send OTP'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <label htmlFor="otp">
                          ENTER OTP <span className="required">*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            name="otp"
                            id="otp"
                            placeholder="6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            style={{ flex: 1, height: '47px' }}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp}
                            style={{
                              height: '47px',
                              padding: '0 20px',
                              background: 'var(--brut-green)',
                              color: '#000',
                              border: '3px solid #000',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              boxShadow: '3px 3px 0px 0px #000',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
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
                  <DatePicker
                    id="dob"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={(dateStr) => handleDobChange(dateStr)}
                    minYear={1990}
                    maxYear={2026}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">
                    GENDER <span className="required">*</span>
                  </label>
                  <CustomSelect
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleInputChange}
                    options={['Male', 'Female', 'Other']}
                    placeholder="Select gender"
                  />
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
                  <CustomSelect
                    id="institution"
                    name="institution"
                    required
                    value={formData.institution}
                    onChange={handleInputChange}
                    options={INSTITUTIONS}
                    placeholder="Select or search your institution"
                    searchable
                  />
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
                  <CustomSelect
                    id="course"
                    name="course"
                    required
                    value={formData.course}
                    onChange={(e) => {
                      handleInputChange(e);
                      const newSems = getSemestersForCourse(e.target.value);
                      if (!newSems.includes(formData.semester)) {
                        setFormData((prev) => ({ ...prev, course: e.target.value, semester: '' }));
                      }
                    }}
                    options={COURSE_OPTIONS}
                    placeholder="Select or search course / stream"
                    searchable
                  />
                  {formData.course === 'Others' && (
                    <input
                      type="text"
                      name="otherCourse"
                      id="otherCourse"
                      required
                      placeholder="Enter your course / stream name"
                      value={formData.otherCourse}
                      onChange={handleInputChange}
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="semester">
                    SEMESTER / STANDARD <span className="required">*</span>
                  </label>
                  <CustomSelect
                    id="semester"
                    name="semester"
                    required
                    value={formData.semester}
                    onChange={handleInputChange}
                    options={availableSemesters}
                    placeholder={formData.course ? "Select semester or standard" : "Select course first"}
                    disabled={!formData.course}
                  />
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

              <p style={{ fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700, opacity: 0.9 }}>
                Select all the technical, creative, and cultural events you wish to participate in during Technika 6.0:
              </p>


              {EVENT_CATEGORIES.map((cat, catIdx) => {
                const selectableEvents = cat.events.filter((e) => !(e as any).isComingSoon);
                const allComingSoon = selectableEvents.length === 0;
                const isAllSelected = !allComingSoon && selectableEvents.every((e) => selectedEvents.includes(e.id));

                return (
                <div key={catIdx} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.08)', border: '2.5px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', background: cat.badgeColor, border: '1.5px solid #000' }}></span>
                      {cat.category} ({cat.events.length})
                    </h4>
                    <button
                      type="button"
                      disabled={allComingSoon}
                      onClick={() => !allComingSoon && toggleCategoryAll(selectableEvents.map(e => e.id))}
                      style={{
                        background: allComingSoon ? '#e5e7eb' : '#ffffff',
                        border: allComingSoon ? '2px solid #9ca3af' : '2px solid #000000',
                        color: allComingSoon ? '#9ca3af' : '#000000',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        padding: '3px 10px',
                        cursor: allComingSoon ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: allComingSoon ? 'none' : '2px 2px 0px 0px #000000',
                        opacity: allComingSoon ? 0.6 : 1,
                      }}
                      title={allComingSoon ? 'All events in this category are coming soon' : undefined}
                    >
                      {isAllSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="register-events-grid">
                    {cat.events.map((evt, evtIdx) => {
                      const isChecked = selectedEvents.includes(evt.id);
                      const evtDetail = getEventDetails(evt.id);
                      const descText = evtDetail?.description || 'Fest competition arena event.';

                      const minMembers = evtDetail?.minMembers ?? 1;
                      const isTeamOnly = minMembers > 1;
                      const currentMode = eventConfigs[evt.id]?.mode || (isTeamOnly ? 'create_team' : 'solo');
                      const isTreasureHunt = evt.id === 'treasure-hunt';
                      const isTreasureHuntDisabled = isTreasureHunt && isAju;

                        return (
                          <div
                            key={evt.id}
                            onClick={() => {
                              if (isTreasureHuntDisabled) {
                                triggerTopNotification('Treasure Hunt is exclusively for outside colleges and is not permitted for ARKA JAIN University students.', 'error');
                                return;
                              }
                              if (!(evt as any).isComingSoon) {
                                handleOpenEventModal(evt.id);
                              }
                            }}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              minHeight: '175px',
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              textAlign: 'left',
                              color: '#ffffff',
                              border: isTreasureHuntDisabled
                                ? '3px solid #ef4444'
                                : isChecked
                                ? '3.5px solid #FFE600'
                                : '3px solid #ffffff',
                              boxShadow: isTreasureHuntDisabled
                                ? '5px 5px 0px 0px #ef4444'
                                : isChecked
                                ? '6px 6px 0px 0px #FFE600, 8px 8px 0px 0px #ffffff'
                                : '5px 5px 0px 0px #ffffff',
                              cursor: (evt as any).isComingSoon || isTreasureHuntDisabled ? 'not-allowed' : 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.15s ease',
                              background: '#000000',
                              opacity: (evt as any).isComingSoon || isTreasureHuntDisabled ? 0.65 : 1,
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
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '8px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', textShadow: '2px 2px 0px #000000', lineHeight: 1 }}>
                                      {String(evtIdx + 1).padStart(2, '0')}
                                    </span>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', margin: 0, textShadow: '2px 2px 0px #000000', lineHeight: 1.1 }}>
                                      {evt.title}
                                    </h3>
                                  </div>
                                  {isTreasureHuntDisabled && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      padding: '2px 6px',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      border: '1.5px solid #000000',
                                      boxShadow: '2px 2px 0px 0px #000000',
                                      letterSpacing: '0.03em'
                                    }}>
                                      NOT FOR AJU STUDENTS
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 500, color: '#cbd5e1', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25 }}>
                                  {descText}
                                </p>
                              </div>

                              {/* Selected Status Tag (If Selected) */}
                              {isChecked && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    padding: '2px 7px',
                                    background: 'rgba(0,0,0,0.85)',
                                    color: currentMode === 'create_team' ? '#FFE600' : currentMode === 'join_team' ? '#3CE6FC' : '#10b981',
                                    border: `1.5px solid ${currentMode === 'create_team' ? '#FFE600' : currentMode === 'join_team' ? '#3CE6FC' : '#10b981'}`
                                  }}>
                                    {currentMode === 'create_team'
                                      ? `👑 Leader: ${eventConfigs[evt.id]?.teamName || 'Team'}`
                                      : currentMode === 'join_team'
                                      ? `🤝 Joining: ${eventConfigs[evt.id]?.teamId || 'Pending'}`
                                      : '👤 Solo Entry'}
                                  </span>
                                </div>
                              )}

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEventModal(evt.id);
                                    }}
                                    style={{
                                      fontSize: '0.65rem',
                                      textTransform: 'uppercase',
                                      fontWeight: 900,
                                      background: '#8aebee',
                                      color: '#000000',
                                      border: '1.5px solid #000000',
                                      boxShadow: '2px 2px 0px 0px #000000',
                                      padding: '5px 9px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isChecked ? 'EDIT / DETAILS ⚙' : 'VIEW DETAILS →'}
                                  </button>

                                  {(evt as any).isComingSoon ? (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 900,
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: '1.5px solid #000000',
                                        boxShadow: '2px 2px 0px 0px #000000',
                                        padding: '5px 9px',
                                        cursor: 'not-allowed'
                                      }}
                                    >
                                      COMING SOON
                                    </div>
                                  ) : isTreasureHuntDisabled ? (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 900,
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: '1.5px solid #000000',
                                        boxShadow: '2px 2px 0px 0px #000000',
                                        padding: '5px 9px',
                                        cursor: 'not-allowed'
                                      }}
                                    >
                                      🚫 OUTSIDE ONLY
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isChecked) {
                                          toggleEventSelection(evt.id, minMembers);
                                        } else {
                                          toggleEventSelection(evt.id, minMembers);
                                          handleOpenEventModal(evt.id);
                                        }
                                      }}
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
                                        padding: '5px 9px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <span>{isChecked ? 'SELECTED ✓' : 'SELECT EVENT +'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Section 5: Payment Details / AJU Exemption */}
            <div className="brut-section brut-section-yellow">
              <div className="brut-section-title">
                <span className="brut-badge brut-badge-pink"></span>
                5. {isAjuExempt ? 'NO-DUES & STUDENT VERIFICATION' : 'PAYMENT VERIFICATION'}
              </div>

              {isAjuExempt ? (
                <div>
                  {/* AJU Exemption Callout Banner */}
                  <div className="aju-exemption-callout">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: '#000000',
                        color: '#FFE600',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: '2px solid #000000',
                        boxShadow: '2px 2px 0px 0px #000000'
                      }}>
                        ⚡ AJU EXEMPTION ACTIVE
                      </span>
                      <span style={{
                        background: '#ffffff',
                        border: '2px solid #000000',
                        padding: '4px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 900,
                        color: '#000000',
                        textTransform: 'uppercase',
                        boxShadow: '2px 2px 0px 0px #000000'
                      }}>
                        FEE: ₹600 (PAID IN NO-DUES)
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#000000', letterSpacing: '-0.01em' }}>
                      NO ONLINE PAYMENT REQUIRED!
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.45, color: '#111111' }}>
                      As an ARKA JAIN University student enrolled in <strong>{effectiveCourse}</strong>, your fest registration fee of ₹600 was collected during your departmental No-Dues clearance.
                    </p>
                    <div style={{
                      background: '#ffffff',
                      border: '2.5px solid #000000',
                      boxShadow: '3px 3px 0px 0px #000000',
                      padding: '10px 14px',
                      marginTop: '12px',
                      color: '#000000',
                      fontSize: '0.82rem',
                      fontWeight: 800
                    }}>
                      📁 <strong>MANDATORY:</strong> Please upload your <strong>₹600 Manual Payment Slip</strong> and your <strong>College ID Card</strong> below for administrative verification.
                    </div>
                  </div>

                  <div className="form-grid">
                    {/* Dropzone 1: ₹600 Manual Payment Slip */}
                    <div className="form-group">
                      <label htmlFor="noDuesSlip">
                        MANUAL PAYMENT SLIP (₹600 NO-DUES) <span className="required">*</span>
                      </label>
                      <div
                        className={`brut-dropzone ${noDuesDragActive ? 'dragover' : ''}`}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setNoDuesDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setNoDuesDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setNoDuesDragActive(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNoDuesDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleNoDuesFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => noDuesInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          id="noDuesSlip"
                          name="noDuesSlip"
                          accept="image/*"
                          className="hidden-file-input"
                          ref={noDuesInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleNoDuesFile(e.target.files[0]);
                            }
                          }}
                        />
                        {!noDuesSlipFile ? (
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}>
                              DROP OR BROWSE ₹600 SLIP
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444444', marginTop: '4px' }}>
                              Manual No-Dues Receipt · JPG, PNG, WEBP · Max 5MB
                            </div>
                          </div>
                        ) : (
                          <div className="file-preview" style={{ color: '#000000' }}>
                            <div className="file-preview-info">
                              <i className="fa-solid fa-receipt file-icon" style={{ color: '#000000' }}></i>
                              <div>
                                <p className="file-name" style={{ color: '#000000', fontWeight: 800 }}>{noDuesSlipFile.name}</p>
                                <p className="file-size" style={{ color: '#444444' }}>{formatBytes(noDuesSlipFile.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoDuesSlipFile(null);
                                if (noDuesInputRef.current) noDuesInputRef.current.value = '';
                              }}
                              style={{ color: '#000000' }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dropzone 2: College ID Card */}
                    <div className="form-group">
                      <label htmlFor="collegeIdCard">
                        COLLEGE ID CARD <span className="required">*</span>
                      </label>
                      <div
                        className={`brut-dropzone ${collegeIdDragActive ? 'dragover' : ''}`}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setCollegeIdDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCollegeIdDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setCollegeIdDragActive(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCollegeIdDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleCollegeIdFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => collegeIdInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          id="collegeIdCard"
                          name="collegeIdCard"
                          accept="image/*"
                          className="hidden-file-input"
                          ref={collegeIdInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCollegeIdFile(e.target.files[0]);
                            }
                          }}
                        />
                        {!collegeIdCardFile ? (
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}>
                              DROP OR BROWSE COLLEGE ID
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444444', marginTop: '4px' }}>
                              Student ID Card · JPG, PNG, WEBP · Max 5MB
                            </div>
                          </div>
                        ) : (
                          <div className="file-preview" style={{ color: '#000000' }}>
                            <div className="file-preview-info">
                              <i className="fa-solid fa-id-card file-icon" style={{ color: '#000000' }}></i>
                              <div>
                                <p className="file-name" style={{ color: '#000000', fontWeight: 800 }}>{collegeIdCardFile.name}</p>
                                <p className="file-size" style={{ color: '#444444' }}>{formatBytes(collegeIdCardFile.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollegeIdCardFile(null);
                                if (collegeIdInputRef.current) collegeIdInputRef.current.value = '';
                              }}
                              style={{ color: '#000000' }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* QR Code Scan Section */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    padding: '24px',
                    background: '#000000',
                    border: '3px solid #ffffff',
                    boxShadow: '4px 4px 0px 0px #ffffff',
                    marginBottom: '24px',
                    textAlign: 'center',
                    color: '#ffffff'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, background: '#FFE600', border: '2px solid #000000', color: '#000000', padding: '4px 12px', textTransform: 'uppercase', boxShadow: '2px 2px 0px 0px #ffffff' }}>
                      Scan to Pay (Total: ₹{totalAmount})
                    </div>
                    {totalAmount > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src={qrCodeDataUrl || qrCodeUrl} 
                          alt={`ARKA JAIN UNIVERSITY Payment QR Code - ₹${totalAmount}`} 
                          style={{ 
                            width: '210px', 
                            height: '210px', 
                            border: '3px solid #ffffff',
                            boxShadow: '3px 3px 0px 0px #ffffff',
                            objectFit: 'contain',
                            background: '#ffffff',
                            padding: '6px'
                          }} 
                        />
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: 'rgba(255,255,255,0.15)',
                          padding: '4px 10px',
                          border: '1px solid #ffffff',
                          color: '#ffffff',
                          marginTop: '4px'
                        }}>
                          Payee: <strong>ARKA JAIN UNIVERSITY</strong> (UPI: <code style={{ color: '#FFE600' }}>3217855a@bandhan</code>)
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: '200px',
                        height: '200px',
                        border: '3px dashed #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        boxSizing: 'border-box',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        textAlign: 'center'
                      }}>
                        Select events above to display ARKA JAIN UNIVERSITY QR Code
                      </div>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="paymentUTR">
                        TRANSACTION UTR (12 DIGITS) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="paymentUTR"
                        id="paymentUTR"
                        required
                        maxLength={12}
                        pattern="\d{12}"
                        inputMode="numeric"
                        placeholder="e.g. 425612348901"
                        value={formData.paymentUTR}
                        onChange={handleInputChange}
                      />
                      <small style={{ color: 'var(--foreground, #000000)', fontWeight: 700, fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {formData.paymentUTR.length === 12 ? (
                          <span style={{ color: '#16a34a', fontWeight: 900 }}>✓ Valid 12-digit UTR</span>
                        ) : (
                          <span>Must be exactly 12 numeric digits ({formData.paymentUTR.length}/12)</span>
                        )}
                      </small>
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
                </>
              )}

              {/* Event Common Rules & Regulations Acceptance Section */}
              {/* Event Common Rules & Regulations Acceptance Section */}
              <div
                className="rules-acceptance-box"
                style={{
                  marginTop: '18px',
                  background: acceptedRules ? '#052e16' : '#081726',
                  border: acceptedRules ? '3px solid #22c55e' : '3px solid #FFE600',
                  boxShadow: acceptedRules ? '4px 4px 0px 0px #22c55e' : '4px 4px 0px 0px #000000',
                  padding: '14px 16px',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    id="acceptCommonRules"
                    name="acceptCommonRules"
                    checked={acceptedRules}
                    onChange={(e) => setAcceptedRules(e.target.checked)}
                    required
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#FFE600',
                      cursor: 'pointer',
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="rules-heading-text" style={{ fontWeight: 900, fontSize: '0.86rem', color: '#ffffff', lineHeight: 1.4 }}>
                      I accept & agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCommonRulesModal(true);
                        }}
                        style={{
                          background: '#FFE600',
                          border: '2px solid #000000',
                          color: '#000000',
                          padding: '2px 6px',
                          fontWeight: 900,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          boxShadow: '1.5px 1.5px 0px 0px #000000',
                          display: 'inline-block',
                          margin: '0 2px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Event Common Rules & Regulations ↗
                      </button>{' '}
                      and Disqualification Criteria of Technika 6.0. <span style={{ color: '#ef4444' }}>*</span>
                    </div>
                    <p className="rules-sub-text" style={{ margin: '6px 0 0 0', fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      Participants must carry valid college/school ID cards, report at least 30 minutes before scheduled times, and follow fair play regulations.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="error-panel" style={{ display: 'flex', background: '#ffffff', border: '3px solid #000000', color: '#ef4444', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-exclamation error-icon"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="submit-action-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', width: '100%' }}>
              <div className="submit-action-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
                <button
                  type="submit"
                  className="brut-btn-pink"
                  disabled={loading || !acceptedRules}
                  title={!acceptedRules ? 'Please accept the Event Rules & Regulations above to enable submission' : ''}
                >
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
                    fontSize: '0.84rem',
                    textTransform: 'uppercase',
                    color: 'var(--foreground)',
                    textDecoration: 'underline',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                  }}
                >
                  HAVE AN ACCOUNT? LOG IN
                </Link>
              </div>
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

            {createdTeams && createdTeams.length > 0 && (
              <div style={{
                marginTop: '18px',
                marginBottom: '18px',
                background: '#000000',
                border: '3px solid #FFE600',
                boxShadow: '4px 4px 0px 0px #FFE600',
                padding: '16px 20px',
                color: '#ffffff',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ background: '#FFE600', color: '#000000', fontWeight: 900, fontSize: '0.75rem', padding: '2px 8px', border: '1px solid #000' }}>
                    👑 YOU ARE TEAM LEADER
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Share Team ID with Teammates:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {createdTeams.map((t, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid #ffffff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFE600' }}>{t.eventName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Team Name: <strong>{t.teamName}</strong> · Team ID: <code style={{ background: '#ffffff', color: '#000000', padding: '2px 6px', fontWeight: 900, fontSize: '0.88rem' }}>{t.teamId}</code></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(t.teamId);
                            alert(`Copied Team ID ${t.teamId} to clipboard!`);
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#000000',
                            border: '1.5px solid #000',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            cursor: 'pointer'
                          }}
                        >
                          📋 Copy Code
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey! I created our team for ${t.eventName} at Technika 6.0! Join our team by entering Team ID: *${t.teamId}* when registering at: ${window.location.origin}/register`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#25D366',
                            color: '#ffffff',
                            border: '1.5px solid #000',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fa-brands fa-whatsapp"></i> Share on WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      <EventDetailsModal
        event={activeModalEvent}
        onClose={handleCloseEventModal}
        isSelected={activeModalEvent ? selectedEvents.includes(activeModalEvent.id) : false}
        onToggleSelect={(eventId) => {
          const detail = getEventDetails(eventId);
          toggleEventSelection(eventId, detail?.minMembers);
        }}
        config={activeModalEvent ? eventConfigs[activeModalEvent.id] : undefined}
        onUpdateConfig={(eventId, updates) => updateEventConfig(eventId, updates)}
        teamCheckStatus={activeModalEvent ? teamCheckStatus[activeModalEvent.id] : undefined}
        onValidateTeamCode={(eventId, teamId) => handleValidateTeamCode(eventId, teamId)}
        formDataName={formData.name}
      />

      <CommonRulesModal
        isOpen={showCommonRulesModal}
        onClose={() => setShowCommonRulesModal(false)}
        onAccept={() => setAcceptedRules(true)}
      />
    </div>
  );
};
