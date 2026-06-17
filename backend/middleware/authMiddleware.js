// authMiddleware.js — FIXED
// ─────────────────────────────────────────────────────────────────────────────
// WHAT WAS BROKEN:
//   The middleware exported `isAuthenticated` AND `protect` (alias).
//   reportRoutes.js used `protect` — that was fine.
//   pdfRoutes.js was likely using a DIFFERENT middleware name OR the pdf routes
//   were not protected at all, so PDF endpoints hit the DB without req.user
//   causing the "No token provided" 401 error the browser showed.
//
// WHY IT FAILED:
//   PDF download from the frontend used raw fetch() without the Authorization
//   header. The fix is in BOTH places:
//     1. pdfRoutes.js must wrap all routes with `protect` middleware.
//     2. Frontend downloadPdf() must include the Bearer token.
//
// EXACT FIX:
//   - Kept the middleware identical (it was already correct).
//   - Added req.user.id normalization: some JWT payloads store the id as
//     `_id` instead of `id`. We normalise here so req.user.id is always set.
//   - Added explicit debug log so you can confirm token is reaching the server.
// ─────────────────────────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // FIX: this was the exact error the PDF endpoint was returning.
      // Cause: frontend fetch() call for PDF did not include the Authorization header.
      // Fix applied in reportAPI.js (downloadPdf helper) and pdfRoutes.js.
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: Normalise the user id field.
    // Some JWT sign() calls use { id: user._id } and some use { _id: user._id }.
    // We make sure req.user.id is ALWAYS populated regardless.
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id || decoded.userId,
    };

    // DEBUG — remove after confirming req.user.id is correct
    console.log("[AUTH] JWT USER:", req.user);
    console.log("[AUTH] OWNER ID resolved as:", req.user.id);

    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Token does not contain a user id (checked: id, _id, userId)",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};

// Both names exported — use whichever you prefer in your route files.
export const protect = isAuthenticated;