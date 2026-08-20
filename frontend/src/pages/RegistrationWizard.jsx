import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ReBidLogo } from '../components/ReBidLogo';
import { 
  ArrowRight, ArrowLeft, CheckCircle, Upload, Loader, 
  AlertCircle, RefreshCw, ShoppingBag, Truck, ShieldCheck, 
  Lock, Building, CreditCard, FileCheck, Check 
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function RegistrationWizard({ onNavigate = null }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    role: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company_name: '',
    category: 'IT Hardware',
    rep_name: '',
    rep_designation: '',
    rep_phone: '',
    rep_email: '',
    gst_number: '',
    pan_number: '',
    cin: '',
    org_type: '',
    years_in_business: '',
    registered_address: '',
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi: ''
  });
  
  const [userId, setUserId] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const [documents, setDocuments] = useState({
    signatory_id: null,
    company_profile: null,
    logo: null,
    tax_id: null,
    address_proof: null,
    business_license: null,
    certification: null,
    bank_info: null
  });

  const [uploadingDoc, setUploadingDoc] = useState(null);

  const docLabels = {
    business_license: { label: 'Business Registration / MSME / CIN', required: true },
    tax_id: { label: 'GSTIN / Tax Registration Certificate', required: true },
    signatory_id: { label: 'Authorized Signatory ID (PAN / Aadhaar / Passport)', required: true },
    bank_info: { label: 'Bank Account Proof (Cancelled Cheque / Statement)', required: true },
    company_profile: { label: 'Company Profile & Capabilities PDF', required: false },
    logo: { label: 'Official Company Brand Logo', required: false },
    certification: { label: 'Industry Certifications (ISO / CMMI / GeM)', required: false },
    address_proof: { label: 'Registered Business Address Proof', required: false }
  };

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // WebOTP API Integration for mobile/browser auto-filling
  useEffect(() => {
    if ('OTPCredential' in window && step === 4 && otpSent && !verifying) {
      const ac = new AbortController();
      navigator.credentials.get({
        otp: { transport: ['sms', 'email'] },
        signal: ac.signal
      }).then(otp => {
        if (otp && otp.code) {
          const digits = otp.code.slice(0, 6).split('');
          setOtpDigits(digits);
          handleVerifyOtp(otp.code.slice(0, 6));
        }
      }).catch(err => {
        // Handled silently for unsupported environments
      });
      return () => ac.abort();
    }
  }, [step, otpSent, verifying]);

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setError('');
  };

  // --- Validation Helpers ---
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone) => phone.replace(/\D/g, '').length >= 10;
  const isValidGST = (gst) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.trim()) || gst.trim().length === 15;
  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim()) || pan.trim().length === 10;
  const isValidIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim()) || ifsc.trim().length === 11;

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.name.trim()) return 'Please enter your Full Name or Entity Contact.';
    if (!isValidEmail(formData.email)) return 'Please provide a valid email address.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters long.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.company_name.trim()) return 'Company / Business Name is required.';
    if (!formData.rep_name.trim()) return 'Authorized Representative Name is required.';
    if (!formData.rep_designation.trim()) return 'Representative Designation is required.';
    if (!isValidPhone(formData.rep_phone)) return 'Valid 10-digit Phone Number is required.';
    if (!isValidEmail(formData.rep_email)) return 'Valid Representative Email is required.';
    if (formData.role === 'VENDOR') {
      if (!formData.gst_number.trim() || !isValidGST(formData.gst_number)) return 'Valid 15-character GSTIN is required.';
      if (!formData.pan_number.trim() || !isValidPAN(formData.pan_number)) return 'Valid 10-character PAN Number is required.';
      if (!formData.org_type) return 'Please select Organization Type.';
      if (!formData.registered_address.trim()) return 'Registered Business Address is required.';
    }
    return null;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    if (formData.role === 'VENDOR') {
      if (!formData.bank_account_name.trim()) return 'Beneficiary Bank Account Name is required.';
      if (!formData.bank_name.trim()) return 'Bank Name is required.';
      if (!formData.bank_account_number.trim()) return 'Bank Account Number is required.';
      if (!isValidIFSC(formData.bank_ifsc)) return 'Valid 11-character IFSC Code is required.';
    }
    return null;
  };

  // Step 5 Validation (Document Uploads)
  const isDocUploaded = (docType) => documents[docType] !== null;
  const canProceedStep5 = formData.role === 'BUYER' || (
    isDocUploaded('business_license') &&
    isDocUploaded('tax_id') &&
    isDocUploaded('signatory_id') &&
    isDocUploaded('bank_info')
  );

  const handleStep2Continue = () => {
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    // Autofill rep fields from Step 2 if not yet set
    setFormData(prev => ({
      ...prev,
      company_name: prev.company_name || prev.name,
      rep_name: prev.rep_name || prev.name,
      rep_email: prev.rep_email || prev.email
    }));
    setStep(3);
  };

  const handleStep3Continue = () => {
    const err = validateStep3();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    // For Buyers, pre-fill bank account name if needed
    if (formData.role === 'BUYER') {
      setFormData(prev => ({
        ...prev,
        bank_account_name: prev.bank_account_name || prev.company_name || prev.name,
        bank_name: prev.bank_name || 'HDFC Bank',
        bank_account_number: prev.bank_account_number || '000000000000',
        bank_ifsc: prev.bank_ifsc || 'HDFC0000001'
      }));
    }
    setStep(4);
  };

  const handleOtpDigitChange = (index, value) => {
    // If user pasted or typed full 6 digits
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      cleanDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (cleanDigits.length === 6) {
        handleVerifyOtp(cleanDigits.join(''));
      }
      return;
    }

    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (index === 5 && value) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length > 0) {
      const digits = paste.split('');
      const newDigits = ['', '', '', '', '', ''];
      digits.forEach((d, i) => { newDigits[i] = d; });
      setOtpDigits(newDigits);
      if (paste.length === 6) {
        handleVerifyOtp(paste);
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/send-otp`, { email: formData.email });
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndSendCode = async () => {
    const err = validateStep4();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        role: formData.role,
        company_name: formData.company_name.trim(),
        category: formData.category,
        rep_name: formData.rep_name.trim(),
        rep_designation: formData.rep_designation.trim(),
        rep_phone: formData.rep_phone.trim(),
        rep_email: formData.rep_email.trim(),
        gst_number: formData.gst_number.trim().toUpperCase(),
        pan_number: formData.pan_number.trim().toUpperCase(),
        cin: formData.cin.trim().toUpperCase(),
        org_type: formData.org_type,
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : 0,
        registered_address: formData.registered_address.trim(),
        bank_account_name: formData.bank_account_name.trim(),
        bank_name: formData.bank_name.trim(),
        bank_account_number: formData.bank_account_number.trim(),
        bank_ifsc: formData.bank_ifsc.trim().toUpperCase(),
        bank_upi: formData.bank_upi.trim()
      };

      const res = await axios.post(`${API_BASE}/auth/register`, payload);

      setUserId(res.data.user_id);
      setOtpSent(true);
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    if (otpCode.length !== 6) return;
    
    setVerifying(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: formData.email.trim(),
        otp_code: otpCode
      });
      // If Buyer, skip document upload directly to review or success
      if (formData.role === 'BUYER') {
        setStep(6);
      } else {
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please check and re-enter.');
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setVerifying(false);
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    setUploadingDoc(docType);
    setError('');

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const uploadRes = await axios.post('http://localhost:8001/api/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = uploadRes.data.url;

      await axios.post(`${API_BASE}/auth/upload-document?user_id=${userId}&doc_type=${docType}&file_url=${encodeURIComponent(fileUrl)}`);

      setDocuments(prev => ({ ...prev, [docType]: file }));
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${docLabels[docType]?.label || docType}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/submit-application`, { user_id: userId });
      setStep(7);
    } catch (err) {
      // If Buyer with no docs requirement, proceed to step 7
      if (formData.role === 'BUYER') {
        setStep(7);
      } else {
        setError(err.response?.data?.detail || 'Failed submitting application');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #CBD5E1',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.04)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '6px'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC', 
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '720px', 
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.14), 0 10px 20px -5px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        padding: '36px'
      }}>
        {/* Logo & Step Tracker */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <ReBidLogo size="md" variant="dark" style={{ marginBottom: '14px' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div key={s} style={{ 
                flex: 1, 
                height: '5px', 
                backgroundColor: s <= step ? '#059669' : '#E2E8F0',
                marginRight: s < 7 ? '6px' : '0',
                borderRadius: '3px',
                transition: 'background-color 0.3s ease'
              }} />
            ))}
          </div>
          <p style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
            Step {step} of 7: {
              step === 1 ? 'Select Organization Role' :
              step === 2 ? 'Account Credentials' :
              step === 3 ? 'Organization & Rep Profile' :
              step === 4 ? 'Bank Details & Email Verification' :
              step === 5 ? 'Document Verification' :
              step === 6 ? 'Compliance Review' : 'Registration Complete'
            }
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '10px',
            color: '#991B1B',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ---------------- STEP 1: ROLE SELECTION ---------------- */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Select Account Role</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Choose your organization's participation type on ReBid</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('BUYER')}
                style={{
                  padding: '28px 20px',
                  border: formData.role === 'BUYER' ? '2.5px solid #0F172A' : '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  backgroundColor: formData.role === 'BUYER' ? '#F8FAFC' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: formData.role === 'BUYER' ? '0 8px 20px rgba(15, 23, 42, 0.12)' : '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <ShoppingBag size={24} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>Buyer Organization</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Create reverse auctions & award contracts with AI evaluation</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('VENDOR')}
                style={{
                  padding: '28px 20px',
                  border: formData.role === 'VENDOR' ? '2.5px solid #059669' : '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  backgroundColor: formData.role === 'VENDOR' ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: formData.role === 'VENDOR' ? '0 8px 20px rgba(5, 150, 105, 0.15)' : '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', backgroundColor: '#059669', borderRadius: '12px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <Truck size={24} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>Vendor / Supplier</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Participate in competitive procurement auctions and win POs</div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!formData.role) {
                  setError('Please select a role to continue');
                  return;
                }
                setError('');
                setStep(2);
              }}
              disabled={!formData.role}
              style={{
                width: '100%',
                marginTop: '28px',
                padding: '14px',
                backgroundColor: formData.role ? (formData.role === 'VENDOR' ? '#059669' : '#0F172A') : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: formData.role ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue to Account Details <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ---------------- STEP 2: ACCOUNT CREDENTIALS ---------------- */}
        {step === 2 && (
          <div>
            <button type="button" onClick={() => setStep(1)} style={{ marginBottom: '18px', padding: '6px 0', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Back to Role Selection
            </button>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Account Information</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Enter login credentials for your {formData.role} account</p>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Contact Person Full Name *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                style={inputStyle} 
                placeholder="e.g. Rajesh Sharma" 
                required 
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Official Email Address *</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                style={inputStyle} 
                placeholder="you@company.com" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Password (Min. 6 Chars) *</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  style={inputStyle} 
                  required 
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                  style={inputStyle} 
                  required 
                />
                {formData.confirmPassword && (
                  <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '700', color: formData.password === formData.confirmPassword ? '#059669' : '#DC2626' }}>
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStep2Continue}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue to Organization Profile <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ---------------- STEP 3: COMPANY & REP DETAILS ---------------- */}
        {step === 3 && (
          <div>
            <button type="button" onClick={() => setStep(2)} style={{ marginBottom: '18px', padding: '6px 0', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Back to Credentials
            </button>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Organization & Legal Profile</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Provide registered company details and representative information</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Legal Entity / Company Name *</label>
                <input 
                  type="text" 
                  value={formData.company_name} 
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} 
                  style={inputStyle} 
                  placeholder="Official Company Pvt Ltd" 
                  required 
                />
              </div>

              <div>
                <label style={labelStyle}>Procurement Category *</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                  style={inputStyle}
                >
                  <option value="IT Hardware">IT Hardware</option>
                  <option value="Raw Materials & Metals">Raw Materials & Metals</option>
                  <option value="Construction & Infrastructure">Construction & Infrastructure</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="Software & Cloud Services">Software & Cloud Services</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Authorized Rep Name *</label>
                <input 
                  type="text" 
                  value={formData.rep_name} 
                  onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })} 
                  style={inputStyle} 
                  placeholder="e.g. Rajesh Sharma"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Representative Designation *</label>
                <input 
                  type="text" 
                  value={formData.rep_designation} 
                  onChange={(e) => setFormData({ ...formData, rep_designation: e.target.value })} 
                  style={inputStyle} 
                  placeholder="e.g. Managing Director"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Rep Phone (10 Digits) *</label>
                <input 
                  type="tel" 
                  value={formData.rep_phone} 
                  onChange={(e) => setFormData({ ...formData, rep_phone: e.target.value })} 
                  style={inputStyle} 
                  placeholder="+91 9876543210" 
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Rep Contact Email *</label>
                <input 
                  type="email" 
                  value={formData.rep_email} 
                  onChange={(e) => setFormData({ ...formData, rep_email: e.target.value })} 
                  style={inputStyle} 
                  placeholder="rep@company.com" 
                  required
                />
              </div>
            </div>

            {formData.role === 'VENDOR' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>GSTIN (15 Digits) *</label>
                    <input 
                      type="text" 
                      value={formData.gst_number} 
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} 
                      style={inputStyle} 
                      placeholder="22AAAAA0000A1Z5" 
                      maxLength={15}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PAN Number *</label>
                    <input 
                      type="text" 
                      value={formData.pan_number} 
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })} 
                      style={inputStyle} 
                      placeholder="ABCDE1234F" 
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CIN (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.cin} 
                      onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })} 
                      style={inputStyle} 
                      placeholder="U12345MH2020PTC123456"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Organization Type *</label>
                    <select 
                      value={formData.org_type} 
                      onChange={(e) => setFormData({ ...formData, org_type: e.target.value })} 
                      style={inputStyle}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietor">Sole Proprietor</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Years in Business</label>
                    <input 
                      type="number" 
                      value={formData.years_in_business} 
                      onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })} 
                      style={inputStyle} 
                      placeholder="5" 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Registered Business Address *</label>
                  <textarea 
                    value={formData.registered_address} 
                    onChange={(e) => setFormData({ ...formData, registered_address: e.target.value })} 
                    style={{ ...inputStyle, minHeight: '70px' }} 
                    placeholder="Complete corporate registered address" 
                    required
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleStep3Continue}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue to Verification & Bank Details <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ---------------- STEP 4: BANK DETAILS & OTP VERIFICATION ---------------- */}
        {step === 4 && (
          <div>
            <button type="button" onClick={() => setStep(3)} style={{ marginBottom: '18px', padding: '6px 0', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Back to Profile
            </button>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Banking & Email Verification</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Provide direct settlement banking details and verify email ownership</p>

            {formData.role === 'VENDOR' && (
              <div style={{ marginBottom: '24px', padding: '18px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#059669" /> Direct Settlement Bank Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>Account Holder Name *</label>
                    <input 
                      type="text" 
                      value={formData.bank_account_name} 
                      onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} 
                      style={inputStyle} 
                      placeholder="As per bank passbook" 
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Bank Name *</label>
                    <input 
                      type="text" 
                      value={formData.bank_name} 
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} 
                      style={inputStyle} 
                      placeholder="e.g. HDFC Bank" 
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Account Number *</label>
                    <input 
                      type="text" 
                      value={formData.bank_account_number} 
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} 
                      style={inputStyle} 
                      placeholder="Account number" 
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>IFSC Code (11 Chars) *</label>
                    <input 
                      type="text" 
                      value={formData.bank_ifsc} 
                      onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })} 
                      style={inputStyle} 
                      placeholder="HDFC0001234" 
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email OTP Box */}
            <div style={{ padding: '24px', backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ShieldCheck size={22} color="#059669" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#166534' }}>Email OTP Verification</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#15803D', marginBottom: '18px' }}>
                A 6-digit verification code will be dispatched to: <strong>{formData.email}</strong>
              </p>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleRegisterAndSendCode}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <Loader size={18} className="spin" /> : <Mail size={18} />}
                  {loading ? 'Registering & Dispatching OTP...' : 'Register Account & Send Verification Code'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '18px' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handlePasteOtp}
                        disabled={verifying}
                        style={{
                          width: '54px',
                          height: '62px',
                          textAlign: 'center',
                          fontSize: '26px',
                          fontWeight: '800',
                          color: '#0F172A',
                          backgroundColor: '#FFFFFF',
                          border: digit ? '2px solid #059669' : '2px solid #94A3B8',
                          borderRadius: '12px',
                          boxShadow: digit ? '0 0 0 3px rgba(5, 150, 105, 0.2)' : 'none',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>

                  {verifying && (
                    <div style={{ textAlign: 'center', marginBottom: '14px', color: '#059669', fontWeight: '700', fontSize: '13px' }}>
                      <Loader size={16} className="spin" style={{ display: 'inline', marginRight: '6px' }} />
                      Verifying code...
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: '#166534' }}>Code expires in 10 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || loading}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: cooldown > 0 ? '#94A3B8' : '#059669',
                        cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : <><RefreshCw size={13} /> Resend OTP Code</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- STEP 5: DOCUMENT UPLOAD (VENDOR) ---------------- */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Mandatory Compliance Documents</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
              Upload business documents for administrator verification. Required documents are marked with (*).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {Object.entries(docLabels).map(([docType, { label, required }]) => {
                const file = documents[docType];
                const isUploading = uploadingDoc === docType;

                return (
                  <div key={docType} style={{ 
                    padding: '14px 18px', 
                    border: file ? '1.5px solid #86EFAC' : required ? '1.5px solid #CBD5E1' : '1px dashed #CBD5E1',
                    borderRadius: '12px',
                    backgroundColor: file ? '#F0FDF4' : '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
                      </div>
                      {file ? (
                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> {file.name} (Uploaded)
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          Supported formats: PDF, PNG, JPG (Max 10MB)
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="file"
                        id={`file-${docType}`}
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                      />
                      <label 
                        htmlFor={`file-${docType}`}
                        className="btn btn-secondary"
                        style={{ 
                          fontSize: '12px', 
                          height: '34px', 
                          padding: '0 12px', 
                          cursor: 'pointer',
                          backgroundColor: file ? '#FFFFFF' : '#F8FAFC'
                        }}
                      >
                        {isUploading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
                        {file ? 'Re-upload' : 'Upload File'}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!canProceedStep5) {
                  setError('Please upload all 4 mandatory documents marked with (*) to continue.');
                  return;
                }
                setError('');
                setStep(6);
              }}
              disabled={!canProceedStep5}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: canProceedStep5 ? '#059669' : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: canProceedStep5 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue to Final Review <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ---------------- STEP 6: COMPLIANCE REVIEW & SUBMIT ---------------- */}
        {step === 6 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Review & Submit Application</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
              Confirm your registration data before submitting to Compliance Administration
            </p>

            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748B' }}>Account Role:</span> <b>{formData.role}</b></div>
                <div><span style={{ color: '#64748B' }}>Entity Name:</span> <b>{formData.company_name}</b></div>
                <div><span style={{ color: '#64748B' }}>Representative:</span> <b>{formData.rep_name} ({formData.rep_designation})</b></div>
                <div><span style={{ color: '#64748B' }}>Contact Email:</span> <b>{formData.email} (Verified ✓)</b></div>
                <div><span style={{ color: '#64748B' }}>Phone:</span> <b>{formData.rep_phone}</b></div>
                <div><span style={{ color: '#64748B' }}>Category:</span> <b>{formData.category}</b></div>
                {formData.role === 'VENDOR' && (
                  <>
                    <div><span style={{ color: '#64748B' }}>GSTIN:</span> <code>{formData.gst_number}</code></div>
                    <div><span style={{ color: '#64748B' }}>PAN:</span> <code>{formData.pan_number}</code></div>
                    <div><span style={{ color: '#64748B' }}>Bank Account:</span> <b>{formData.bank_name} ({formData.bank_ifsc})</b></div>
                    <div><span style={{ color: '#64748B' }}>Documents Attached:</span> <b>{Object.values(documents).filter(d => d).length} Files</b></div>
                  </>
                )}
              </div>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', color: '#92400E', fontSize: '13px', marginBottom: '24px' }}>
              <b>Notice:</b> Submitting this application places your account into <b>Pending Administrator Review</b>. You will be able to log in to track review status, and full portal access will activate upon admin approval.
            </div>

            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" /> Submitting Application...
                </>
              ) : (
                <>
                  Submit Application for Admin Approval <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ---------------- STEP 7: REGISTRATION SUBMITTED & APPROVAL REQUIRED ---------------- */}
        {step === 7 && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ 
              width: '76px', 
              height: '76px', 
              borderRadius: '50%', 
              backgroundColor: '#ECFDF5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              border: '3px solid #86EFAC'
            }}>
              <CheckCircle size={42} color="#059669" />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
              Application Submitted for Approval
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Your {formData.role} account <strong>{formData.company_name || formData.name}</strong> has been registered with ID <code style={{ color: '#059669', fontWeight: '700' }}>{userId}</code>.
              <br /><br />
              <strong>Account Status: Pending Admin Verification</strong><br />
              Compliance Administration will review your credentials. You may sign in at any time to check real-time verification progress.
            </p>

            <button
              type="button"
              onClick={() => navigateTo('/auth/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 36px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              }}
            >
              Proceed to Sign In <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegistrationWizard;
