import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);

  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim())
    .filter(Boolean);

  // No whitelist configured — any authenticated user is admin (initial setup mode)
  if (adminEmails.length === 0) {
    next();
    return;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const userEmails = user.emailAddresses.map((e: { emailAddress: string }) => e.emailAddress);
    const isAdmin = userEmails.some((email: string) => adminEmails.includes(email));

    if (!isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
