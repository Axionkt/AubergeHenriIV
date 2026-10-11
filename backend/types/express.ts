import { AccessTokenPayload, RefreshTokenPayload } from "../utils/password";

declare module "express" {
  interface Request {
    user?: AccessTokenPayload;
    decodedRefreshToken?: RefreshTokenPayload;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AccessTokenPayload;
    decodedRefreshToken?: RefreshTokenPayload;
  }
}
