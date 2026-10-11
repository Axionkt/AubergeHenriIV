export default interface User {
  id: string;
  email: string;
  password_hash: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires: Date | null;
  is_google_auth: boolean;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: Date;
}
