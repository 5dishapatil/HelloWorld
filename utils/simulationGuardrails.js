const MAX_REFUSALS = 3;

const REJECTION_PATTERNS = [
  /^\s*no+\s*[.!?]*\s*$/i,
  /^\s*no\b(?!\s*problem)/i,
  /\bnope\b/i,
  /\bnah\b/i,
  /\bnot interested\b/i,
  /\bno thanks\b/i,
  /\bwhy do you need that\b/i,
  /\bwhy do you need (?:it|this|my)\b/i,
  /\bi don't trust (?:this|that|you)\b/i,
  /\bthis feels (?:fake|wrong|suspicious)\b/i,
  /\bi(?: am|'m)? not sharing\b/i,
  /\bi(?: am|'m)? not giving\b/i,
  /\bi(?: am|'m)? not comfortable\b/i,
  /\bnot going to\b/i,
  /\bnot providing\b/i,
  /\bi won't\b/i,
  /\bi will not\b/i,
  /\bwon't share\b/i,
  /\bwon't provide\b/i,
  /\brefuse\b/i,
  /\bdecline\b/i,
  /\bleave me alone\b/i,
  /\bstop messaging me\b/i,
  /\bstop contacting me\b/i,
  /\bcan't help\b/i,
  /\bcannot help\b/i,
];

const STRONG_DEFENSE_PATTERNS = [
  /\bthis is (a )?scam\b/i,
  /\bscam\b/i,
  /\bfraud\b/i,
  /\bphishing\b/i,
  /\bfake\b/i,
  /\bblock(?:ing)? you\b/i,
  /\breport(?:ing)? (?:this|you)?\b/i,
  /\bcall(?:ing)? (?:the )?(?:real )?(?:bank|company|support)\b/i,
  /\bpolice\b/i,
  /\bcyber(?:crime| cell)?\b/i,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN = /\b(?:\+?\d[\d\s-]{7,}\d)\b/;
const NAME_PATTERN = /^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/;
const DATE_PATTERN =
  /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?)\b/i;
const PAYMENT_CONFIRMATION_PATTERN =
  /\b(sent|paid|transferred|done|completed|i sent it|payment sent|money sent|just sent|have sent|successfully sent)\b/i;
const PAYMENT_REQUEST_PATTERN =
  /\b(send|transfer|zelle|paypal|venmo|upi|wire|payment|pay me|send me|cash app|moneygram|western union|\$ ?\d+)\b/i;
const OTP_CONTEXT_PATTERN = /\b(otp|one[- ]time|verification|security)\s*(?:code|pin|passcode)?\b/i;
const OTP_SHARE_PATTERN =
  /\b(?:otp|one[- ]time(?: password)?|verification(?: code)?|security(?: code)?|passcode|pin)\b\s*(?:is|are|:|=)?\s*\d{4,8}\b/i;
const OTP_VALUE_PATTERN = /\b\d{4,8}\b/;
const CARD_NUMBER_PATTERN = /\b(?:\d[ -]*?){12,19}\b/;
const LAST_FOUR_PATTERN = /^\d{3,4}$/;
const PIN_VALUE_PATTERN = /^\d{4,6}$/;
const CVV_VALUE_PATTERN = /^\d{3,4}$/;
const ACCOUNT_NUMBER_VALUE_PATTERN = /^\d{6,18}$/;
const CREDENTIAL_SHARE_PATTERN =
  /\b(password|passcode|pin|security answer|login code|username|user id|cvv|cvc|card number|account number|bank account|upi|ifsc|routing number|sort code|ssn|social security|aadhaar|seed phrase|wallet key|private key|recovery code)\b\s*(?:is|are|:|=)\s*\S+/i;
const PERSONAL_INFO_PATTERN =
  /\b(my name is|address is|date of birth|dob|birthday|zip code|postal code|pan number)\b/i;
const ADDRESS_PATTERN =
  /\b(street|road|avenue|ave|lane|sector|block|apartment|flat|zip|postal)\b/i;
const SYSTEM_INFO_PATTERN =
  /\b(windows(?: 10| 11)?|mac(?:os)?|linux|ubuntu|android|ios|iphone|ipad|chrome|firefox|edge|safari|msinfo32|system info|device id|serial number)\b/i;
const REMOTE_ACCESS_PATTERN =
  /\b(anydesk|teamviewer|quicksupport|ultraviewer|remote access|support-fix\.live|downloaded|installed|clicked the link|opened run|press(?:ed)? windows key|typed msinfo32|opened cmd|opened terminal)\b/i;
const NEGATED_RISK_PATTERN =
  /\b(?:won't|will not|refuse|decline|never|do not|don't|not)\b[^.!?\n]{0,30}\b(?:share|give|provide|send|install|download|open|run|confirm|use|tell)\b/i;

const SCAM_GUIDANCE = {
  bank_impersonation: {
    tactic: 'authority and panic about your bank account',
    advice:
      'Real banks do not ask for OTPs, PINs, or passwords over chat or phone. Pause, hang up, and call the number printed on your card or official banking app.',
  },
  delivery_fraud: {
    tactic: 'a fake delivery problem plus time pressure',
    advice:
      'Check parcel issues only through the official courier website or app, and never enter personal details after clicking a random link.',
  },
  tech_support: {
    tactic: 'fake security alerts and pressure to share system access',
    advice:
      'Legitimate support teams do not cold-contact you for device details, diagnostic commands, or remote-access installs. Close the chat and verify support through the official website.',
  },
  relational_scam: {
    tactic: 'trust-building and emotional pressure to rush your judgment',
    advice:
      'Slow the conversation down, verify the person through another channel, and never send money, codes, or private details under pressure.',
  },
  unknown: {
    tactic: 'pressure, urgency, and social engineering',
    advice:
      'Slow down, verify independently, and never share codes, account details, or device access with an unverified contact.',
  },
};

function getMessageText(message) {
  if (!Array.isArray(message?.parts)) {
    return '';
  }

  return message.parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function getLatestModelMessageText(messages = []) {
  const items = Array.isArray(messages) ? messages : [];

  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.role === 'model') {
      return getMessageText(items[index]);
    }
  }

  return '';
}

function matchesAny(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function inferRequestedSensitiveTypes(lastModelMessageText) {
  const prompt = String(lastModelMessageText || '').toLowerCase();
  const requested = new Set();

  if (!prompt) {
    return requested;
  }

  if (/\b(otp|one[- ]time|verification|security)\s*(?:code|pin|passcode)?\b/.test(prompt)) {
    requested.add('otp');
  }

  if (/\b(last four|last 4|debit card|credit card|card number)\b/.test(prompt)) {
    requested.add('card');
  }

  if (/\b(cvv|cvc)\b/.test(prompt)) {
    requested.add('cvv');
  }

  if (/\b(pin|passcode)\b/.test(prompt) && !requested.has('otp')) {
    requested.add('pin');
  }

  if (/\b(password|login|username|user id|recovery code|seed phrase|wallet key|private key)\b/.test(prompt)) {
    requested.add('credentials');
  }

  if (/\b(account number|bank details|bank account|upi|ifsc|routing number|sort code)\b/.test(prompt)) {
    requested.add('banking');
  }

  if (/\b(full name|your name|confirm your name)\b/.test(prompt)) {
    requested.add('name');
  }

  if (/\b(date of birth|dob|birthday)\b/.test(prompt)) {
    requested.add('dob');
  }

  if (/\b(email|e-mail)\b/.test(prompt)) {
    requested.add('email');
  }

  if (/\b(phone|mobile|contact number)\b/.test(prompt)) {
    requested.add('phone');
  }

  if (/\b(address|postal|zip)\b/.test(prompt)) {
    requested.add('address');
  }

  if (PAYMENT_REQUEST_PATTERN.test(prompt)) {
    requested.add('payment');
  }

  if (/\b(operating system|windows|mac|linux|device|system info|computer|laptop|desktop|serial number|device id)\b/.test(prompt)) {
    requested.add('system');
  }

  return requested;
}

function detectDisclosureFromPromptContext(rawText, lastModelMessageText) {
  const trimmed = String(rawText || '').trim();
  const requested = inferRequestedSensitiveTypes(lastModelMessageText);

  if (!trimmed || requested.size === 0) {
    return null;
  }

  if (requested.has('otp') && OTP_VALUE_PATTERN.test(trimmed)) {
    return {
      type: 'otp',
      resultReason: 'User shared the verification code requested by the scammer.',
    };
  }

  if (requested.has('card') && (LAST_FOUR_PATTERN.test(trimmed) || CARD_NUMBER_PATTERN.test(trimmed))) {
    return {
      type: 'credentials',
      resultReason: 'User shared debit or credit card details requested by the scammer.',
    };
  }

  if (requested.has('cvv') && CVV_VALUE_PATTERN.test(trimmed)) {
    return {
      type: 'credentials',
      resultReason: 'User shared the card security code requested by the scammer.',
    };
  }

  if (requested.has('pin') && PIN_VALUE_PATTERN.test(trimmed)) {
    return {
      type: 'credentials',
      resultReason: 'User shared a PIN or passcode requested by the scammer.',
    };
  }

  if (requested.has('banking') && (ACCOUNT_NUMBER_VALUE_PATTERN.test(trimmed) || /[A-Za-z0-9-]{6,}/.test(trimmed))) {
    return {
      type: 'credentials',
      resultReason: 'User shared bank account details requested by the scammer.',
    };
  }

  if (requested.has('name') && NAME_PATTERN.test(trimmed)) {
    return {
      type: 'personal',
      resultReason: 'User shared their name as requested by the scammer.',
    };
  }

  if (requested.has('dob') && DATE_PATTERN.test(trimmed)) {
    return {
      type: 'personal',
      resultReason: 'User shared date-of-birth information requested by the scammer.',
    };
  }

  if (requested.has('email') && EMAIL_PATTERN.test(trimmed)) {
    return {
      type: 'personal',
      resultReason: 'User shared email information requested by the scammer.',
    };
  }

  if (requested.has('phone') && PHONE_PATTERN.test(trimmed)) {
    return {
      type: 'personal',
      resultReason: 'User shared phone information requested by the scammer.',
    };
  }

  if (requested.has('address') && trimmed.length >= 8) {
    return {
      type: 'personal',
      resultReason: 'User shared address information requested by the scammer.',
    };
  }

  if (requested.has('payment') && PAYMENT_CONFIRMATION_PATTERN.test(trimmed)) {
    return {
      type: 'payment',
      resultReason: 'User confirmed sending money requested by the scammer.',
    };
  }

  if (requested.has('system') && SYSTEM_INFO_PATTERN.test(trimmed)) {
    return {
      type: 'system',
      resultReason: 'User shared system or device information requested by the scammer.',
    };
  }

  if (requested.has('credentials') && trimmed.length >= 4) {
    return {
      type: 'credentials',
      resultReason: 'User shared sensitive credentials requested by the scammer.',
    };
  }

  return null;
}

function detectDisclosureFromText(text, lastModelMessageText) {
  const rawText = String(text || '').trim();

  if (!rawText) {
    return null;
  }

  const normalizedText = rawText.toLowerCase();
  const lastModelMessage = String(lastModelMessageText || '').toLowerCase();
  const isNegatedRiskResponse = NEGATED_RISK_PATTERN.test(rawText);

  if (OTP_SHARE_PATTERN.test(rawText) || (OTP_VALUE_PATTERN.test(rawText) && OTP_CONTEXT_PATTERN.test(lastModelMessage))) {
    return {
      type: 'otp',
      resultReason: 'User shared or confirmed a one-time security code.',
    };
  }

  if (isNegatedRiskResponse) {
    return null;
  }

  if (REMOTE_ACCESS_PATTERN.test(rawText)) {
    return {
      type: 'remote_access',
      resultReason: 'User described taking a risky remote-access or diagnostic step.',
    };
  }

  if (CREDENTIAL_SHARE_PATTERN.test(rawText)) {
    return {
      type: 'credentials',
      resultReason: 'User shared sensitive account or security information.',
    };
  }

  if (EMAIL_PATTERN.test(rawText) || PHONE_PATTERN.test(rawText)) {
    return {
      type: 'personal',
      resultReason: 'User shared direct personal contact information.',
    };
  }

  if (PERSONAL_INFO_PATTERN.test(normalizedText) || ADDRESS_PATTERN.test(normalizedText)) {
    return {
      type: 'personal',
      resultReason: 'User shared personal identity or address information.',
    };
  }

  if (SYSTEM_INFO_PATTERN.test(rawText)) {
    return {
      type: 'system',
      resultReason: 'User shared system or device information.',
    };
  }

  return detectDisclosureFromPromptContext(rawText, lastModelMessageText);
}

function isContextualRefusal(text, lastModelMessageText) {
  const normalizedText = String(text || '').trim().toLowerCase();
  const lastPrompt = String(lastModelMessageText || '').toLowerCase();

  if (!normalizedText || !lastPrompt) {
    return false;
  }

  if (/\b(i do not|i don't|i dont|do not|don't|dont|not|never)\s+have\b/.test(normalizedText)) {
    return inferRequestedSensitiveTypes(lastPrompt).size > 0;
  }

  return false;
}

function analyzeUserInput({ text, quickReply, messages }) {
  const normalizedText = String(text || '').trim().toLowerCase();
  const lastModelMessageText = getLatestModelMessageText(messages);
  const strongDefenseDetected = matchesAny(STRONG_DEFENSE_PATTERNS, normalizedText);
  const refusalDetected =
    quickReply === 'no' ||
    strongDefenseDetected ||
    matchesAny(REJECTION_PATTERNS, normalizedText) ||
    isContextualRefusal(normalizedText, lastModelMessageText);

  const disclosure = detectDisclosureFromText(text, lastModelMessageText);

  return {
    refusalDetected,
    strongDefenseDetected,
    disclosure,
    lastModelMessageText,
  };
}

function getScenarioGuidance(scamType) {
  return SCAM_GUIDANCE[scamType] || SCAM_GUIDANCE.unknown;
}

function buildDefendedRevealMessage({ scamType, refusalCount }) {
  const guidance = getScenarioGuidance(scamType);
  const praiseIntro =
    refusalCount >= MAX_REFUSALS
      ? 'Friendly simulation reveal: this was a scam-awareness exercise, and you did an amazing job refusing to engage even after repeated pressure.'
      : 'Friendly simulation reveal: this was a scam-awareness exercise, and you handled it really well by refusing to share anything important.';

  return `${praiseIntro} The scammer was using ${guidance.tactic} so you would act fast instead of thinking clearly. The red flags were urgency, pressure, and a request for sensitive details. ${guidance.advice} Keep refusing to share OTPs, passwords, banking details, recovery codes, or device access with unverified contacts.`;
}

function buildCompromisedRevealMessage({ scamType, disclosureType }) {
  const guidance = getScenarioGuidance(scamType);
  const detailLine =
    disclosureType === 'otp'
      ? 'You reached the point where a real scammer would try to capture a one-time code and take over an account.'
      : disclosureType === 'remote_access'
        ? 'You reached the point where a real scammer would try to gain control of your device or make you run unsafe steps.'
        : disclosureType === 'payment'
          ? 'You reached the point where a real scammer would successfully collect money by exploiting trust and urgency.'
        : disclosureType === 'system'
          ? 'You reached the point where a real scammer would start collecting device details to make the setup sound more believable.'
          : 'You reached the point where a real scammer would treat the conversation as a successful opening to steal more information.';

  return `Friendly simulation reveal: this was a scam-awareness exercise. ${detailLine} The attacker was using ${guidance.tactic} so you would lower your guard. In a real scam, that information could be used to access accounts, steal money, or take control of your device. ${guidance.advice} If this were real, you should immediately change affected passwords, contact your bank or service provider, freeze cards if needed, revoke active sessions, enable 2FA, and report the fraud.`;
}

function buildForcedCompletion({
  outcome,
  scamType,
  refusalCount = 0,
  disclosureType = 'unknown',
  resultReason,
}) {
  const defended = outcome === 'defended';

  return {
    state: defended ? 'defended' : 'compromised',
    speakerLabel: 'Guardian Path',
    message: defended
      ? buildDefendedRevealMessage({ scamType, refusalCount })
      : buildCompromisedRevealMessage({ scamType, disclosureType }),
    userAction: defended ? 'resisted' : 'fell_for_it',
    trapAttemptDetected: false,
    shouldPraise: defended,
    resultReason:
      resultReason ||
      (defended
        ? 'Simulation ended after the user clearly resisted the scam.'
        : 'Simulation ended after the user shared risky information.'),
    riskScore: defended ? 15 : 90,
    confidence: 1,
    noticeMessage: defended
      ? 'Simulation complete: you protected yourself and shut the scam down.'
      : 'Simulation complete: the exercise stopped at the point a real scammer would exploit.',
    isForcedCompletion: true,
  };
}

module.exports = {
  MAX_REFUSALS,
  analyzeUserInput,
  buildForcedCompletion,
};
