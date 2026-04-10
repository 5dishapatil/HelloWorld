import React from 'react';
import { useAppContext } from '../context/AppContext';

const DisclaimerScreen: React.FC = () => {
  const { showScreen } = useAppContext();

  const startTraining = () => {
    showScreen('screen-login');
  };

  return (
    <div className="disclaimer-box">
      <div className="disc-icon">🎓</div>
      <h1>⚠️ Before You Begin – Important Notice</h1>
      <div className="disc-main">
        This is a TRAINING SIMULATION only.<br />
        Do NOT enter your real SBI username, password, OTP, or account number.
      </div>
      <p className="disc-sub">
        This practice demo does <strong>not</strong> connect to the real SBI website.<br />
        It does <strong>not</strong> save, submit, or store any information you enter.<br />
        Please still use only <em>sample / practice details</em> for your own safety.
      </p>
      <ul className="disc-checklist">
        <li>Use any made-up username (e.g. "SampleUser123")</li>
        <li>Use any made-up password (e.g. "Practice@1")</li>
        <li>Use the sample OTP shown on screen (123456)</li>
        <li>No data is sent to SBI or any server</li>
        <li>You can safely practice all steps here</li>
      </ul>
      <p style={{ fontSize: '14px', color: '#777', marginBottom: '24px' }}>
        यह प्रशिक्षण सिमुलेशन है। कृपया असली बैंकिंग विवरण दर्ज न करें।
      </p>
      <button className="btn-primary" onClick={startTraining}>
        ✅ I Understand — Start Training
      </button>
    </div>
  );
};

export default DisclaimerScreen;