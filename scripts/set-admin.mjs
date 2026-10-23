import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2]?.trim();

if (!email) {
  console.error("Usage: npm run admin:set -- admin@example.com");
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

try {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim set for ${email}. Sign out and sign in again to refresh the token.`);
} catch (error) {
  console.error(`Could not set admin claim for ${email}:`, error.message);
  process.exitCode = 1;
}
