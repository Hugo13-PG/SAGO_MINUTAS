import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import type { App, Credential, ServiceAccount } from "firebase-admin/app";
import { getAuth as getFirebaseAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";
import { getFirestore as getFirebaseFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { env } from "./env";

let app: App | undefined;

function crearCredencial(): Credential {
  const base64 = env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim();

  if (base64.length > 0) {
    const json = Buffer.from(base64, "base64").toString("utf8");
    const serviceAccount = JSON.parse(json) as ServiceAccount;
    return cert(serviceAccount);
  }

  return applicationDefault();
}

export function getFirebaseAdmin(): App {
  if (app) {
    return app;
  }

  app = initializeApp({
    credential: crearCredencial(),
    projectId: env.FIREBASE_PROJECT_ID,
  });

  return app;
}

export function getAuth(): Auth {
  return getFirebaseAuth(getFirebaseAdmin());
}

export function getDb(): Firestore {
  return getFirebaseFirestore(getFirebaseAdmin());
}
