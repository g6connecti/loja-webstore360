import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');

let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    projectId = config.projectId || projectId;
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || undefined,
  });
}

export const adminAuth = getAuth();
