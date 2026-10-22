import type { UserRepository } from "@forgeboard/domain";
import type { RequestHandler, Response } from "express";
import { HttpError } from "./errors";

export const ACTOR_HEADER = "x-forgeboard-user";

export function requireActor(users: UserRepository): RequestHandler {
  return (req, _res, next) => {
    const userId = req.header(ACTOR_HEADER)?.trim();
    if (!userId) {
      next(
        new HttpError(
          401,
          "MISSING_ACTOR",
          `Send the ${ACTOR_HEADER} header to choose a demo user.`
        )
      );
      return;
    }

    const user = users.findById(userId);
    if (!user) {
      next(new HttpError(401, "UNKNOWN_ACTOR", "That demo user does not exist."));
      return;
    }

    _res.locals.actorId = user.id;
    next();
  };
}

export function getActorId(res: Response): string {
  const actorId: unknown = res.locals.actorId;
  if (typeof actorId !== "string") {
    throw new HttpError(
      500,
      "ACTOR_NOT_RESOLVED",
      "The request actor was not resolved."
    );
  }
  return actorId;
}
