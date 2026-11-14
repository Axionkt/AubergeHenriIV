export default interface User {
  id: string;
  email: string;
  password_hash: string | null;
  token_version: number;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  is_google_auth: boolean;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: Date;
}

export interface SafeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  email_verified: boolean;
  created_at: Date;
  token_version: number;
}
