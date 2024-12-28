import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import {
  users,
  insertUserSchema,
  registrationTokens,
  loginSchema,
  type User as SelectUser,
  utmTracking,
  ltvTransactions,
} from "../db/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { AUTH_CONFIG } from "./config";
import { z } from "zod";

const scryptAsync = promisify(scrypt);
const ADMIN_PASSWORD_HASH =
  "5dca0889c2f04a8c95c22f323fda74a00a6de7c1e0467c5c1d28627e239e3dd7f16f4d9f37010a46c9ce4854c17e001213e2e67800763bc64f42f1fc5add449e.f69525a0fed2b5c9bc3223a76fda7d1c";

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
        return suppliedPassword === "change_this_password";
      }

      if (!storedPassword.includes(".")) return false;

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
      console.error("Password comparison error:", error);
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
      sameSite: "lax",
    },
    store: new MemoryStore({
      checkPeriod: AUTH_CONFIG.sessionMaxAge,
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Add session debugging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log("[Session Debug]", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      path: req.path,
      method: req.method,
      user: req.user
        ? {
            id: req.user.id,
            username: req.user.username,
            isAdmin: req.user.isAdmin,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const debugId = Math.random().toString(36).substring(7);
        console.log("[Auth Strategy Debug]", {
          debugId,
          username,
          timestamp: new Date().toISOString(),
        });

        if (!username || !password) {
          console.error("[Auth Strategy Error]", {
            debugId,
            error: "Missing credentials",
            timestamp: new Date().toISOString(),
          });
          return done(null, false, {
            message: "Username and password are required.",
          });
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !user.password) {
          console.error("[Auth Strategy Error]", {
            debugId,
            error: "User not found",
            username,
            timestamp: new Date().toISOString(),
          });
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }

        const isMatch = await crypto.compare(password, user.password);
        console.log("[Auth Password Check]", {
          debugId,
          userId: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          isMatch,
          timestamp: new Date().toISOString(),
        });

        if (!isMatch) {
          return done(null, false, { message: "Incorrect username or password." });
        }

        return done(null, user);
      } catch (err) {
        console.error("[Auth Strategy Error]", {
          error:
            err instanceof Error
              ? {
                  name: err.name,
                  message: err.message,
                  stack: err.stack,
                }
              : err,
          timestamp: new Date().toISOString(),
        });
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("[User Serialization]", {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      timestamp: new Date().toISOString(),
    });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("[User Deserialization Start]", {
        userId: id,
        timestamp: new Date().toISOString(),
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      console.log("[User Deserialization Result]", {
        userId: id,
        found: !!user,
        isAdmin: user?.isAdmin,
        timestamp: new Date().toISOString(),
      });

      done(null, user);
    } catch (err) {
      console.error("[User Deserialization Error]", {
        userId: id,
        error:
          err instanceof Error
            ? {
                name: err.name,
                message: err.message,
                stack: err.stack,
              }
            : err,
        timestamp: new Date().toISOString(),
      });
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send(
            "Invalid input: " +
              result.error.issues.map((i) => i.message).join(", ")
          );
      }

      const { username, password, token, isIntro } = result.data;

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
            isIntro: isIntro || false, // Add the isIntro value here
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
      console.error("Error during registration:", error);
      return res.status(500).json({
        message: "Registration failed",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .send(
          "Invalid input: " +
            result.error.issues.map((i) => i.message).join(", ")
        );
    }

    passport.authenticate(
      "local",
      (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) return next(err);
        if (!user) return res.status(400).send(info.message ?? "Login failed");

        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              isAdmin: user.isAdmin,
            },
          });
        });
      }
    )(req, res, next);
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

  app.get("/api/users/utm", async (req, res) => {
    try {
      const requestId = Math.random().toString(36).substring(7);

      console.log("[Admin Users Request]", {
        requestId,
        adminUser: res.locals.adminUser,
        query: req.query,
        headers: {
          ...req.headers,
          cookie: undefined, // Don't log cookies for security
        },
        timestamp: new Date().toISOString(),
      });

      if (!req.user?.isAdmin) {
        console.error("[Admin Users Auth Error]", {
          requestId,
          userId: req.user?.id,
          isAdmin: req.user?.isAdmin,
          timestamp: new Date().toISOString(),
        });
        return res.status(403).json({
          message: "Not authorized to access admin functions",
          requestId,
        });
      }
      const utmData = await db
        .select({
          id: utmTracking.id,
          userId: utmTracking.userId,
          source: utmTracking.source,
          adid: utmTracking.adid,
          angle: utmTracking.angle,
          funnel: utmTracking.funnel,
          createdAt: utmTracking.createdAt,
          rawParams: utmTracking.rawParams,
        })
        .from(utmTracking);

      res.json(utmData);
    } catch (error) {
      console.error("Error seeding or fetching data:", error);
      res.status(500).json({ message: "Failed to seed or fetch data" });
    }
  });

  app.get("/api/users/data", async (req, res) => {
    try {
      const requestId = Math.random().toString(36).substring(7);

      console.log("[Admin Users Request]", {
        requestId,
        adminUser: res.locals.adminUser,
        query: req.query,
        headers: {
          ...req.headers,
          cookie: undefined,
        },
        timestamp: new Date().toISOString(),
      });

      if (!req.user?.isAdmin) {
        console.error("[Admin Users Auth Error]", {
          requestId,
          userId: req.user?.id,
          isAdmin: req.user?.isAdmin,
          timestamp: new Date().toISOString(),
        });
        return res.status(403).json({
          message: "Not authorized to access admin functions",
          requestId,
        });
      }
      const userData = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          isAdmin: users.isAdmin,
          subscriptionStatus: users.subscriptionStatus,
          createdAt: users.createdAt,
          lastAccessDate: users.lastAccessDate,
          isIntro: users.isIntro,
          isDebug: users.isDebug,
          totalSessions: users.totalSessions,
          lastActionGuide: users.lastActionGuide,
        })
        .from(users);

      res.json(userData);
    } catch (error) {
      console.error("Error seeding or fetching data:", error);
      res.status(500).json({ message: "Failed to seed or fetch data" });
    }
  });

  // app.get("/api/users/analytics", async (req, res) => {
  //   try {
  //     const requestId = Math.random().toString(36).substring(7);

  //     console.log("[User Analytics Request]", {
  //       requestId,
  //       adminUser: res.locals.adminUser,
  //       query: req.query,
  //       headers: {
  //         ...req.headers,
  //         cookie: undefined,
  //       },
  //       timestamp: new Date().toISOString(),
  //     });

  //     // Check if the user is an admin
  //     if (!req.user?.isAdmin) {
  //       console.error("[User Analytics Auth Error]", {
  //         requestId,
  //         userId: req.user?.id,
  //         isAdmin: req.user?.isAdmin,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return res.status(403).json({
  //         message: "Not authorized to access admin functions",
  //         requestId,
  //       });
  //     }

  //     // Fetch user data
  //     const userData = await db
  //       .select({
  //         subscriptionStatus: users.subscriptionStatus,
  //       })
  //       .from(users);

  //     // Perform analytics calculations
  //     const totalUsers = userData.length;
  //     const subscriptionBreakdown = userData.reduce((acc, user) => {
  //       acc[user.subscriptionStatus] = (acc[user.subscriptionStatus] || 0) + 1;
  //       return acc;
  //     }, {});

  //     // Construct analytics response
  //     const analytics = {
  //       totalUsers,
  //       subscriptionBreakdown,
  //     };

  //     res.json({
  //       analytics,
  //       requestId,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching analytics data:", error);
  //     res.status(500).json({ message: "Failed to fetch analytics data" });
  //   }
  // });
  const QuerySchema = z.object({
    column: z.string().min(1),
    query: z.string().min(1),
  });

  app.get("/api/users/analytics", async (req, res) => {
    try {
      // Fetch user IDs from utm_tracking

      const result = QuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: result.error.errors,
        });
      }

      const { column, query } = result.data;

      const filteredUserIds = await db
        .select({
          userId: utmTracking.userId,
        })
        .from(utmTracking)
        .where(sql`${sql.identifier(column)} LIKE ${query}`);

      // Ensure userIds is an array of integers
      const userIds = filteredUserIds.map((user) => user.userId);
      console.log(userIds);

      if (userIds.length === 0) {
        return res.json({
          totalUsers: 0,
          freeUsers: 0,
          trialUsers: 0,
          paidUsers: 0,
          churnedUsers: 0,
          freeUsersLTV: 0,
          trialUsersLTV: 0,
          paidUsersLTV: 0,
          churnedUsersLTV: 0,
        });
      }

      // Fetch subscription stats for the filtered users
      const subscriptionStats = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          count: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Correctly format userIds for the IN clause
        .groupBy(users.subscriptionStatus);

      console.log(subscriptionStats);

      const stats = {
        freeUsers: 0,
        trialUsers: 0,
        paidUsers: 0,
        churnedUsers: 0,
      };

      subscriptionStats.forEach((stat) => {
        const key = `${stat.subscriptionStatus}Users`;
        if (key in stats) {
          stats[key as keyof typeof stats] = Number(stat.count); // Ensure count is parsed as a number
        }
      });

      // Fetch LTV amounts for the filtered users
      const ltvStats = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          totalLTV: sql<number>`COALESCE(SUM(ltv_transactions.amount), 0)`,
        })
        .from(users)
        .leftJoin(ltvTransactions, eq(users.id, ltvTransactions.userId))
        .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Correctly format userIds for the IN clause
        .groupBy(users.subscriptionStatus);

      const ltv = {
        freeUsersLTV: 0,
        trialUsersLTV: 0,
        paidUsersLTV: 0,
        churnedUsersLTV: 0,
      };

      ltvStats.forEach((stat) => {
        const key = `${stat.subscriptionStatus}UsersLTV`;
        if (key in ltv) {
          ltv[key as keyof typeof ltv] = Number(stat.totalLTV); // Ensure totalLTV is parsed as a number
        }
      });

      // Calculate total users
      const totalUsers = Object.values(stats).reduce((a, b) => a + b, 0);

      // Respond with the analytics data
      res.json({
        totalUsers,
        ...stats,
        ...ltv,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics." });
    }
  });


  app.get("/api/users/analytics/all", async (req, res) => {
    try {
      // Fetch all user IDs (i.e., no filtering)
      const allUserIds = await db
        .select({
          userId: users.id,
        })
        .from(users);
  
      const userIds = allUserIds.map((user) => user.userId);
      console.log("All User IDs:", userIds);
  
      if (userIds.length === 0) {
        return res.json({
          totalUsers: 0,
          freeUsers: 0,
          trialUsers: 0,
          paidUsers: 0,
          churnedUsers: 0,
          freeUsersLTV: 0,
          trialUsersLTV: 0,
          paidUsersLTV: 0,
          churnedUsersLTV: 0,
          totalLTV: 0, // Total LTV for all users
        });
      }
  
      // Fetch subscription stats for all users
      const subscriptionStats = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          count: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Use all userIds
        .groupBy(users.subscriptionStatus);
  
      console.log("Subscription Stats:", subscriptionStats);
  
      const stats = {
        freeUsers: 0,
        trialUsers: 0,
        paidUsers: 0,
        churnedUsers: 0,
      };
  
      subscriptionStats.forEach((stat) => {
        const key = `${stat.subscriptionStatus}Users`;
        if (key in stats) {
          stats[key as keyof typeof stats] = Number(stat.count); // Ensure count is parsed as a number
        }
      });
  
      // Fetch LTV amounts for all users
      const ltvStats = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          totalLTV: sql<number>`COALESCE(SUM(ltv_transactions.amount), 0)`,
        })
        .from(users)
        .leftJoin(ltvTransactions, eq(users.id, ltvTransactions.userId))
        .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Use all userIds
        .groupBy(users.subscriptionStatus);
  
      const ltv = {
        freeUsersLTV: 0,
        trialUsersLTV: 0,
        paidUsersLTV: 0,
        churnedUsersLTV: 0,
      };
  
      ltvStats.forEach((stat) => {
        const key = `${stat.subscriptionStatus}UsersLTV`;
        if (key in ltv) {
          ltv[key as keyof typeof ltv] = Number(stat.totalLTV); // Ensure totalLTV is parsed as a number
        }
      });
  
      // Calculate total users
      const totalUsers = Object.values(stats).reduce((a, b) => a + b, 0);
  
      // Calculate total LTV
      const totalLTV = Object.values(ltv).reduce((a, b) => a + b, 0);
  
      // Respond with the analytics data
      res.json({
        totalUsers,
        ...stats,
        ...ltv,
        totalLTV, // Add total LTV to the response
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics." });
    }
  });
  
  // app.get("/api/users/analytics/all", async (req, res) => {
  //   try {
  //     // Fetch all user IDs (i.e., no filtering)
  //     const allUserIds = await db
  //       .select({
  //         userId: users.id,
  //       })
  //       .from(users);

  //     const userIds = allUserIds.map((user) => user.userId);
  //     console.log("All User IDs:", userIds);

  //     if (userIds.length === 0) {
  //       return res.json({
  //         totalUsers: 0,
  //         freeUsers: 0,
  //         trialUsers: 0,
  //         paidUsers: 0,
  //         churnedUsers: 0,
  //         freeUsersLTV: 0,
  //         trialUsersLTV: 0,
  //         paidUsersLTV: 0,
  //         churnedUsersLTV: 0,
  //       });
  //     }

  //     // Fetch subscription stats for all users
  //     const subscriptionStats = await db
  //       .select({
  //         subscriptionStatus: users.subscriptionStatus,
  //         count: sql<number>`COUNT(*)`,
  //       })
  //       .from(users)
  //       .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Use all userIds
  //       .groupBy(users.subscriptionStatus);

  //     console.log("Subscription Stats:", subscriptionStats);

  //     const stats = {
  //       freeUsers: 0,
  //       trialUsers: 0,
  //       paidUsers: 0,
  //       churnedUsers: 0,
  //     };

  //     subscriptionStats.forEach((stat) => {
  //       const key = `${stat.subscriptionStatus}Users`;
  //       if (key in stats) {
  //         stats[key as keyof typeof stats] = Number(stat.count); // Ensure count is parsed as a number
  //       }
  //     });

  //     // Fetch LTV amounts for all users
  //     const ltvStats = await db
  //       .select({
  //         subscriptionStatus: users.subscriptionStatus,
  //         totalLTV: sql<number>`COALESCE(SUM(ltv_transactions.amount), 0)`,
  //       })
  //       .from(users)
  //       .leftJoin(ltvTransactions, eq(users.id, ltvTransactions.userId))
  //       .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`) // Use all userIds
  //       .groupBy(users.subscriptionStatus);

  //     const ltv = {
  //       freeUsersLTV: 0,
  //       trialUsersLTV: 0,
  //       paidUsersLTV: 0,
  //       churnedUsersLTV: 0,
  //     };

  //     ltvStats.forEach((stat) => {
  //       const key = `${stat.subscriptionStatus}UsersLTV`;
  //       if (key in ltv) {
  //         ltv[key as keyof typeof ltv] = Number(stat.totalLTV); // Ensure totalLTV is parsed as a number
  //       }
  //     });

  //     // Calculate total users
  //     const totalUsers = Object.values(stats).reduce((a, b) => a + b, 0);

  //     // Respond with the analytics data
  //     res.json({
  //       totalUsers,
  //       ...stats,
  //       ...ltv,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching analytics:", error);
  //     res.status(500).json({ message: "Failed to fetch analytics." });
  //   }
  // });

  app.get("/api/users/ltvanalytics", async (req, res) => {
    try {
      const requestId = Math.random().toString(36).substring(7);

      // Log request details (optional)
      // console.log("[User Analytics Request]", {
      //   requestId,
      //   adminUser: req.user?.isAdmin,
      //   query: req.query,
      //   headers: {
      //     ...req.headers,
      //     cookie: undefined,
      //   },
      //   timestamp: new Date().toISOString(),
      // });

      // // Check if the user is an admin (optional)
      if (!req.user?.isAdmin) {
        console.error("[User Analytics Auth Error]", {
          requestId,
          userId: req.user?.id,
          isAdmin: req.user?.isAdmin,
          timestamp: new Date().toISOString(),
        });
        return res.status(403).json({
          message: "Not authorized to access admin functions",
          requestId,
        });
      }

      // Fetch user data: amount and user id
      const transactions = await db
        .select({
          id: ltvTransactions.userId,
          amount: ltvTransactions.amount,
        })
        .from(ltvTransactions);

      // Calculate unique users and their total amounts
      const userAmounts = transactions.reduce((acc, transaction) => {
        if (!acc[transaction.id]) {
          acc[transaction.id] = {
            totalAmount: 0,
            transactionCount: 0,
          };
        }
        acc[transaction.id].totalAmount += transaction.amount;
        acc[transaction.id].transactionCount += 1;
        return acc;
      }, {});

      // Calculate metrics
      const uniqueUserCount = Object.keys(userAmounts).length;
      const totalAmount = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      // Calculate averages
      const averageAmountPerTransaction =
        transactions.length > 0 ? totalAmount / transactions.length : 0;
      const averageAmountPerUser =
        uniqueUserCount > 0 ? totalAmount / uniqueUserCount : 0;

      // Get per-user statistics
      const userStatistics = Object.entries(userAmounts).map(
        ([userId, stats]) => ({
          userId,
          totalAmount: stats.totalAmount,
          transactionCount: stats.transactionCount,
          averageTransactionAmount: stats.totalAmount / stats.transactionCount,
        })
      );

      // Prepare the response data
      const responseData = {
        summary: {
          totalAmount,
          uniqueUsers: uniqueUserCount,
          totalTransactions: transactions.length,
          averageAmountPerTransaction,
          averageAmountPerUser,
        },
        userStatistics,
        requestId,
      };

      res.json(responseData);
    } catch (error) {
      console.error("[LTV Analytics Error]", {
        requestId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      res.status(500).json({
        message: "Failed to fetch analytics data",
        requestId,
      });
    }
  });


  app.get('/api/admin/users/:userId/ltv', async (req, res) => {
    try {

      const requestId = Math.random().toString(36).substring(7);

      // Log request details (optional)
      // console.log("[User Analytics Request]", {
      //   requestId,
      //   adminUser: req.user?.isAdmin,
      //   query: req.query,
      //   headers: {
      //     ...req.headers,
      //     cookie: undefined,
      //   },
      //   timestamp: new Date().toISOString(),
      // });

      // // Check if the user is an admin (optional)
      // if (!req.user?.isAdmin) {
      //   console.error("[User Analytics Auth Error]", {
      //     requestId,
      //     userId: req.user?.id,
      //     isAdmin: req.user?.isAdmin,
      //     timestamp: new Date().toISOString(),
      //   });
      //   return res.status(403).json({
      //     message: "Not authorized to access admin functions",
      //     requestId,
      //   });
      // }

      // Extract userId from the URL parameters
      const userId = parseInt(req.params.userId, 10);
  
      // Validate the userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid or missing userId parameter' });
      }
  
      // Fetch total amount spent by the user
      const totalSpent = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ltvTransactions.amount}), 0)`,
        })
        .from(ltvTransactions)
        .where(eq(ltvTransactions.userId, userId))
        .then(rows => (rows.length > 0 ? rows[0].total : 0));
  
      // Respond with the total amount spent
      res.json({
        userId,
        totalSpent,
      });
    } catch (error) {
      console.error('Error fetching total spent:', error);
      res.status(500).json({ message: 'Failed to calculate total spent.' });
    }
  });
  
}
