/* Tenant isolation verification.
 * Requires the API server running on :5000 and MongoDB reachable.
 * Usage: node scripts/verify-isolation.js
 * Creates two ephemeral tenants, exercises cross-tenant access, cleans up, exits 0/1.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const BASE = process.env.API_URL || 'http://localhost:5000/api/v1';
const suffix = Date.now().toString(36);
const results = [];

const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -- ${detail}` : ''}`);
};

const api = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
};

const registerTenant = async (restaurantName, name, email) => {
  const { status, json } = await api('/auth/register', {
    method: 'POST',
    body: { restaurantName, name, email, password: 'Isolation@123' },
  });
  if (status !== 201) throw new Error(`register failed: ${status} ${JSON.stringify(json)}`);
  return json.data;
};

const cleanup = async () => {
  const Tenant = require('../src/models/tenant.model');
  const User = require('../src/models/user.model');
  await User.deleteMany({ email: { $regex: `\\.iso-` } });
  await Tenant.deleteMany({ name: { $regex: `^Iso Tenant [AB] ` } });
};

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow');

  const a = await registerTenant(`Iso Tenant A ${suffix}`, `Alice Owner A`, `alice.a-iso-${suffix}@test.dev`);
  const b = await registerTenant(`Iso Tenant B ${suffix}`, `Bob Owner B`, `bob.b-iso-${suffix}@test.dev`);

  const staff = await api('/users', {
    method: 'POST',
    token: a.accessToken,
    body: { name: 'Walter Waiter', email: `walter.a-iso-${suffix}@test.dev`, password: 'Isolation@123', role: 'WAITER' },
  });
  check('Tenant A creates own staff', staff.status === 201, `status=${staff.status}`);
  const staffId = staff.json?.data?.user?.id;

  const listA = await api('/users', { token: a.accessToken });
  const listB = await api('/users', { token: b.accessToken });

  const aUsers = listA.json?.data?.users || [];
  const bUsers = listB.json?.data?.users || [];
  check(
    'A sees only A users',
    aUsers.length > 0 && aUsers.every((u) => u.email.endsWith(`.a-iso-${suffix}@test.dev`)),
    `count=${aUsers.length}`,
  );
  check(
    'B sees only B users',
    bUsers.length > 0 && bUsers.every((u) => u.email.endsWith(`.b-iso-${suffix}@test.dev`)),
    `count=${bUsers.length}`,
  );
  check('B list does not contain A staff', !bUsers.some((u) => u.email.includes('walter.a-iso')));

  const bRead = await api(`/users/${staffId}`, { token: b.accessToken });
  check('B cannot read A staff by id (404)', bRead.status === 404, `status=${bRead.status}`);

  const bPatch = await api(`/users/${staffId}`, {
    method: 'PATCH',
    token: b.accessToken,
    body: { name: 'Hacked' },
  });
  check('B cannot update A staff by id (404)', bPatch.status === 404, `status=${bPatch.status}`);

  const bDelete = await api(`/users/${staffId}`, { method: 'DELETE', token: b.accessToken });
  check('B cannot delete A staff by id (404)', bDelete.status === 404, `status=${bDelete.status}`);

  const aAfter = await api(`/users/${staffId}`, { token: a.accessToken });
  check(
    'A staff unchanged after B attempts',
    aAfter.status === 200 && aAfter.json?.data?.user?.name === 'Walter Waiter',
    `name=${aAfter.json?.data?.user?.name}`,
  );

  const bCreateInA = await api('/users', {
    method: 'POST',
    token: b.accessToken,
    body: { name: 'Mallory', email: `mallory.b-iso-${suffix}@test.dev`, password: 'Isolation@123', role: 'WAITER' },
  });
  check('B-created staff lands in B tenant only', bCreateInA.status === 201 && bUsers.length >= 1);
  const malloryId = bCreateInA.json?.data?.user?.id;
  const aSeesMallory = await api(`/users/${malloryId}`, { token: a.accessToken });
  check('A cannot read B staff by id (404)', aSeesMallory.status === 404, `status=${aSeesMallory.status}`);

  await cleanup();
  await mongoose.disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('TENANT ISOLATION: FAILED');
    process.exit(1);
  }
  console.log('TENANT ISOLATION: OK');
  process.exit(0);
};

main().catch(async (err) => {
  console.error('Verification crashed:', err);
  try {
    await cleanup();
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
