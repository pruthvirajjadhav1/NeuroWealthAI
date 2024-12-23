import { v4 as uuidv4 } from "uuid"; // Import the uuid package

export function generateToken(subscriptionType: 'paid' | 'trial' | 'free'): string {
  // Generate a UUID token for each subscription type
  const token = uuidv4();
  return token;
}
