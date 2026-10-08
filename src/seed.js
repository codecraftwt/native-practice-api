require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/tenant.model');
const User = require('./models/user.model');
const Floor = require('./models/floor.model');
const Section = require('./models/section.model');
const Table = require('./models/table.model');

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
    tenant = await Tenant.create({
      name: DEMO_TENANT,
      email: 'hello@dineflow.test',
      phone: '+91 98765 43210',
      address: '42 Residency Road, Bengaluru, KA 560025',
      gstNumber: '29ABCDE1234F1Z5',
      timezone: 'Asia/Kolkata',
      hours: { open: '09:00', close: '23:00' },
      settings: { currency: 'INR', taxRate: 5, serviceChargeRate: 7.5 },
    });
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

  const floorCount = await Floor.countDocuments({ tenantId: tenant._id });
  if (floorCount === 0) {
    const ground = await Floor.create({
      tenantId: tenant._id,
      name: 'Ground Floor',
      description: 'Main dining and patio',
      displayOrder: 1,
    });
    const first = await Floor.create({
      tenantId: tenant._id,
      name: 'First Floor',
      description: 'Family section',
      displayOrder: 2,
    });
    const mainHall = await Section.create({
      tenantId: tenant._id,
      floorId: ground._id,
      name: 'Main Hall',
      displayOrder: 1,
    });
    const patio = await Section.create({
      tenantId: tenant._id,
      floorId: ground._id,
      name: 'Patio',
      displayOrder: 2,
    });
    const family = await Section.create({
      tenantId: tenant._id,
      floorId: first._id,
      name: 'Family Section',
      displayOrder: 1,
    });
    const plan = [
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T1', capacity: 4, status: 'AVAILABLE' },
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T2', capacity: 4, status: 'OCCUPIED' },
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T3', capacity: 6, status: 'AVAILABLE' },
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T4', capacity: 4, status: 'OCCUPIED' },
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T5', capacity: 6, status: 'AVAILABLE' },
      { floorId: ground._id, sectionId: mainHall._id, tableNumber: 'T6', capacity: 2, status: 'OCCUPIED' },
      { floorId: ground._id, sectionId: patio._id, tableNumber: 'T7', capacity: 2, status: 'AVAILABLE' },
      { floorId: ground._id, sectionId: patio._id, tableNumber: 'T8', capacity: 4, status: 'RESERVED' },
      { floorId: ground._id, sectionId: patio._id, tableNumber: 'T9', capacity: 4, status: 'AVAILABLE' },
      { floorId: first._id, sectionId: family._id, tableNumber: 'T10', capacity: 6, status: 'BILLING' },
      { floorId: first._id, sectionId: family._id, tableNumber: 'T11', capacity: 6, status: 'AVAILABLE' },
      { floorId: first._id, sectionId: family._id, tableNumber: 'T12', capacity: 4, status: 'OUT_OF_SERVICE' },
    ];
    await Table.insertMany(
      plan.map((t) => ({ tenantId: tenant._id, ...t }))
    );
    console.log('Created floor plan: 2 floors, 3 sections, 12 tables');
  } else {
    console.log('Floor plan already exists - skipped');
  }

  console.log('\nSeed complete.');
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
