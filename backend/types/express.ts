import type { AccessTokenPayload, RefreshTokenPayload } from "../utils/tokens";
import type { MediaRecord } from "./media";

declare module "express" {
  interface Request {
    id?: string;
    user?: AccessTokenPayload;
    decodedRefreshToken?: RefreshTokenPayload;
    media?: MediaRecord;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    user?: AccessTokenPayload;
    decodedRefreshToken?: RefreshTokenPayload;
    media?: MediaRecord;
  }
}
