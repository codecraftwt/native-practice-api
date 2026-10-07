require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/tenant.model');
const User = require('./models/user.model');

const DEMO_TENANT = 'DineFlow Demo Restaurant';
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Dineflow@123';

const DEMO_USERS = [
  { email: 'owner@dineflow.test', name: 'Olivia Owner', role: 'OWNER' },
  { email: 'manager@dineflow.test', name: 'Mike Manager', role: 'MANAGER' },
  { email: 'waiter@dineflow.test', name: 'Walter Waiter', role: 'WAITER' },
  { email: 'cashier@dineflow.test', name: 'Cara Cashier', role: 'CASHIER' },
  { email: 'kitchen@dineflow.test', name: 'Kenny Kitchen', role: 'KITCHEN' },
];

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let tenant = await Tenant.findOne({ name: DEMO_TENANT });
  if (!tenant) {
    tenant = await Tenant.create({ name: DEMO_TENANT });
    console.log(`Created tenant: ${tenant.name}`);
  } else {
    console.log(`Tenant already exists: ${tenant.name}`);
  }

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`Skipped (exists): ${u.email} [${existing.role}]`);
      continue;
    }
    await User.create({
      tenantId: tenant._id,
      name: u.name,
      email: u.email,
      password: DEMO_PASSWORD,
      role: u.role,
    });
    console.log(`Created: ${u.email} [${u.role}]`);
  }

  console.log('\nSeed complete.');
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
