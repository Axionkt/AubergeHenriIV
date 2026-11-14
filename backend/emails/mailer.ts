import { Resend } from "resend";
import { config } from "../config";
import { logError } from "../utils/logger";

const resend = new Resend(config.RESEND_API_KEY);

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * Fire-and-forget: the request doesn't wait for (or fail because of) the
 * email provider, but a rejected send is still logged instead of becoming
 * an unhandled rejection that would crash the process.
 */
export function sendInBackground(
  operation: string,
  send: Promise<unknown>,
): void {
  send.catch((error) => {
    logError(error, {
      forceServerError: true,
      operation,
    });
  });
}

/** Resend reports failures as `{ error }` rather than throwing. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const { error } = await resend.emails.send(message);

  if (error) {
    throw new Error(error.message);
  }
}

/** At most 100 messages per call (Resend's batch limit). */
export async function sendEmailBatch(messages: EmailMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const { error } = await resend.batch.send(messages);

  if (error) {
    throw new Error(error.message);
  }
}
