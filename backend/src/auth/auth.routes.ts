import { Router } from "express";
import { requiereAuth } from "../middlewares/auth";
import { authController } from "./auth.controller";

export const authRouter: Router = Router();

authRouter.post("/google", authController.loginConGoogle);

authRouter.get("/me", requiereAuth, authController.miPerfil);