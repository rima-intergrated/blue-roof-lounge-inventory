/*
  fix_entity_types.js
  Purpose: Update Attachment.entityType in MongoDB to match the folder in filePath (uploads/<entityType>/filename)
  - Adds a report file: backend/scripts/entity_type_update_report.json
  - Backs up previous entityType in 'prevEntityType' field for rollback.

  Usage:
    node backend/scripts/fix_entity_types.js
*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load backend .env if available
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('No backend/.env file found; falling back to environment variables.');
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blue_roof_lounge';

async function main() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  await mongoose.connect(MONGO_URI, { });

  const Attachment = require('../src/models/Attachment');

  const attachments = await Attachment.find({ filePath: { $exists: true, $ne: null } }).lean().exec();
  console.log(`Found ${attachments.length} attachments with filePath.`);

  const updates = [];

  for (const att of attachments) {
    const rawPath = att.filePath;
    if (!rawPath || typeof rawPath !== 'string') continue;

    // Normalize and split
    const normalized = path.normalize(rawPath);
    const parts = normalized.split(path.sep).filter(Boolean);
    // Find 'uploads' segment
    const idx = parts.findIndex(p => p.toLowerCase() === 'uploads');
    let derived = null;
    if (idx >= 0 && parts.length > idx + 1) {
      derived = parts[idx + 1];
    }

    if (derived && att.entityType !== derived) {
      updates.push({ _id: att._id, oldEntityType: att.entityType || null, newEntityType: derived, filePath: rawPath });
    }
  }

  console.log(`Prepared ${updates.length} updates.`);

  if (updates.length === 0) {
    console.log('No updates required. Exiting.');
    await mongoose.disconnect();
    return;
  }

  const reportPath = path.join(__dirname, 'entity_type_update_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), updates }, null, 2));
  console.log('Wrote report to', reportPath);

  // Apply updates, backing up previous entityType to prevEntityType
  const applied = [];
  for (const u of updates) {
    try {
      const res = await Attachment.updateOne({ _id: u._id }, { $set: { entityType: u.newEntityType }, $setOnInsert: {} }).exec();
      // Also set prevEntityType if not set
      await Attachment.updateOne({ _id: u._id, prevEntityType: { $exists: false } }, { $set: { prevEntityType: u.oldEntityType } }).exec();
      applied.push({ _id: u._id, oldEntityType: u.oldEntityType, newEntityType: u.newEntityType });
    } catch (err) {
      console.error('Failed to update', u._id, err);
    }
  }

  const appliedPath = path.join(__dirname, 'entity_type_update_applied.json');
  fs.writeFileSync(appliedPath, JSON.stringify({ appliedAt: new Date().toISOString(), applied }, null, 2));
  console.log('Applied updates written to', appliedPath);

  console.log(`Successfully applied ${applied.length} updates.`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
