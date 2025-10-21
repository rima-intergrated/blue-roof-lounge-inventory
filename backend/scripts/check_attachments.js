/*
  Script: check_attachments.js
  Purpose: Connect to MongoDB and verify that files referenced by Attachment.filePath exist on disk.
  Usage: From repository root (where backend/.env exists):
    node backend/scripts/check_attachments.js

  The script reads MONGO_URI from backend/.env or uses a default of mongodb://127.0.0.1:27017/yourdb
*/

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load backend .env if available
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('No backend/.env file found; falling back to environment variables.');
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blue_roof';

async function main() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Load Attachment model
  const Attachment = require('../src/models/Attachment');

  console.log('Querying attachments...');
  const attachments = await Attachment.find({}).lean().exec();
  console.log(`Found ${attachments.length} attachments.`);

  const uploadRoot = path.resolve(path.join(__dirname, '..', '..', 'uploads'));
  console.log('Assuming uploads root at', uploadRoot);

  const missing = [];
  for (const att of attachments) {
    const p = att.filePath || (att.fileName ? path.join(uploadRoot, att.entityType || '', att.fileName) : null);
    if (!p) {
      missing.push({ id: att._id, reason: 'no filePath', att });
      continue;
    }
    if (!fs.existsSync(p)) {
      missing.push({ id: att._id, filePath: p, url: att.fileUrl || null, downloadUrl: att.downloadUrl || null, originalName: att.originalName });
    }
  }

  if (missing.length === 0) {
    console.log('All files exist on disk.');
  } else {
    console.log('Missing files:', missing.length);
    missing.forEach(m => console.log(JSON.stringify(m, null, 2)));
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
