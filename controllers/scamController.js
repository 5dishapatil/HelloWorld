const ScamSession = require('../models/scamSession');
const { generateScammerResponse } = require('../services/geminiService');
const {
  MAX_REFUSALS,
  analyzeUserInput,
  buildForcedCompletion,
} = require('../utils/simulationGuardrails');
const { buildChatInputOptions, validateChatInput } = require('../utils/validator');

const MAX_TURNS = 20;

const PRAISE_MESSAGE =
  "Excellent work! You've resisted 3 scam attempts without giving in. That's exactly the kind of caution that keeps people safe.";

const STARTER_SCAMS = {
  bank_impersonation:
    "Hello ma'am, this is the bank security team. We've detected suspicious activity on your account. Please verify your identity immediately to prevent your account from being frozen.",
  delivery_fraud:
    'Hello, your parcel delivery has been placed on hold due to an address verification issue. Please confirm your details now to avoid cancellation.',
  tech_support:
    'Hello, this is Microsoft support. Your device has been flagged for suspicious activity. Please confirm if you are near your computer so we can help secure it.',
  relational_scam:
    "Hi... I know this may seem sudden, but I really trust you. I'm in a difficult situation right now and need your help urgently.",
};

function buildModelMessage(text, options = {}) {
  const inputOptions =
    options.inputOptions ||
    buildChatInputOptions({
      scamType: options.scamType,
      refusalCount: options.refusalCount,
      messages: [{ role: 'model', parts: [{ text }] }],
      isCompleted: options.isCompleted,
    });

  return {
    role: 'model',
    parts: [{ text }],
    speakerLabel: options.speakerLabel || 'Scammer',
    allowTextReply: inputOptions.allowTextReply,
    quickReplies: inputOptions.quickReplies.map((reply) => reply.value),
  };
}

function buildSessionInputOptions(session) {
  return buildChatInputOptions({
    scamType: session?.scamType,
    refusalCount: Number(session?.refusalCount || 0),
    messages: session?.messages,
    isCompleted: Boolean(session?.isCompleted),
  });
}

function buildUserMessage(text, inputMode, quickReply) {
  return {
    role: 'user',
    parts: [{ text }],
    inputMode,
    ...(quickReply ? { quickReply } : {}),
  };
}

function isValidSessionId(sessionId) {
  return typeof sessionId === 'string' && sessionId.trim().length > 0;
}

function pickScamType(requestedType) {
  const allowed = Object.keys(STARTER_SCAMS);

  if (requestedType && allowed.includes(requestedType)) {
    return requestedType;
  }

  const randomIndex = Math.floor(Math.random() * allowed.length);
  return allowed[randomIndex];
}

function buildSessionSummary(session, latestReply) {
  return {
    id: session._id,
    scamType: session.scamType,
    state: session.state,
    isCompleted: session.isCompleted,
    turnCount: session.turnCount,
    trapAttempts: session.trapAttempts,
    successfulDefenses: session.successfulDefenses,
    refusalCount: Number(session.refusalCount || 0),
    latestReply,
    messages: session.messages,
    inputOptions: buildSessionInputOptions(session),
  };
}

function buildMessageResponse(updatedSession, reply, extras = {}) {
  return {
    success: true,
    data: {
      sessionId: updatedSession._id,
      reply,
      state: updatedSession.state,
      scamType: updatedSession.scamType,
      riskScore: updatedSession.riskScore,
      turnCount: updatedSession.turnCount,
      trapAttempts: updatedSession.trapAttempts,
      successfulDefenses: updatedSession.successfulDefenses,
      refusalCount: Number(updatedSession.refusalCount || 0),
      isCompleted: updatedSession.isCompleted,
      showPraiseBanner: false,
      praiseMessage: null,
      noticeMessage: '',
      resultReason: updatedSession.resultReason,
      messages: updatedSession.messages,
      inputOptions: buildSessionInputOptions(updatedSession),
      ...extras,
    },
  };
}

