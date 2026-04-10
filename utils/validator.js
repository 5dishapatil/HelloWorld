function validateMessageInput(message) {
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string.' };
  }

  const trimmed = message.trim();

  if (!trimmed) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Message must be between 1 and 500 characters.' };
  }

  return { valid: true, value: trimmed };
}

function validateQuickReplyInput(quickReply) {
  if (typeof quickReply !== 'string') {
    return { valid: false, error: 'Quick reply must be a string.' };
  }

  const trimmed = quickReply.trim();

  if (!trimmed) {
    return { valid: false, error: 'Quick reply cannot be empty.' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Quick reply must be between 1 and 500 characters.' };
  }

  return { valid: true, value: trimmed };
}

function getLatestModelMessageText(messages = []) {
  const items = Array.isArray(messages) ? messages : [];

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const message = items[index];

    if (message?.role === 'model' && Array.isArray(message.parts)) {
      return message.parts
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
    }
  }

  return '';
}

function buildQuickReplyPair(positiveText, negativeText) {
  return {
    allowTextReply: true,
    quickReplies: [
      { value: positiveText, label: positiveText },
      { value: negativeText, label: negativeText },
    ],
  };
}

function inferDynamicQuickReplies(lastModelMessageText, scamType) {
  const prompt = String(lastModelMessageText || '').trim();
  const normalizedPrompt = prompt.toLowerCase();

  if (
    /\b(let me know when|once you've sent|once you send|have you sent|did you send|payment sent|confirmation from your end)\b/i.test(
      normalizedPrompt
    )
  ) {
    return buildQuickReplyPair('Yes, I sent the money.', 'No, I did not send any money.');
  }

  if (/\b(send|transfer|zelle|paypal|venmo|upi|wire|cash app|moneygram|western union)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can send the transfer.', 'No, I am not sending any money.');
  }

  if (/\b(otp|one[- ]time|verification|security)\s*(?:code|pin|passcode)?\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can share the OTP.', "No, I won't provide the OTP.");
  }

  if (/\b(last four|last 4|debit card|credit card|card number)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair(
      'Yes, I can share the card details.',
      "No, I won't share my card details."
    );
  }

  if (/\b(cvv|cvc)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can share the CVV.', "No, I won't share the CVV.");
  }

  if (/\b(password|login|username|user id|recovery code|seed phrase|wallet key|private key)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair(
      'Yes, I can provide those login details.',
      "No, I won't share my login details."
    );
  }

  if (/\b(full name|your name|confirm your name)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can share my name.', "No, I won't share my name.");
  }

  if (/\b(date of birth|dob|birthday)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair(
      'Yes, I can confirm my date of birth.',
      "No, I won't share my date of birth."
    );
  }

  if (/\b(address|postal|zip)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can confirm my address.', "No, I won't share my address.");
  }

  if (/\b(email|e-mail)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair('Yes, I can share my email.', "No, I won't share my email.");
  }

  if (/\b(phone|mobile|contact number)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair(
      'Yes, I can share my phone number.',
      "No, I won't share my phone number."
    );
  }

  if (
    /\b(operating system|windows|mac|linux|device|computer|laptop|desktop|system info|serial number|device id)\b/i.test(
      normalizedPrompt
    )
  ) {
    return buildQuickReplyPair(
      'Yes, I can share my device details.',
      "No, I won't share my device details."
    );
  }

  if (
    /\b(anydesk|teamviewer|quicksupport|remote access|download|install|msinfo32|windows key and r|run dialog)\b/i.test(
      normalizedPrompt
    )
  ) {
    return buildQuickReplyPair(
      'Yes, I can follow those steps.',
      "No, I won't do that on my device."
    );
  }

  if (/\b(verify|verification|identity|details)\b/i.test(normalizedPrompt)) {
    return buildQuickReplyPair(
      'Yes, I can verify that.',
      "No, I am not comfortable sharing that."
    );
  }

  if (scamType === 'bank_impersonation') {
    return buildQuickReplyPair(
      'Yes, tell me what you need to verify.',
      "No, I won't share my banking details."
    );
  }

  if (scamType === 'delivery_fraud') {
    return buildQuickReplyPair(
      'Yes, tell me how to fix the delivery issue.',
      "No, I won't share any delivery details."
    );
  }

  if (scamType === 'tech_support') {
    return buildQuickReplyPair(
      'Yes, tell me what I should do next.',
      "No, I won't change anything on my device."
    );
  }

  if (scamType === 'relational_scam') {
    return buildQuickReplyPair('Yes, tell me what you need.', "No, I can't help with that.");
  }

  return buildQuickReplyPair('Yes, tell me more.', "No, I won't do that.");
}

function validateChatInput(payload = {}) {
  const { message, quickReply } = payload;
  const hasMessage = typeof message === 'string' && message.trim().length > 0;
  const hasQuickReply = typeof quickReply === 'string' && quickReply.trim().length > 0;

  if (quickReply !== undefined) {
    const validatedQuickReply = validateQuickReplyInput(quickReply);

    if (!validatedQuickReply.valid) {
      return validatedQuickReply;
    }
  }

  if (message !== undefined && typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message must be a string.',
    };
  }

  if (hasMessage && hasQuickReply) {
    return {
      valid: false,
      error: 'Send either a text message or a quick reply, not both.',
    };
  }

  if (hasQuickReply) {
    const validatedQuickReply = validateQuickReplyInput(quickReply);

    return {
      valid: true,
      value: {
        text: validatedQuickReply.value,
        inputMode: 'quick_reply',
        quickReply: validatedQuickReply.value,
      },
    };
  }

  const validatedMessage = validateMessageInput(message);
  if (!validatedMessage.valid) {
    return validatedMessage;
  }

  return {
    valid: true,
    value: {
      text: validatedMessage.value,
      inputMode: 'text',
      quickReply: null,
    },
  };
}

function buildChatInputOptions(context = {}) {
  if (context?.isCompleted) {
    return {
      allowTextReply: true,
      quickReplies: [],
    };
  }

  const lastModelMessageText = getLatestModelMessageText(context.messages);
  return inferDynamicQuickReplies(lastModelMessageText, context.scamType || 'unknown');
}

module.exports = {
  buildChatInputOptions,
  validateChatInput,
  validateMessageInput,
};
