import { Router } from "express";
import { registerUuidParams } from "../../middleware/paramValidation";
import type { SetSpaceAvailabilityRequest } from "../../schemas/space";
import type {
  SpaceAccessGrant,
  SpaceAccessRevoke,
} from "../../schemas/userAccess";
import type { ValidationOutcome } from "../../schemas/shared/fields";
import type { SpaceUserAccess } from "../../types/space";
import { asyncHandler } from "../../utils/asyncHandler";
import { assertValid } from "../../utils/validation";
import { audit } from "../../utils/audit";

interface AdminSpaceServiceLike<TCreate, TUpdate> {
  create(data: TCreate): Promise<string>;
  getAll(): Promise<unknown>;
  getById(id: string): Promise<unknown>;
  update(id: string, data: TUpdate): Promise<string>;
  delete(id: string): Promise<void>;
  setAvailability(
    id: string,
    isAvailable: boolean,
    revokeAccesses: boolean,
  ): Promise<void>;
  getUsers(spaceId: string): Promise<SpaceUserAccess[]>;
  getAllUserAccesses(): Promise<SpaceUserAccess[]>;
  grantAccess(request: SpaceAccessGrant): Promise<void>;
  revokeAccess(request: SpaceAccessRevoke): Promise<void>;
  getCommonSpaceMedia(): Promise<unknown>;
  getMediaById(id: string): Promise<unknown>;
}

interface Options<TCreate, TUpdate, TAccessAdminDTO> {
  /** Label used in audit log entries. */
  kind: "apartment" | "pro-space";
  service: AdminSpaceServiceLike<TCreate, TUpdate>;
  validateCreate: (body: unknown) => ValidationOutcome<TCreate>;
  validateUpdate: (body: unknown) => ValidationOutcome<TUpdate>;
  validateAvailability: (
    body: unknown,
  ) => ValidationOutcome<SetSpaceAvailabilityRequest>;
  validateGrant: (body: unknown) => ValidationOutcome<SpaceAccessGrant>;
  validateRevoke: (body: unknown) => ValidationOutcome<SpaceAccessRevoke>;
  toAccessAdminDTO: (access: SpaceUserAccess) => TAccessAdminDTO;
}

export function createAdminSpaceRouter<TCreate, TUpdate, TAccessAdminDTO>({
  service,
  validateCreate,
  validateUpdate,
  validateAvailability,
  validateGrant,
  validateRevoke,
  toAccessAdminDTO,
  kind,
}: Options<TCreate, TUpdate, TAccessAdminDTO>) {
  const router = Router();
  registerUuidParams(router, ["uuid"]);

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.status(200).json(await service.getAll());
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const data = assertValid(validateCreate(req.body));
      const newId = await service.create(data);
      audit("space.create", { targetType: kind, targetIds: [newId] });
      res.status(201).json(newId);
    }),
  );

  // Keep these before "/:uuid" so "user-accesses" isn't parsed as a uuid.
  router
    .route("/user-accesses")
    .get(
      asyncHandler(async (_req, res) => {
        const accesses = await service.getAllUserAccesses();
        res.status(200).json(accesses.map(toAccessAdminDTO));
      }),
    )
    .post(
      asyncHandler(async (req, res) => {
        const grant = assertValid(validateGrant(req.body));
        await service.grantAccess(grant);
        audit("access.grant", {
          targetType: kind,
          targetIds: grant.spaceIds,
          userIds: grant.userIds,
          accessExpiry: grant.accessExpiry,
        });
        res.sendStatus(204);
      }),
    )
    .delete(
      asyncHandler(async (req, res) => {
        const revoke = assertValid(validateRevoke(req.body));
        await service.revokeAccess(revoke);
        audit("access.revoke", {
          targetType: kind,
          targetIds: revoke.spaceIds,
          userIds: revoke.userIds,
        });
        res.sendStatus(204);
      }),
    );

  router.get(
    "/:uuid/user-accesses",
    asyncHandler(async (req, res) => {
      const users = await service.getUsers(req.params.uuid);
      res.status(200).json(users.map(toAccessAdminDTO));
    }),
  );

  router.get(
    "/common-space/media",
    asyncHandler(async (_req, res) => {
      res.status(200).json(await service.getCommonSpaceMedia());
    }),
  );

  router
    .route("/:uuid")
    .get(
      asyncHandler(async (req, res) => {
        res.status(200).json(await service.getById(req.params.uuid));
      }),
    )
    .put(
      asyncHandler(async (req, res) => {
        const data = assertValid(validateUpdate(req.body));
        await service.update(req.params.uuid, data);
        audit("space.update", {
          targetType: kind,
          targetIds: [req.params.uuid],
          fields: Object.keys(data as object),
        });
        res.sendStatus(204);
      }),
    )
    .delete(
      asyncHandler(async (req, res) => {
        await service.delete(req.params.uuid);
        audit("space.delete", { targetType: kind, targetIds: [req.params.uuid] });
        res.sendStatus(204);
      }),
    );

  router.put(
    "/:uuid/availability",
    asyncHandler(async (req, res) => {
      const { isAvailable, revokeAccesses } = assertValid(
        validateAvailability(req.body),
      );
      await service.setAvailability(
        req.params.uuid,
        isAvailable,
        revokeAccesses,
      );
      audit("space.availability", {
        targetType: kind,
        targetIds: [req.params.uuid],
        isAvailable,
        revokeAccesses,
      });
      res.sendStatus(204);
    }),
  );

  router.get(
    "/:uuid/media",
    asyncHandler(async (req, res) => {
      res.status(200).json(await service.getMediaById(req.params.uuid));
    }),
  );

  return router;
}
