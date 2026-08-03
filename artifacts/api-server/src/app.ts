import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Restrict CORS to the known frontend origins.
// CORS_ORIGIN env var can be a comma-separated list for production.
// Falls back to the Replit dev domain when available, or localhost.
function buildAllowedOrigins(): string[] | RegExp {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(",").map((o) => o.trim());
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return [
      `https://${process.env.REPLIT_DEV_DOMAIN}`,
      // Also allow the exact proxy origin in local dev
      "http://localhost:80",
      "http://127.0.0.1:80",
    ];
  }
  return ["http://localhost:80", "http://127.0.0.1:80"];
}

app.use(
  cors({
    origin: buildAllowedOrigins(),
    credentials: true,
  }),
);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
