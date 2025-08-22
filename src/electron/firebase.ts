import admin from "firebase-admin";
import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

// Resolve service account path

const serviceAccountPath = path.join(
        app.getAppPath(),
        isDev() ? '.' : '..',
        '/dist-electron/config/firebase-admin.json'
    )

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

// Verify ID token helper
export const verifyIdToken = (token: string) => {
  return admin.auth().verifyIdToken(token);
};
