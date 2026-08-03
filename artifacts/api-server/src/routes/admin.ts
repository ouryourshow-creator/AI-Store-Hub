import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";

const router: IRouter = Router();

// GET /admin/me — check if currently authenticated as admin
// Used by the frontend on page load to verify Clerk auth + email whitelist
router.get("/admin/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    res.status(401).json({ isAdmin: false });
    return;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim())
    .filter(Boolean);

  // No whitelist configured — any authenticated user is admin (initial setup mode)
  if (adminEmails.length === 0) {
    res.json({ isAdmin: true });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const userEmails = user.emailAddresses.map((e: { emailAddress: string }) => e.emailAddress);
    const isAdmin = userEmails.some((email: string) => adminEmails.includes(email));

    if (isAdmin) {
      res.json({ isAdmin: true });
    } else {
      res.status(403).json({ isAdmin: false, error: "Not authorized as admin" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to verify admin status");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
