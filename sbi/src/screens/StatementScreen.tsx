import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';

const STMT_SPEAK_TEXTS: Record<number, string> = {
  1: 'First, choose which account you want the statement for. In this demo, a sample Savings Account is shown. Click the radio button to select it.',
  2: 'Now choose the period for which you want the statement. You can select By Date, By Month, Last 6 Months, or Financial Year. For practice, try entering sample dates like 01/01/2025 to 31/03/2025.',
  3: 'Choose how you want to view or download the statement. Select View to see it on screen, or choose PDF or Excel to download. Then click the Go button.',
  4: 'Now click the Go button to generate your sample statement. This will show a preview of your transactions below.',
  5: 'Your sample statement has been generated. Review the transactions. When ready, click Download Statement to complete the practice.',
};

type PeriodType = 'bydate' | 'bymonth' | '6months' | 'fy';

interface StmtStepConfig {
  badge: string;
  title: string;
  body: string;
  note: string;
  progressWidth: string;
  progressLabel: string;
}

const STEP_CONFIGS: Record<number, StmtStepConfig> = {
  1: {
    badge: 'STEP G1 / 5',
    title: 'Select Your Account',
    body: 'First, choose which account you want the statement for. In this demo, a sample Savings Account is shown. Click the radio button to select it.',
    note: '',
    progressWidth: '20%',
    progressLabel: 'Step 1 of 5 — Select Account',
  },
  2: {
    badge: 'STEP G2 / 5',
    title: 'Choose the Statement Period',
    body: 'Now choose the period for which you want the statement. You can select <strong>By Date</strong>, By Month, Last 6 Months, or Financial Year. For practice, try entering sample dates like <strong>01/01/2025</strong> to <strong>31/03/2025</strong>.',
    note: '<span style="color:var(--sbi-green)">✅ Account selected!</span>',
    progressWidth: '40%',
    progressLabel: 'Step 2 of 5 — Select Period',
  },
  3: {
    badge: 'STEP G3 / 5',
    title: 'Choose Output Format',
    body: 'Choose how you want to view or download the statement. Select <strong>View</strong> to see it on screen, or choose PDF/Excel to download. Then click the <strong>Go</strong> button.',
    note: '<span style="color:var(--sbi-green)">✅ Period selected!</span>',
    progressWidth: '60%',
    progressLabel: 'Step 3 of 5 — Choose Format',
  },
  4: {
    badge: 'STEP G4 / 5',
    title: 'Click "Go" to Generate Statement',
    body: 'Now click the <strong>Go</strong> button to generate your sample statement. This will show a preview of your transactions below.',
    note: '<span style="color:var(--sbi-green)">✅ Format selected!</span>',
    progressWidth: '80%',
    progressLabel: 'Step 4 of 5 — Generate Statement',
  },
  5: {
    badge: 'STEP G5 / 5',
    title: 'Download Your Statement',
    body: 'Your sample statement has been generated below. Review the transactions. When ready, click <strong>Download Statement</strong> to complete the practice. In a real app, this would save the file to your device.',
    note: '<span style="color:var(--sbi-green)">✅ Statement generated successfully!</span>',
    progressWidth: '95%',
    progressLabel: 'Step 5 of 5 — Download Statement',
  },
  6: {
    badge: '✅ DONE',
    title: 'Excellent! Practice Complete!',
    body: '🎉 <strong>Excellent! You have completed the bank statement download practice.</strong> In a real app, the statement file would now be saved to your device. <br><br>You are now ready to do this on your own!',
    note: '',
    progressWidth: '100%',
    progressLabel: 'Completed! ✅',
  },
};

const MONTHS = [
  'January 2025', 'February 2025', 'March 2025', 'April 2025',
  'May 2025', 'June 2025', 'July 2025', 'August 2025',
  'September 2025', 'October 2025', 'November 2025', 'December 2025',
];

