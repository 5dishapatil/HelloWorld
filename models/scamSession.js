const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'scamSessions.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch (error) {
    await fs.writeFile(STORE_PATH, '[]', 'utf8');
  }
}

async function readSessions() {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function writeSessions(sessions) {
  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(sessions, null, 2), 'utf8');
}

function matchesFilter(session, filter = {}) {
  return Object.entries(filter).every(([key, value]) => session[key] === value);
}

class ScamSessionDocument {
  constructor(data) {
    Object.assign(this, clone(data));
  }

  async save() {
    const sessions = await readSessions();
    const index = sessions.findIndex((session) => session._id === this._id);

    if (index === -1) {
      throw new Error('Session not found.');
    }

    this.updatedAt = new Date().toISOString();
    sessions[index] = clone(this);
    await writeSessions(sessions);
    return this;
  }
}

async function create(data) {
  const now = new Date().toISOString();
  const sessionId = randomUUID();
  const session = {
    _id: sessionId,
    scamType: 'unknown',
    state: 'scamming',
    messages: [],
    trapAttempts: 0,
    successfulDefenses: 0,
    refusalCount: 0,
    appreciatedAt3: false,
    resultReason: '',
    riskScore: 0,
    isCompleted: false,
    turnCount: 0,
    lastAiMeta: {
      state: 'scamming',
      scamType: 'unknown',
      confidence: 0.5,
      userAction: 'neutral',
      trapAttemptDetected: false,
    },
    ...clone(data),
    _id: sessionId,
    createdAt: now,
    updatedAt: now,
  };

  const sessions = await readSessions();
  sessions.push(session);
  await writeSessions(sessions);
  return new ScamSessionDocument(session);
}

async function findOne(filter = {}) {
  const sessions = await readSessions();
  const session = sessions.find((item) => matchesFilter(item, filter));
  return session ? new ScamSessionDocument(session) : null;
}

async function listByUser(userId) {
  const sessions = await readSessions();
  return sessions
    .filter((session) => session.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((session) => clone(session));
}

async function deleteOne(filter = {}) {
  const sessions = await readSessions();
  const index = sessions.findIndex((item) => matchesFilter(item, filter));

  if (index === -1) {
    return null;
  }

  const [deleted] = sessions.splice(index, 1);
  await writeSessions(sessions);
  return new ScamSessionDocument(deleted);
}

module.exports = {
  create,
  deleteOne,
  findOne,
  listByUser,
};
