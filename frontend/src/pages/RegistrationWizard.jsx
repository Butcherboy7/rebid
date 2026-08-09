import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, Loader, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function RegistrationWizard() {
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

  const docLabels = {
    signatory_id: 'Signatory ID Proof',
    company_profile: 'Company Profile PDF',
    logo: 'Company Logo',
    tax_id: 'Tax Certificate',
    address_proof: 'Address Proof',
    business_license: 'Business License',
    certification: 'Industry Certification',
    bank_info: 'Bank Information'
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (index === 5 && value) {
      handleVerifyOtp(newDigits.join(''));
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
    if (paste.length === 6) {
      setOtpDigits(paste.split(''));
      handleVerifyOtp(paste);
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

  const handleVerifyOtp = async (otpCode) => {
    if (otpCode.length !== 6) return;
    
    setVerifying(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: formData.email,
        otp_code: otpCode
      });
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        company_name: formData.company_name,
        category: formData.category,
        rep_name: formData.rep_name,
        rep_designation: formData.rep_designation,
        rep_phone: formData.rep_phone,
        rep_email: formData.rep_email,
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        cin: formData.cin,
        org_type: formData.org_type,
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        registered_address: formData.registered_address,
        bank_account_name: formData.bank_account_name,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
        bank_upi: formData.bank_upi
      };

      const res = await axios.post(`${API_BASE}/auth/register`, payload);

      setUserId(res.data.user_id);
      setOtpSent(true);
      setCooldown(60);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const uploadRes = await axios.post('http://localhost:8001/api/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = uploadRes.data.url;

      await axios.post(`${API_BASE}/auth/upload-document?user_id=${userId}&doc_type=${docType}&file_url=${encodeURIComponent(fileUrl)}`);

      setDocuments({ ...documents, [docType]: file });
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${docLabels[docType]}`);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/submit-application`, { user_id: userId });
      setStep(7);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep4 = Object.values(documents).every(doc => doc !== null);

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9FAFB', 
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '680px', 
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.14), 0 8px 16px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        padding: '40px'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div key={s} style={{ 
                flex: 1, 
                height: '4px', 
                backgroundColor: s <= step ? '#0F172A' : '#E2E8F0',
                marginRight: s < 7 ? '8px' : '0',
                borderRadius: '2px'
              }} />
            ))}
          </div>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            Step {step} of 7
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Select Your Role</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Are you a buyer or a vendor?</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                onClick={() => handleRoleSelect('BUYER')}
                style={{
                  padding: '32px',
                  border: formData.role === 'BUYER' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: formData.role === 'BUYER' ? '#F8FAFC' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ShoppingBag size={32} style={{ marginBottom: '12px', color: '#0F172A' }} />
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Buyer</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>Post procurement requests</div>
              </button>

              <button
                onClick={() => handleRoleSelect('VENDOR')}
                style={{
                  padding: '32px',
                  border: formData.role === 'VENDOR' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: formData.role === 'VENDOR' ? '#F8FAFC' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Truck size={32} style={{ marginBottom: '12px', color: '#059669' }} />
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Vendor</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>Bid on auctions</div>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.role}
              style={{
                width: '100%',
                marginTop: '32px',
                padding: '14px',
                backgroundColor: formData.role ? '#0F172A' : '#E2E8F0',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: formData.role ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ marginBottom: '24px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Account Information</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Enter your login credentials</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="you@example.com" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>{formData.role === 'BUYER' ? 'Company Name' : 'Business Name'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder={formData.role === 'BUYER' ? 'Your Company' : 'Your Business'} />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={loading || !formData.email || !formData.password || !formData.name}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#94A3B8' : '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 3: Company & Rep Details */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} style={{ marginBottom: '24px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Company & Representative Details</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Provide your business registration details</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Company Name</label>
              <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} style={inputStyle} placeholder="Official Company Name" />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                <option value="IT Hardware">IT Hardware</option>
                <option value="Raw Materials & Metals">Raw Materials & Metals</option>
                <option value="Construction & Infrastructure">Construction & Infrastructure</option>
                <option value="Logistics & Freight">Logistics & Freight</option>
                <option value="Software & Cloud Services">Software & Cloud Services</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Authorized Rep Name</label>
                <input type="text" value={formData.rep_name} onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Designation</label>
                <input type="text" value={formData.rep_designation} onChange={(e) => setFormData({ ...formData, rep_designation: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Rep Phone</label>
                <input type="tel" value={formData.rep_phone} onChange={(e) => setFormData({ ...formData, rep_phone: e.target.value })} style={inputStyle} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label style={labelStyle}>Rep Email</label>
                <input type="email" value={formData.rep_email} onChange={(e) => setFormData({ ...formData, rep_email: e.target.value })} style={inputStyle} placeholder="rep@company.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>GST Number</label>
                <input type="text" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} style={inputStyle} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label style={labelStyle}>PAN Number</label>
                <input type="text" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} style={inputStyle} placeholder="AAAAA0000A" />
              </div>
              <div>
                <label style={labelStyle}>CIN (Optional)</label>
                <input type="text" value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Organization Type</label>
                <select value={formData.org_type} onChange={(e) => setFormData({ ...formData, org_type: e.target.value })} style={inputStyle}>
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
                <input type="number" value={formData.years_in_business} onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })} style={inputStyle} placeholder="5" />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Registered Address</label>
              <textarea value={formData.registered_address} onChange={(e) => setFormData({ ...formData, registered_address: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Full registered business address" />
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 4: Bank Details & OTP */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} style={{ marginBottom: '24px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Bank Details & Verification</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Provide bank details and verify your email</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Bank Account Name</label>
                <input type="text" value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} style={inputStyle} placeholder="Account Holder Name" />
              </div>
              <div>
                <label style={labelStyle}>Bank Name</label>
                <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} style={inputStyle} placeholder="HDFC Bank" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={labelStyle}>Account Number</label>
                <input type="text" value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>IFSC Code</label>
                <input type="text" value={formData.bank_ifsc} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })} style={inputStyle} placeholder="HDFC0001234" />
              </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '14px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Email Verification</h3>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
                We'll send a 6-digit code to: <strong>{formData.email}</strong>
              </p>

              {!otpSent ? (
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Sending verification code...' : 'Register & Send Code'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handlePasteOtp}
                        disabled={verifying}
                        style={{
                          width: '52px',
                          height: '60px',
                          textAlign: 'center',
                          fontSize: '26px',
                          fontWeight: '800',
                          color: '#0F172A',
                          backgroundColor: '#FFFFFF',
                          border: digit ? '2px solid #059669' : '2px solid #64748B',
                          borderRadius: '10px',
                          boxShadow: digit
                            ? '0 0 0 4px rgba(5, 150, 105, 0.2), 0 4px 12px rgba(5, 150, 105, 0.15)'
                            : '0 2px 6px rgba(15, 23, 42, 0.12), inset 0 2px 4px rgba(0,0,0,0.05)',
                          outline: 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    ))}
                  </div>

                  {verifying && (
                    <div style={{ textAlign: 'center', marginBottom: '16px', color: '#059669', fontWeight: '600' }}>
                      <Loader size={16} className="spin" style={{ marginRight: '8px' }} />
                      Verifying...
                    </div>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || loading}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: cooldown > 0 ? '#94A3B8' : '#059669',
                        cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        margin: '0 auto'
                      }}
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : (
                        <>
                          <RefreshCw size={14} /> Resend Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Document Upload */}
        {step === 5 && (
          <div>
            <button onClick={() => setStep(4)} style={{ marginBottom: '24px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Upload Documents</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>
              Upload mandatory verification documents
            </p>

            {Object.entries(documents).slice(0, 8).map(([docType, file]) => (
              <div key={docType} style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>{docLabels[docType]}</label>
                <div style={{ 
                  padding: '20px',
                  border: '2px dashed #E2E8F0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: file ? '#F0FDF4' : '#F9FAFB'
                }}>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                    style={{ display: 'none' }}
                    id={`upload-${docType}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor={`upload-${docType}`} style={{ cursor: 'pointer' }}>
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669' }}>
                        <CheckCircle size={20} />
                        <span style={{ fontWeight: '600' }}>{file.name}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748B' }}>
                        <Upload size={20} />
                        <span>Click to upload</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={() => setStep(6)}
              disabled={!canProceedStep4}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '14px',
                backgroundColor: canProceedStep4 ? '#059669' : '#E2E8F0',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: canProceedStep4 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {step === 6 && (
          <div>
            <button onClick={() => setStep(5)} style={{ marginBottom: '24px', padding: '8px', backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Back
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Review & Submit</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>
              Confirm your application details before submission
            </p>

            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#64748B' }}>Company:</strong> {formData.company_name || formData.name}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#64748B' }}>Email:</strong> {formData.email}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#64748B' }}>Role:</strong> {formData.role}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#64748B' }}>GST Number:</strong> {formData.gst_number || 'Not provided'}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#64748B' }}>PAN Number:</strong> {formData.pan_number || 'Not provided'}
              </div>
              <div>
                <strong style={{ color: '#64748B' }}>Documents Uploaded:</strong> {Object.values(documents).filter(d => d).length} / 8
              </div>
            </div>

            <button
              onClick={handleSubmitApplication}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application for Admin Review <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 7: Success */}
        {step === 7 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle size={40} color="#059669" />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Application Submitted!</h2>
            <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: '1.6' }}>
              Your application has been submitted for admin review.<br />
              You will be notified once approved.
            </p>

            <a
              href="/auth/login"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Proceed to Login
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function ShoppingBag({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}

function Truck({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