const StatementScreen: React.FC = () => {
  const { showScreen } = useAppContext();
  const { speak } = useSpeech();

  const [stmtStep, setStmtStep] = useState(1);
  const [accSelected, setAccSelected] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('bydate');
  const [stmtFrom, setStmtFrom] = useState('');
  const [stmtTo, setStmtTo] = useState('');
  const [stmtFromMonth, setStmtFromMonth] = useState('');
  const [stmtToMonth, setStmtToMonth] = useState('');
  const [stmtFy, setStmtFy] = useState('');
  const [showNoteAcc, setShowNoteAcc] = useState(false);
  const [showNotePeriod, setShowNotePeriod] = useState(false);
  const [showNoteFormat, setShowNoteFormat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [goBtnActive, setGoBtnActive] = useState(false);
  const [downloadBtnActive, setDownloadBtnActive] = useState(false);
  const [selectedAccDisp, setSelectedAccDisp] = useState('—');

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  const isPeriodValid = useCallback((): boolean => {
    if (periodType === '6months') return true;
    if (periodType === 'bydate') return stmtFrom.trim().length >= 6 && stmtTo.trim().length >= 6;
    if (periodType === 'bymonth') return !!stmtFromMonth && !!stmtToMonth;
    if (periodType === 'fy') return !!stmtFy;
    return false;
  }, [periodType, stmtFrom, stmtTo, stmtFromMonth, stmtToMonth, stmtFy]);

  useEffect(() => {
    if (stmtStep === 2 && periodRef.current) {
      periodRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (stmtStep === 3 && formatRef.current) {
      formatRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (stmtStep === 4 && buttonsRef.current) {
      buttonsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (stmtStep === 5 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stmtStep]);

  const onAccSelect = () => {
    clearStepTimer();
    setAccSelected(true);
    setSelectedAccDisp('0000XXXXXXXX01');
    setShowNoteAcc(true);
    if (stmtStep === 1) {
      stepTimerRef.current = setTimeout(() => setStmtStep(2), 2000);
    }
  };

  const onPeriodChange = (val: PeriodType) => {
    clearStepTimer();
    setPeriodType(val);
    if (val === '6months') {
      setShowNotePeriod(true);
      if (stmtStep === 2) {
        stepTimerRef.current = setTimeout(() => setStmtStep(3), 2000);
      }
    }
  };

  const onDateInput = (
    newFrom?: string,
    newTo?: string,
    newFromMonth?: string,
    newToMonth?: string,
    newFy?: string,
  ) => {
    clearStepTimer();
    const from = newFrom !== undefined ? newFrom : stmtFrom;
    const to = newTo !== undefined ? newTo : stmtTo;
    const fm = newFromMonth !== undefined ? newFromMonth : stmtFromMonth;
    const tm = newToMonth !== undefined ? newToMonth : stmtToMonth;
    const fy = newFy !== undefined ? newFy : stmtFy;

    let valid = false;
    if (periodType === 'bydate') valid = from.trim().length >= 6 && to.trim().length >= 6;
    else if (periodType === 'bymonth') valid = !!fm && !!tm;
    else if (periodType === 'fy') valid = !!fy;
    else if (periodType === '6months') valid = true;

    if (valid && stmtStep === 2) {
      setShowNotePeriod(true);
      stepTimerRef.current = setTimeout(() => setStmtStep(3), 2000);
    }
  };

  const onFormatChange = () => {
    clearStepTimer();
    if (stmtStep === 3) {
      setShowNoteFormat(true);
      stepTimerRef.current = setTimeout(() => {
        setStmtStep(4);
        setGoBtnActive(true);
      }, 2000);
    }
  };

  const generateStatement = () => {
    setGoBtnActive(false);
    setShowPreview(true);
    setStmtStep(5);
    setDownloadBtnActive(true);
  };

  const downloadStatement = () => {
    setDownloadBtnActive(false);
    setStmtStep(6);
    setTimeout(() => showScreen('screen-feedback'), 2200);
  };

  const resetStatement = () => {
    clearStepTimer();
    setAccSelected(false);
    setSelectedAccDisp('—');
    setStmtFrom('');
    setStmtTo('');
    setStmtFromMonth('');
    setStmtToMonth('');
    setStmtFy('');
    setShowNoteAcc(false);
    setShowNotePeriod(false);
    setShowNoteFormat(false);
    setShowPreview(false);
    setGoBtnActive(false);
    setDownloadBtnActive(false);
    setStmtStep(1);
    setPeriodType('bydate');
  };

  const cfg = STEP_CONFIGS[stmtStep] || STEP_CONFIGS[5];

  const isPeriodDimmed = stmtStep < 2;
  const isFormatDimmed = stmtStep < 3;
  const isButtonsDimmed = stmtStep < 4;
  const isGoDisabled = stmtStep < 4;

  return (
    <>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: cfg.progressWidth }} />
      </div>
      <div className="progress-label">{cfg.progressLabel}</div>

      <div className="instruction-card" id="stmt-ic">
        <div className="ic-header">
          <span className="ic-step-badge" id="stmt-ic-badge">{cfg.badge}</span>
          <span className="ic-title" id="stmt-ic-title">{cfg.title}</span>
        </div>
        <div className="ic-body" id="stmt-ic-body" dangerouslySetInnerHTML={{ __html: cfg.body }} />
        {cfg.note && (
          <div className="ic-note" id="stmt-ic-note" dangerouslySetInnerHTML={{ __html: cfg.note }} />
        )}
        <div className="ic-actions">
          <button className="btn-speak" onClick={() => speak(STMT_SPEAK_TEXTS[Math.min(stmtStep, 5)] || '')}>🔊 Read Aloud</button>
          <button className="btn-speak" onClick={() => speak(STMT_SPEAK_TEXTS[Math.min(stmtStep, 5)] || '')}>🔁 Repeat</button>
        </div>
      </div>

      <div style={{ background: 'var(--warn-bg)', border: '2px solid var(--warn-border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: 'var(--warn-text)', fontWeight: 600 }}>
        ⚠️ This is a training demo. All account numbers and transaction data shown are sample/dummy values only.
      </div>

      <div style={{ background: 'var(--sbi-blue)', color: 'white', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
        You are here: / My Accounts &amp; Profile / <strong>Account Statement</strong>
      </div>

      <div className="form-card statement-form">
        <h2>Account Statement</h2>

        {/* G1: Select Account */}
        <div className="form-group" id="sg-acc">
          <label style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sbi-blue)', marginBottom: '12px', display: 'block' }}>Select an account</label>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ background: '#eaf4fb' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--sbi-blue-light)' }}></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--sbi-blue-light)' }}>Account No. / Nick Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--sbi-blue-light)' }}>Account Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--sbi-blue-light)' }}>Branch</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px' }}>
                  <input
                    type="radio"
                    name="stmt-acc"
                    id="stmt-acc-radio"
                    style={{ width: '18px', height: '18px', accentColor: 'var(--sbi-blue)' }}
                    checked={accSelected}
                    onChange={onAccSelect}
                  />
                </td>
                <td style={{ padding: '10px', fontWeight: 600 }}>0000XXXXXXXX01</td>
                <td style={{ padding: '10px' }}>Savings Account</td>
                <td style={{ padding: '10px' }}>NEW PANVEL (WEST) BRANCH</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>
            Selected Account Number: <span id="selected-acc-disp" style={{ color: 'var(--sbi-blue)' }}>{selectedAccDisp}</span>
          </div>
          <div className={`success-note${showNoteAcc ? ' show' : ''}`} id="stmt-note-acc">✅ Account selected. Moving to next step.</div>
        </div>

        {/* G2: Statement Period */}
        <div className={`form-group${isPeriodDimmed ? ' dimmed' : ''}`} id="sg-period" ref={periodRef}>
          <label style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sbi-blue)', marginBottom: '10px', display: 'block' }}>
            Select options for the statement period
          </label>
          <div style={{ background: '#f0f7ff', border: '1px solid #b8d4e8', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#444', marginBottom: '14px', lineHeight: 1.6 }}>
            In case the Account Statement does not reflect all your transactions, please Download statement from the 'Pending Statement' link under the 'My Accounts' tab after some time.
          </div>

          <div className="radio-group" style={{ marginBottom: '14px' }}>
            <label>
              <input type="radio" name="period-type" value="bydate" checked={periodType === 'bydate'} onChange={() => onPeriodChange('bydate')} /> By Date
            </label>
            <label>
              <input type="radio" name="period-type" value="bymonth" checked={periodType === 'bymonth'} onChange={() => onPeriodChange('bymonth')} /> By Month
            </label>
            <label>
              <input type="radio" name="period-type" value="6months" checked={periodType === '6months'} onChange={() => onPeriodChange('6months')} /> Last 6 Months
            </label>
            <label>
              <input type="radio" name="period-type" value="fy" checked={periodType === 'fy'} onChange={() => onPeriodChange('fy')} /> Financial Year
            </label>
          </div>

          {/* By Date */}
          {periodType === 'bydate' && (
            <div id="period-bydate">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="stmt-from" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Start Date</label>
                  <input
                    type="text"
                    id="stmt-from"
                    placeholder="dd/mm/yyyy"
                    value={stmtFrom}
                    onChange={e => { setStmtFrom(e.target.value); onDateInput(e.target.value, undefined); }}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="stmt-to" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>End Date</label>
                  <input
                    type="text"
                    id="stmt-to"
                    placeholder="dd/mm/yyyy"
                    value={stmtTo}
                    onChange={e => { setStmtTo(e.target.value); onDateInput(undefined, e.target.value); }}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* By Month */}
          {periodType === 'bymonth' && (
            <div id="period-bymonth">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>From Month</label>
                  <select
                    id="stmt-from-month"
                    value={stmtFromMonth}
                    onChange={e => { setStmtFromMonth(e.target.value); onDateInput(undefined, undefined, e.target.value, undefined); }}
                  >
                    <option value="">— Select Month —</option>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>To Month</label>
                  <select
                    id="stmt-to-month"
                    value={stmtToMonth}
                    onChange={e => { setStmtToMonth(e.target.value); onDateInput(undefined, undefined, undefined, e.target.value); }}
                  >
                    <option value="">— Select Month —</option>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Financial Year */}
          {periodType === 'fy' && (
            <div id="period-fy">
              <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Financial Year</label>
              <select
                id="stmt-fy"
                style={{ width: '180px' }}
                value={stmtFy}
                onChange={e => { setStmtFy(e.target.value); onDateInput(undefined, undefined, undefined, undefined, e.target.value); }}
              >
                <option value="">— Select —</option>
                <option>2024-2025</option>
                <option>2023-2024</option>
                <option>2022-2023</option>
              </select>
            </div>
          )}

          <div className={`success-note${showNotePeriod ? ' show' : ''}`} id="stmt-note-period" style={{ marginTop: '10px' }}>✅ Period selected. Moving to next step.</div>
          <div className="error-note" id="stmt-err-period">Please fill in the date/period fields to continue.</div>
        </div>

        {/* G3: Output Format */}
        <div className={`form-group${isFormatDimmed ? ' dimmed' : ''}`} id="sg-format" ref={formatRef}>
          <label style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sbi-blue)', marginBottom: '10px', display: 'block' }}>
            Select appropriate options to view, print or download the statement
          </label>
          <div className="radio-group">
            <label><input type="radio" name="stmt-format" value="view" defaultChecked onChange={onFormatChange} /> View</label>
            <label><input type="radio" name="stmt-format" value="excel" onChange={onFormatChange} /> Download in MS Excel format</label>
            <label><input type="radio" name="stmt-format" value="pdf" onChange={onFormatChange} /> Download in PDF format</label>
            <label><input type="radio" name="stmt-format" value="digilocker" onChange={onFormatChange} /> Upload to DigiLocker</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>Number of Records Per Page:</label>
            <select style={{ width: '100px', padding: '6px 10px', fontSize: '14px', border: '2px solid #c5d9ea', borderRadius: '4px' }}>
              <option>ALL</option>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className={`success-note${showNoteFormat ? ' show' : ''}`} id="stmt-note-format">✅ Format selected.</div>
        </div>

        {/* G4: Buttons */}
        <div className={`form-actions${isButtonsDimmed ? ' dimmed' : ''}`} id="sg-buttons" style={{ marginTop: '20px' }} ref={buttonsRef}>
          <button
            className={`btn-primary${goBtnActive ? ' step-active' : ''}`}
            id="btn-go-stmt"
            onClick={generateStatement}
            disabled={isGoDisabled}
          >
            Go
          </button>
          <button className="btn-reset-grey" onClick={resetStatement}>Cancel</button>
        </div>
      </div>

      {/* G5: Statement Preview */}
      {showPreview && (
        <div id="stmt-preview" style={{ marginTop: '20px' }} ref={previewRef}>
          <div className="instruction-card">
            <div className="ic-header">
              <span className="ic-step-badge">STEP G4-G5</span>
              <span className="ic-title">Statement Preview — Now Download</span>
            </div>
            <div className="ic-body">
              Your sample statement has been generated below. Review the transactions.
              When ready, click <strong>"Download Statement"</strong> to complete the practice.
              In a real app, this would save a PDF or Excel file to your device.
            </div>
            <div className="ic-actions">
              <button className="btn-speak" onClick={() => speak(STMT_SPEAK_TEXTS[5])}>🔊 Read Aloud</button>
            </div>
          </div>

          <div className="statement-table-wrap">
            <div className="statement-table-header">
              📄 Sample Statement Preview — <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.85 }}>Account: 0000XXXXXXXX01 | Period: Jan 2025 – Mar 2025</span>
            </div>
            <div className="statement-table-demo">
              ⚠️ Sample Statement Preview (Training Demo Only) — All data shown is fictitious and for practice purposes only.
            </div>
            <div style={{ overflowX: 'auto', padding: '0 4px 12px' }}>
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Ref No.</th>
                    <th>Debit (₹)</th>
                    <th>Credit (₹)</th>
                    <th>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>01/01/2025</td><td>Opening Balance</td><td>—</td><td>—</td><td>—</td><td className="amt-credit">25,000.00</td></tr>
                  <tr><td>05/01/2025</td><td>NEFT - Salary Credit</td><td>NFTX001234</td><td>—</td><td className="amt-credit">35,000.00</td><td className="amt-credit">60,000.00</td></tr>
                  <tr><td>08/01/2025</td><td>ATM Withdrawal - SBI ATM</td><td>ATM9981234</td><td className="amt-debit">5,000.00</td><td>—</td><td>55,000.00</td></tr>
                  <tr><td>12/01/2025</td><td>UPI - Grocery Store</td><td>UPI1122334</td><td className="amt-debit">1,250.00</td><td>—</td><td>53,750.00</td></tr>
                  <tr><td>15/01/2025</td><td>Electricity Bill Payment</td><td>BILL558899</td><td className="amt-debit">1,800.00</td><td>—</td><td>51,950.00</td></tr>
                  <tr><td>20/01/2025</td><td>IMPS - Friend Transfer</td><td>IMPS334455</td><td>—</td><td className="amt-credit">2,000.00</td><td className="amt-credit">53,950.00</td></tr>
                  <tr><td>01/02/2025</td><td>Rent Payment - NEFT</td><td>NFTX009988</td><td className="amt-debit">12,000.00</td><td>—</td><td>41,950.00</td></tr>
                  <tr><td>05/02/2025</td><td>NEFT - Salary Credit</td><td>NFTX002345</td><td>—</td><td className="amt-credit">35,000.00</td><td className="amt-credit">76,950.00</td></tr>
                  <tr><td>14/02/2025</td><td>Online Shopping - Flipkart</td><td>UPI5566778</td><td className="amt-debit">3,499.00</td><td>—</td><td>73,451.00</td></tr>
                  <tr><td>01/03/2025</td><td>NEFT - Salary Credit</td><td>NFTX003456</td><td>—</td><td className="amt-credit">35,000.00</td><td className="amt-credit">1,08,451.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn-primary${downloadBtnActive ? ' step-active' : ''}`}
              id="btn-download-stmt"
              onClick={downloadStatement}
            >
              ⬇️ Download Statement
            </button>
            <button className="btn-outline" onClick={resetStatement}>← Start Over</button>
          </div>
        </div>
      )}

      {/* Notes (SBI style) */}
      <div style={{ marginTop: '20px', fontSize: '13px', color: '#555', background: 'white', border: '1px solid #d5e5f5', borderRadius: '8px', padding: '14px 18px' }}>
        <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>Online Statement of Account is available for periods up to 36 months prior to current date.</li>
          <li>Date range cannot exceed 12 months for each statement request.</li>
        </ul>
      </div>
    </>
  );
};

export default StatementScreen;