async function finalizeSessionWithReveal({
  session,
  userMessageText,
  inputMode,
  quickReply,
  refusalCount,
  successfulDefenseIncrement,
  forcedCompletion,
  scamTypeOverride,
}) {
  const nextScamType = scamTypeOverride || session.scamType;
  const revealInputOptions = buildChatInputOptions({
    scamType: nextScamType,
    refusalCount,
    messages: [{ role: 'model', parts: [{ text: forcedCompletion.message }] }],
    isCompleted: true,
  });

  session.messages.push(
    buildUserMessage(userMessageText, inputMode, quickReply),
    buildModelMessage(forcedCompletion.message, {
      speakerLabel: forcedCompletion.speakerLabel,
      inputOptions: revealInputOptions,
      scamType: nextScamType,
      refusalCount,
      isCompleted: true,
    })
  );
  session.turnCount += 1;
  session.refusalCount = refusalCount;
  session.successfulDefenses += successfulDefenseIncrement;
  session.state = forcedCompletion.state;
  session.scamType = nextScamType;
  session.resultReason = forcedCompletion.resultReason;
  session.riskScore = forcedCompletion.riskScore;
  session.isCompleted = true;
  session.lastAiMeta = {
    state: forcedCompletion.state,
    scamType: nextScamType,
    confidence: forcedCompletion.confidence,
    userAction: forcedCompletion.userAction,
    trapAttemptDetected: forcedCompletion.trapAttemptDetected,
  };

  if (forcedCompletion.shouldPraise) {
    session.appreciatedAt3 = true;
  }

  return session.save();
}

const startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedScamType = req.body?.scamType;
    const scamType = pickScamType(requestedScamType);
    const initialMessage = STARTER_SCAMS[scamType];

    const newSession = await ScamSession.create({
      user: userId,
      scamType,
      state: 'scamming',
      messages: [buildModelMessage(initialMessage)],
      trapAttempts: 1,
      successfulDefenses: 0,
      refusalCount: 0,
      appreciatedAt3: false,
      resultReason: 'Session started',
      riskScore: 10,
      isCompleted: false,
      turnCount: 0,
      lastAiMeta: {
        state: 'scamming',
        scamType,
        confidence: 1,
        userAction: 'neutral',
        trapAttemptDetected: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Scam simulation session started.',
      session: buildSessionSummary(newSession, initialMessage),
    });
  } catch (error) {
    console.error('Start Session Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start scam session.',
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID.',
      });
    }

    const validated = validateChatInput(req.body || {});
    if (!validated.valid) {
      return res.status(400).json({
        success: false,
        error: validated.error,
      });
    }

    const { text: userMessageText, inputMode, quickReply } = validated.value;

    const session = await ScamSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }

    if (session.isCompleted) {
      return res.status(400).json({
        success: false,
        error: 'This session has already ended.',
      });
    }

    if (session.turnCount >= MAX_TURNS) {
      session.isCompleted = true;
      session.state = 'defended';
      session.resultReason = 'Maximum turns reached';
      await session.save();

      return res.status(400).json({
        success: false,
        error: 'Maximum turns reached. Session ended.',
      });
    }

    const userInputAnalysis = analyzeUserInput({
      text: userMessageText,
      quickReply,
      messages: session.messages,
    });
    const refusalIncrement = userInputAnalysis.refusalDetected ? 1 : 0;
    const nextRefusalCount = Number(session.refusalCount || 0) + refusalIncrement;

    if (userInputAnalysis.disclosure) {
      const forcedCompletion = buildForcedCompletion({
        outcome: 'compromised',
        scamType: session.scamType,
        disclosureType: userInputAnalysis.disclosure.type,
        resultReason: userInputAnalysis.disclosure.resultReason,
      });
      const updatedSession = await finalizeSessionWithReveal({
        session,
        userMessageText,
        inputMode,
        quickReply,
        refusalCount: nextRefusalCount,
        successfulDefenseIncrement: 0,
        forcedCompletion,
      });
      const revealReply =
        updatedSession.messages[updatedSession.messages.length - 1]?.parts?.[0]?.text || '';

      return res
        .status(200)
        .json(
          buildMessageResponse(updatedSession, revealReply, {
            noticeMessage: forcedCompletion.noticeMessage,
          })
        );
    }

    if (nextRefusalCount >= MAX_REFUSALS) {
      const forcedCompletion = buildForcedCompletion({
        outcome: 'defended',
        scamType: session.scamType,
        refusalCount: nextRefusalCount,
        resultReason: 'User refused to comply three times, so the simulation ended and revealed itself.',
      });

      const updatedSession = await finalizeSessionWithReveal({
        session,
        userMessageText,
        inputMode,
        quickReply,
        refusalCount: nextRefusalCount,
        successfulDefenseIncrement: 1,
        forcedCompletion,
      });

      return res
        .status(200)
        .json(
          buildMessageResponse(updatedSession, forcedCompletion.message, {
            noticeMessage:
              nextRefusalCount >= MAX_REFUSALS
                ? PRAISE_MESSAGE
                : forcedCompletion.noticeMessage,
          })
        );
    }

    const aiResponse = await generateScammerResponse(session.messages, userMessageText, {
      scamType: session.scamType,
      refusalCount: nextRefusalCount,
    });
    const normalizedAiResponse =
      aiResponse.state === 'compromised' || aiResponse.state === 'defended'
        ? {
            ...aiResponse,
            state: 'scamming',
            userAction:
              aiResponse.userAction === 'fell_for_it' || aiResponse.userAction === 'resisted'
                ? 'neutral'
                : aiResponse.userAction,
            resultReason:
              'Continuing the simulation until the user either refuses three times or shares sensitive information.',
          }
        : aiResponse;

    let finalState = normalizedAiResponse.state;
    let isCompleted = false;

    if (session.turnCount + 1 >= MAX_TURNS) {
      isCompleted = true;
      if (normalizedAiResponse.state === 'scamming') {
        finalState = 'defended';
      }
    }

    const successfulDefenseIncrement = normalizedAiResponse.userAction === 'resisted' ? 1 : 0;
    const trapAttemptIncrement = normalizedAiResponse.trapAttemptDetected ? 1 : 0;
    const newSuccessfulDefenses = session.successfulDefenses + successfulDefenseIncrement;
    const shouldTriggerPraise = newSuccessfulDefenses >= 3 && !session.appreciatedAt3;

    session.messages.push(
      buildUserMessage(userMessageText, inputMode, quickReply),
      buildModelMessage(normalizedAiResponse.message)
    );
    session.turnCount += 1;
    session.refusalCount = nextRefusalCount;
    session.successfulDefenses += successfulDefenseIncrement;
    session.trapAttempts += trapAttemptIncrement;
    session.state = finalState;
    session.scamType = normalizedAiResponse.scamType || session.scamType;
    session.resultReason = normalizedAiResponse.resultReason;
    session.riskScore = normalizedAiResponse.riskScore;
    session.isCompleted = isCompleted;
    session.lastAiMeta = {
      state: finalState,
      scamType: normalizedAiResponse.scamType || session.scamType,
      confidence: normalizedAiResponse.confidence,
      userAction: normalizedAiResponse.userAction,
      trapAttemptDetected: normalizedAiResponse.trapAttemptDetected,
    };

    if (shouldTriggerPraise) {
      session.appreciatedAt3 = true;
    }

    const updatedSession = await session.save();

    return res
      .status(200)
      .json(
        buildMessageResponse(updatedSession, normalizedAiResponse.message, {
          showPraiseBanner: shouldTriggerPraise,
          praiseMessage: shouldTriggerPraise ? PRAISE_MESSAGE : null,
          noticeMessage: shouldTriggerPraise ? PRAISE_MESSAGE : '',
          acceptedInput: {
            mode: inputMode,
            text: userMessageText,
            quickReply,
          },
        })
      );
  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process message.',
    });
  }
};

const getSessionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID.',
      });
    }

    const session = await ScamSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }

    return res.status(200).json({
      success: true,
      session,
      inputOptions: buildSessionInputOptions(session),
    });
  } catch (error) {
    console.error('Get Session Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch session.',
    });
  }
};

const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = (await ScamSession.listByUser(userId)).map((session) => ({
      _id: session._id,
      scamType: session.scamType,
      state: session.state,
      riskScore: session.riskScore,
      isCompleted: session.isCompleted,
      turnCount: session.turnCount,
      trapAttempts: session.trapAttempts,
      successfulDefenses: session.successfulDefenses,
      refusalCount: Number(session.refusalCount || 0),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
      inputOptions: buildChatInputOptions({ isCompleted: true }),
    });
  } catch (error) {
    console.error('Get My Sessions Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch session history.',
    });
  }
};

const endSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID.',
      });
    }

    const session = await ScamSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }

    session.isCompleted = true;
    session.state = 'defended';
    session.resultReason = 'Ended manually by user';
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Session ended successfully.',
      session,
    });
  } catch (error) {
    console.error('End Session Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end session.',
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID.',
      });
    }

    const deleted = await ScamSession.deleteOne({
      _id: sessionId,
      user: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Session Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete session.',
    });
  }
};

module.exports = {
  startSession,
  sendMessage,
  getSessionById,
  getMySessions,
  endSession,
  deleteSession,
};
