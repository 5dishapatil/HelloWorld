import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';

interface ForgotStepConfig {
  badge: string;
  title: string;
  body: string;
  progressWidth: string;
  progressLabel: string;
}

const STEP_CONFIGS: Record<number, ForgotStepConfig> = {
  1: {
    badge: 'STEP B1 / 6',
    title: 'Enter Your Username',
    body: 'First, enter your Username or Customer ID so the system knows which account to recover. For this practice demo, use sample details only. <span style="color:var(--sbi-red);font-weight:600;">Do NOT use real credentials.</span>',
    progressWidth: '16%',
    progressLabel: 'Step 1 of 6 — Enter Username',
  },
  2: {
    badge: 'STEP B2 / 6',
    title: 'Enter Your Account Number',
    body: 'Now enter your account number. This helps verify your identity. For practice, you may use a sample number like <strong>"0000123456789"</strong>. <span style="color:var(--sbi-red);font-weight:600;">Do NOT use a real account number.</span>',
    progressWidth: '33%',
    progressLabel: 'Step 2 of 6 — Account Number',
  },
  3: {
    badge: 'STEP B3 / 6',
    title: 'Enter Registered Mobile Number',
    body: 'Enter the mobile number registered with your bank account. For practice, use a sample number like <strong>"9999999999"</strong>. <span style="color:var(--sbi-red);font-weight:600;">Do NOT enter your real mobile number.</span>',
    progressWidth: '50%',
    progressLabel: 'Step 3 of 6 — Mobile & Date of Birth',
  },
  4: {
    badge: 'STEP B3b',
    title: 'Enter Date of Birth',
    body: 'Enter your date of birth as verification. For practice, use a sample date like <strong>"01/01/1990"</strong>. <span style="color:var(--sbi-red);font-weight:600;">Do NOT enter your real date of birth.</span>',
    progressWidth: '50%',
    progressLabel: 'Step 3b of 6 — Date of Birth',
  },
  5: {
    badge: 'STEP B4 / 6',
    title: 'Enter the OTP',
    body: 'A One Time Password (OTP) would normally be sent to your mobile. In this training demo, the practice OTP is shown above the input box. Type <strong>123456</strong> to continue. <span style="color:var(--sbi-red);font-weight:600;">Do NOT enter a real OTP.</span>',
    progressWidth: '66%',
    progressLabel: 'Step 4 of 6 — OTP Verification',
  },
  6: {
    badge: 'STEP B5 / 6',
    title: 'Create Your New Password',
    body: 'Create a new password for practice. <span style="color:var(--sbi-red);font-weight:600;">Do NOT use your real password.</span> Use a sample like <strong>"Practice@1"</strong>. Passwords should be 8+ characters with letters and numbers.',
    progressWidth: '83%',
    progressLabel: 'Step 5 of 6 — Create New Password',
  },
  7: {
    badge: 'STEP B6 / 6',
    title: 'Confirm Your New Password',
    body: 'Type the same practice password again to confirm. Both passwords must match to continue.',
    progressWidth: '100%',
    progressLabel: 'Step 6 of 6 — Confirm Password',
  },
};

