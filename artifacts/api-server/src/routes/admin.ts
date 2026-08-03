import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

// Rate-limit the login endpoint: max 5 failed attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // only count failures toward the limit
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /admin/login — verify PIN and create a server-side session
router.post("/admin/login", loginLimiter, async (req, res): Promise<void> => {
  const { pin } = req.body as { pin?: string };
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    req.log.error("ADMIN_PIN secret not configured");
    res.status(500).json({ error: "Admin PIN not configured on server" });
    return;
  }

  if (!pin || pin !== adminPin) {
    req.log.warn("Invalid admin PIN attempt");
    res.status(401).json({ error: "Invalid PIN" });
    return;
  }

  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) {
      req.log.error({ err }, "Failed to save session");
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ ok: true });
  });
});

// POST /admin/logout — destroy the admin session
router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.json({ ok: true });
  });
});

// GET /admin/me — check if currently authenticated (used on page load)
router.get("/admin/me", (req, res): void => {
  if (req.session?.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ isAdmin: false });
  }
});

export default router;
