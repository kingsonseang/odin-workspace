import type { UserRepository } from "@forgeboard/domain";
import { Router } from "express";
import { toUserDto } from "../http/presenters";

export function createUsersRouter(users: UserRepository): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ users: users.list().map(toUserDto) });
  });

  return router;
}