const ForgotPasswordScreen: React.FC = () => {
  const { showScreen } = useAppContext();
  const { speak } = useSpeech();

  const [forgotStep, setForgotStep] = useState(1);
  const [fpUser, setFpUser] = useState('');
  const [fpAcc, setFpAcc] = useState('');
  const [fpMobile, setFpMobile] = useState('');
  const [fpDob, setFpDob] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPw, setFpNewPw] = useState('');
  const [fpConfirmPw, setFpConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notes/errors
  const [showNoteUser, setShowNoteUser] = useState(false);
  const [showNoteAcc, setShowNoteAcc] = useState(false);
  const [showNoteMobile, setShowNoteMobile] = useState(false);
  const [showNoteDob, setShowNoteDob] = useState(false);
  const [showNoteOtp, setShowNoteOtp] = useState(false);
  const [showErrOtp, setShowErrOtp] = useState(false);
  const [showNoteNewPw, setShowNoteNewPw] = useState(false);
  const [showErrNewPw, setShowErrNewPw] = useState(false);
  const [showNoteConfirm, setShowNoteConfirm] = useState(false);
  const [showErrConfirm, setShowErrConfirm] = useState(false);
  const [resetBtnActive, setResetBtnActive] = useState(false);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs: Record<number, React.RefObject<HTMLInputElement>> = {
    1: useRef<HTMLInputElement>(null),
    2: useRef<HTMLInputElement>(null),
    3: useRef<HTMLInputElement>(null),
    4: useRef<HTMLInputElement>(null),
    5: useRef<HTMLInputElement>(null),
    6: useRef<HTMLInputElement>(null),
    7: useRef<HTMLInputElement>(null),
  };

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  useEffect(() => {
    const ref = inputRefs[forgotStep];
    if (ref?.current) ref.current.focus();
  }, [forgotStep]);

  const strongPwRegex = /^(?=.*)(?=.*\d)(?=.*).{8,}$/;

  const fpStep1Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpUser(v);
    clearStepTimer();
    if (v.trim()) {
      setShowNoteUser(true);
      if (forgotStep === 1) stepTimerRef.current = setTimeout(() => setForgotStep(2), 2000);
    }
  };

  const fpStep2Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpAcc(v);
    clearStepTimer();
    if (v.trim()) {
      setShowNoteAcc(true);
      if (forgotStep === 2) stepTimerRef.current = setTimeout(() => setForgotStep(3), 2000);
    }
  };

  const fpStep3Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpMobile(v);
    clearStepTimer();
    if (v.trim().length >= 6) {
      setShowNoteMobile(true);
      if (forgotStep === 3) stepTimerRef.current = setTimeout(() => setForgotStep(4), 2000);
    }
  };

  const fpStep3bInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpDob(v);
    clearStepTimer();
    if (v.trim().length >= 6) {
      setShowNoteDob(true);
      if (forgotStep === 4) stepTimerRef.current = setTimeout(() => setForgotStep(5), 2000);
    }
  };

  const fpOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpOtp(v);
    setShowErrOtp(false);
    clearStepTimer();
    if (v === '123456') {
      setShowNoteOtp(true);
      if (forgotStep === 5) stepTimerRef.current = setTimeout(() => setForgotStep(6), 2000);
    } else if (v.length === 6) {
      setShowErrOtp(true);
    }
  };

  const fpNewPwInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpNewPw(v);
    clearStepTimer();
    if (strongPwRegex.test(v)) {
      setShowNoteNewPw(true);
      setShowErrNewPw(false);
      if (forgotStep === 6) stepTimerRef.current = setTimeout(() => setForgotStep(7), 2000);
    } else {
      setShowNoteNewPw(false);
      setShowErrNewPw(true);
    }
  };

  const fpConfirmPwInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFpConfirmPw(v);
    clearStepTimer();
    if (!v) return;
    if (fpNewPw === v) {
      setShowNoteConfirm(true);
      setShowErrConfirm(false);
      stepTimerRef.current = setTimeout(() => {
        setResetBtnActive(true);
      }, 5000);
    } else if (v.length >= fpNewPw.length) {
      setShowNoteConfirm(false);
      setShowErrConfirm(true);
    }
  };

  const doPasswordReset = () => {
    showScreen('screen-forgot-success');
  };

  const backToLogin = () => {
    showScreen('screen-login');
  };

  const cfg = STEP_CONFIGS[forgotStep];

  // Derived disabled/dimmed states
  const isStep = (s: number) => forgotStep >= s;

  return (
    <>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: cfg.progressWidth }} />
      </div>
      <div className="progress-label">{cfg.progressLabel}</div>

      <div className="instruction-card">
        <div className="ic-header">
          <span className="ic-step-badge">{cfg.badge}</span>
          <span className="ic-title">{cfg.title}</span>
        </div>
        <div className="ic-body" dangerouslySetInnerHTML={{ __html: cfg.body }} />
        <div className="ic-actions">
          <button className="btn-speak" onClick={() => speak(cfg.body.replace(/<[^>]+>/g, ''))}>🔊 Read Aloud</button>
          <button className="btn-speak" onClick={() => speak(cfg.body.replace(/<[^>]+>/g, ''))}>🔁 Repeat</button>
        </div>
      </div>

      <div style={{ background: 'var(--warn-bg)', border: '2px solid var(--warn-border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: 'var(--warn-text)', fontWeight: 600 }}>
        ⚠️ TRAINING DEMO: Do NOT enter real account details, mobile number, or date of birth.
      </div>

      <div className="form-card">
        <h2>Trouble Logging In — Forgot Login Password?</h2>
        <p className="card-subtitle">Mandatory fields are marked with an asterisk (*)</p>

        {/* B1: Username */}
        <div className={`form-group${!isStep(1) ? ' dimmed' : ''}`} id="fg-fp-user">
          <label htmlFor="fp-username">Username <span className="req">*</span></label>
          <input
            type="text"
            id="fp-username"
            ref={inputRefs[1]}
            placeholder="Enter sample username"
            autoComplete="off"
            value={fpUser}
            onChange={fpStep1Input}
            disabled={forgotStep < 1}
            className={forgotStep === 1 ? 'step-active' : ''}
          />
          <div className={`success-note${showNoteUser ? ' show' : ''}`}>✅ Good. Moving to the next step.</div>
          <div className="error-note">Please enter a sample username.</div>
        </div>

        {/* B2: Account number */}
        <div className={`form-group${!isStep(2) ? ' dimmed' : ''}`} id="fg-fp-acc">
          <label htmlFor="fp-acc">Account Number <span className="req">*</span></label>
          <input
            type="text"
            id="fp-acc"
            ref={inputRefs[2]}
            placeholder="Enter sample account number"
            autoComplete="off"
            value={fpAcc}
            onChange={fpStep2Input}
            disabled={forgotStep < 2}
            className={forgotStep === 2 ? 'step-active' : ''}
          />
          <div className={`success-note${showNoteAcc ? ' show' : ''}`}>✅ Great!</div>
          <div className="error-note">Please enter a sample account number.</div>
        </div>

        {/* B3: Mobile */}
        <div className={`form-group${!isStep(3) ? ' dimmed' : ''}`} id="fg-fp-mobile">
          <label htmlFor="fp-mobile">Registered Mobile Number <span className="req">*</span></label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="text" value="+91" disabled style={{ width: '60px', textAlign: 'center', fontWeight: 700 }} readOnly />
            <input
              type="text"
              id="fp-mobile"
              ref={inputRefs[3]}
              placeholder="Enter sample mobile number"
              autoComplete="off"
              value={fpMobile}
              onChange={fpStep3Input}
              disabled={forgotStep < 3}
              className={forgotStep === 3 ? 'step-active' : ''}
              style={{ flex: 1 }}
            />
          </div>
          <div className={`success-note${showNoteMobile ? ' show' : ''}`}>✅ Noted.</div>
          <div className="error-note">Please enter a sample mobile number.</div>
        </div>

        {/* B3b: DOB */}
        <div className={`form-group${!isStep(4) ? ' dimmed' : ''}`} id="fg-fp-dob">
          <label htmlFor="fp-dob">Date of Birth <span className="req">*</span></label>
          <input
            type="text"
            id="fp-dob"
            ref={inputRefs[4]}
            placeholder="[dd/mm/yyyy]"
            autoComplete="off"
            value={fpDob}
            onChange={fpStep3bInput}
            disabled={forgotStep < 4}
            className={forgotStep === 4 ? 'step-active' : ''}
          />
          <div className={`success-note${showNoteDob ? ' show' : ''}`}>✅ Done.</div>
          <div className="error-note">Please enter a sample date of birth (e.g. 01/01/1990).</div>
        </div>

        {/* B4: OTP */}
        <div className={`form-group${!isStep(5) ? ' dimmed' : ''}`} id="fg-fp-otp">
          <label htmlFor="fp-otp">One Time Password (OTP) <span className="req">*</span></label>
          <div className="otp-hint">
            🔑 Practice OTP for this demo: <span style={{ fontSize: '20px', letterSpacing: '3px', marginLeft: '8px' }}>123456</span>
          </div>
          <input
            type="text"
            id="fp-otp"
            ref={inputRefs[5]}
            placeholder="Enter the sample OTP shown above"
            autoComplete="off"
            maxLength={6}
            value={fpOtp}
            onChange={fpOtpInput}
            disabled={forgotStep < 5}
            className={forgotStep === 5 ? 'step-active' : ''}
          />
          <div className={`success-note${showNoteOtp ? ' show' : ''}`}>✅ OTP accepted. Well done!</div>
          <div className={`error-note${showErrOtp ? ' show' : ''}`}>Please enter the practice OTP: 123456</div>
        </div>

        {/* B5: New Password */}
        <div className={`form-group${!isStep(6) ? ' dimmed' : ''}`} id="fg-fp-newpw">
          <label htmlFor="fp-newpw">New Password <span className="req">*</span></label>
          <div className="pw-wrap">
            <input
              type={showNewPw ? 'text' : 'password'}
              id="fp-newpw"
              ref={inputRefs[6]}
              placeholder="Create a sample new password"
              autoComplete="off"
              value={fpNewPw}
              onChange={fpNewPwInput}
              disabled={forgotStep < 6}
              className={forgotStep === 6 ? 'step-active' : ''}
            />
            <button className="pw-toggle" onClick={() => setShowNewPw(p => !p)} type="button">👁️</button>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            💡 Use any sample password, e.g. "Practice@1". Do NOT use your real password.
          </div>
          <div className={`success-note${showNoteNewPw ? ' show' : ''}`}>✅ Sample password entered.</div>
          <div className={`error-note${showErrNewPw ? ' show' : ''}`}>Please use a strong password (min 8 chars, 1 letter, 1 number, 1 symbol).</div>
        </div>

        {/* B6: Confirm Password */}
        <div className={`form-group${!isStep(7) ? ' dimmed' : ''}`} id="fg-fp-confirmpw">
          <label htmlFor="fp-confirmpw">Confirm New Password <span className="req">*</span></label>
          <div className="pw-wrap">
            <input
              type={showConfirmPw ? 'text' : 'password'}
              id="fp-confirmpw"
              ref={inputRefs[7]}
              placeholder="Re-type the same sample password"
              autoComplete="off"
              value={fpConfirmPw}
              onChange={fpConfirmPwInput}
              disabled={forgotStep < 7}
              className={forgotStep === 7 ? 'step-active' : ''}
            />
            <button className="pw-toggle" onClick={() => setShowConfirmPw(p => !p)} type="button">👁️</button>
          </div>
          <div className={`success-note${showNoteConfirm ? ' show' : ''}`}>✅ Passwords match. Excellent!</div>
          <div className={`error-note${showErrConfirm ? ' show' : ''}`}>The two passwords do not match. Please check and try again.</div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button
            className={`btn-primary${resetBtnActive ? ' step-active' : ''}`}
            id="btn-fp-reset"
            disabled={!resetBtnActive}
            onClick={doPasswordReset}
          >
            Reset Password
          </button>
          <button className="btn-outline" onClick={backToLogin}>← Back to Login</button>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordScreen;