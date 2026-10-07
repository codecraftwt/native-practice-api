const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

const REFRESH_TTL_MS = (() => {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = /^(\d+)([dhms])$/.exec(raw.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[match[2]];
  return n * unit;
})();

const toId = (value) => (value && value._id ? value._id : value).toString();

const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: toId(user._id),
      tenantId: toId(user.tenantId),
      role: user.role,
      name: user.name,
      email: user.email,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  };
};

module.exports = { signAccessToken, createRefreshToken, hashToken };
