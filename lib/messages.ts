import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/* Public: anyone can send an enquiry. Admins read these in the console. */
export async function sendMessage(input: ContactInput): Promise<void> {
  await addDoc(collection(db, "messages"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}
