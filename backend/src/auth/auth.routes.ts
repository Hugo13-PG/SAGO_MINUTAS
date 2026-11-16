import { Router } from "express";
import { HttpError } from "../middlewares/error";

export const authRouter: Router = Router();

authRouter.post("/google", () => {
  throw new HttpError(
    501,
    "NOT_IMPLEMENTED",
    "POST /api/v1/auth/google se implementa en el WP2"
  );
});

authRouter.get("/me", () => {
  throw new HttpError(501, "NOT_IMPLEMENTED", "GET /api/v1/auth/me se implementa en el WP2");
});