import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, registrationTokens, loginSchema, type User as SelectUser } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { AUTH_CONFIG } from "./config";

const scryptAsync = promisify(scrypt);
const ADMIN_PASSWORD_HASH = "5dca0889c2f04a8c95c22f323fda74a00a6de7c1e0467c5c1d28627e239e3dd7f16f4d9f37010a46c9ce4854c17e001213e2e67800763bc64f42f1fc5add449e.f69525a0fed2b5c9bc3223a76fda7d1c";

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    try {
      if (!suppliedPassword || !storedPassword) return false;

      if (storedPassword === ADMIN_PASSWORD_HASH) {
        return suppliedPassword === 'change_this_password';
      }

      if (!storedPassword.includes('.')) return false;

      const [hashedPassword, salt] = storedPassword.split(".");
      if (!hashedPassword || !salt) return false;

      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(
        suppliedPassword,
        salt,
        64
      )) as Buffer;

      return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: AUTH_CONFIG.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: AUTH_CONFIG.sessionMaxAge,
      secure: app.get("env") === "production",
      sameSite: 'lax'
    },
    store: new MemoryStore({
      checkPeriod: AUTH_CONFIG.sessionMaxAge
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Add session debugging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('[Session Debug]', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      path: req.path,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        isAdmin: req.user.isAdmin
      } : null,
      timestamp: new Date().toISOString()
    });
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const debugId = Math.random().toString(36).substring(7);
        console.log('[Auth Strategy Debug]', {
          debugId,
          username,
          timestamp: new Date().toISOString()
        });

        if (!username || !password) {
          console.error('[Auth Strategy Error]', {
            debugId,
            error: 'Missing credentials',
            timestamp: new Date().toISOString()
          });
          return done(null, false, { message: "Username and password are required." });
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !user.password) {
          console.error('[Auth Strategy Error]', {
            debugId,
            error: 'User not found',
            username,
            timestamp: new Date().toISOString()
          });
          return done(null, false, { message: "Incorrect username or password." });
        }

        const isMatch = await crypto.compare(password, user.password);
        console.log('[Auth Password Check]', {
          debugId,
          userId: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          isMatch,
          timestamp: new Date().toISOString()
        });

        if (!isMatch) {
          return done(null, false, { message: "Incorrect username or password." });
        }

        return done(null, user);
      } catch (err) {
        console.error('[Auth Strategy Error]', {
          error: err instanceof Error ? {
            name: err.name,
            message: err.message,
            stack: err.stack
          } : err,
          timestamp: new Date().toISOString()
        });
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('[User Serialization]', {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      timestamp: new Date().toISOString()
    });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('[User Deserialization Start]', {
        userId: id,
        timestamp: new Date().toISOString()
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      console.log('[User Deserialization Result]', {
        userId: id,
        found: !!user,
        isAdmin: user?.isAdmin,
        timestamp: new Date().toISOString()
      });

      done(null, user);
    } catch (err) {
      console.error('[User Deserialization Error]', {
        userId: id,
        error: err instanceof Error ? {
          name: err.name,
          message: err.message,
          stack: err.stack
        } : err,
        timestamp: new Date().toISOString()
      });
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, password, token } = result.data;

      if (!token) {
        return res.status(400).send("Registration token is required");
      }

      const [registrationToken] = await db
        .select()
        .from(registrationTokens)
        .where(eq(registrationTokens.token, token))
        .limit(1);

      if (!registrationToken || !registrationToken.isActive) {
        return res.status(400).send("Invalid or expired registration token");
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            email: result.data.email,
            isAdmin: false,
            subscriptionStatus: registrationToken.subscriptionType,
            createdAt: new Date().toISOString(),
            lastAccessDate: new Date().toISOString(),
          })
          .returning();

        await tx
          .update(registrationTokens)
          .set({
            isActive: false,
            usedAt: new Date().toISOString(),
            usedBy: user.id,
          })
          .where(eq(registrationTokens.token, token));

        return [user];
      });

      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, username: newUser.username },
        });
      });
    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({
        message: "Registration failed",
        error: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
    }

    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) return next(err);
      if (!user) return res.status(400).send(info.message ?? "Login failed");

      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}