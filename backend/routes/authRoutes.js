import express from "express";

import {
  createOwner,
  loginOwner,
  verifyOwner,
  resetPin,
} from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/create-owner",
  createOwner
);

router.post(
  "/login",
  loginOwner
);

router.post(
  "/verify-owner",
  verifyOwner
);

router.put(
  "/reset-pin",
  resetPin
);

export default router;