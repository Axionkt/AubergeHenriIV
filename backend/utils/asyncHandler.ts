import { Request, Response, NextFunction } from "express";

export function asyncHandler<P = Record<string, string>>(
  fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request<P>, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
