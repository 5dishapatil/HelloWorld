import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const FeedbackScreen: React.FC = () => {
  const { showScreen, setPostLoginUI } = useAppContext();

  const [selectedConf, setSelectedConf] = useState<string | null>(null);
  const [selectedHard, setSelectedHard] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');

  const practiceAgain = () => {
    setPostLoginUI(false);
    showScreen('screen-disclaimer');
  };

  const finishTraining = () => {
    showScreen('screen-finish');
  };

  return (
    <div className="feedback-card">
      <div className="certificate">
        <div className="cert-icon">🏆</div>
        <h3>Training Completed!</h3>
        <p>You completed: Login Practice + Password Reset + Account Statement Download</p>
      </div>

      <h2>How did it go? 😊</h2>
      <p className="congrats">
        Congratulations on completing the SBI Online Banking Training!
        Please answer these quick questions to help us improve the training for others.
        All answers are optional — take your time.
      </p>

      {/* Confidence check */}
      <div className="fb-question">
        <h3>💪 How confident do you feel now?</h3>
        <div className="fb-options" id="fb-conf">
          {['😊 I can do this on my own', '🤔 I may need one more practice', '🙏 I need more help'].map(opt => (
            <button
              key={opt}
              className={`fb-btn${selectedConf === opt ? ' selected' : ''}`}
              onClick={() => setSelectedConf(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Hardest part */}
      <div className="fb-question">
        <h3>🔍 Which part was hardest?</h3>
        <div className="fb-options" id="fb-hard">
          {['🔑 Logging in', '🔄 Resetting password', '☰ Finding the menu', '📋 Downloading statement', '✅ Everything was clear'].map(opt => (
            <button
              key={opt}
              className={`fb-btn${selectedHard === opt ? ' selected' : ''}`}
              onClick={() => setSelectedHard(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Free text */}
      <div className="fb-question">
        <h3>💬 What confused you? (Optional)</h3>
        <textarea
          className="fb-textarea"
          placeholder="You can write in English or Hindi here... यहाँ लिखें..."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
        <button className="btn-primary" onClick={practiceAgain}>🔁 Practice Again</button>
        <button className="btn-secondary" onClick={finishTraining}>🎓 Finish Training</button>
      </div>
    </div>
  );
};

export default FeedbackScreen;