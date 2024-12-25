import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { registrationTokens, users, sessions, funnel_events, ltvTransactions, utmTracking } from "../../db/schema";
import { eq, like, desc, sql, and } from "drizzle-orm";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// Create separate routers for public and protected routes
export const publicAdminRouter = Router();
const adminRouter = Router();

// Admin middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const debugId = Math.random().toString(36).substring(7);

  console.log('[Admin Auth Debug Start]', {
    debugId,
    path: req.path,
    method: req.method,
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      isAdmin: req.user.isAdmin,
      lastAccessDate: req.user.lastAccessDate
    } : null,
    sessionID: req.sessionID,
    headers: {
      ...req.headers,
      cookie: undefined // Don't log cookies for security
    },
    timestamp: new Date().toISOString()
  });

  if (!req.isAuthenticated() || !req.session) {
    console.error('[Admin Auth Error] Not authenticated', {
      debugId,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: "Not authenticated",
      debugId 
    });
  }

  if (!req.user) {
    console.error('[Admin Auth Error] No user in request', {
      debugId,
      sessionID: req.sessionID,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: "No user found",
      debugId 
    });
  }

  if (!req.user.isAdmin) {
    console.error('[Admin Auth Error] User not admin', {
      debugId,
      userId: req.user.id,
      username: req.user.username,
      sessionID: req.sessionID,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ 
      message: "Unauthorized - Admin access required",
      debugId 
    });
  }

  console.log('[Admin Auth Success]', {
    debugId,
    userId: req.user.id,
    username: req.user.username,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  res.locals.adminUser = req.user;
  next();
}

// Protected admin endpoints
adminRouter.get("/users", requireAdmin, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log('[Admin Users Request]', {
      requestId,
      adminUser: res.locals.adminUser,
      query: req.query,
      headers: {
        ...req.headers,
        cookie: undefined // Don't log cookies for security
      },
      timestamp: new Date().toISOString()
    });

    // First verify database connection and admin status
    if (!req.user?.isAdmin) {
      console.error('[Admin Users Auth Error]', {
        requestId,
        userId: req.user?.id,
        isAdmin: req.user?.isAdmin,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ 
        message: "Not authorized to access admin functions",
        requestId 
      });
    }

    // Verify database connection
    try {
      const testQuery = await db.select({ count: sql<number>`count(*)` }).from(users);
      console.log('[Admin Database Test]', {
        requestId,
        success: true,
        count: testQuery[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('[Admin Database Test Failed]', {
        requestId,
        error: dbError instanceof Error ? {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack
        } : dbError,
        timestamp: new Date().toISOString()
      });
      throw new Error('Database connection test failed');
    }

    const search = (req.query.search as string) || '';
    const query = db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        subscriptionStatus: users.subscriptionStatus,
        createdAt: users.createdAt,
        lastAccessDate: users.lastAccessDate,
        totalSessions: users.totalSessions,
        isDebug: users.isDebug,
        isIntro: sql<boolean>`COALESCE(${users.isIntro}, false)`,
        isAdmin: users.isAdmin
      })
      .from(users)
      .where(search ? like(users.username, `%${search}%`) : sql`TRUE`)
      .orderBy(desc(users.createdAt));

    const querySQL = query.toSQL();
    console.log('[Admin Users Query]', {
      requestId,
      sql: querySQL.sql,
      params: querySQL.params,
      timestamp: new Date().toISOString()
    });

    const users_list = await query;
    console.log('[Admin Users Response]', {
      requestId,
      userCount: users_list.length,
      timestamp: new Date().toISOString()
    });

    res.json(users_list);
  } catch (error) {
    console.error("[Admin Users Error]", {
      requestId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });

    // Send appropriate error response
    if (error instanceof Error && error.message === 'Database connection test failed') {
      res.status(503).json({ 
        message: "Database service unavailable",
        requestId
      });
    } else {
      res.status(500).json({ 
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : "Unknown error",
        requestId
      });
    }
  }
});

// Update user subscription status
adminRouter.put("/users/:id/status", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const statusSchema = z.object({
      status: z.enum(['paid', 'trial', 'churned', 'free']),
      isDebug: z.boolean().optional()
    });

    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid status",
        errors: result.error.issues
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus: result.data.status,
        ...(result.data.isDebug !== undefined && { isDebug: result.data.isDebug })
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// List all tokens
adminRouter.get("/tokens", requireAdmin, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log('[Admin Tokens Request]', {
      requestId,
      adminUser: res.locals.adminUser,
      headers: {
        ...req.headers,
        cookie: undefined // Don't log cookies for security
      },
      timestamp: new Date().toISOString()
    });

    // Verify database connection
    try {
      const testQuery = await db.select({ count: sql<number>`count(*)` }).from(registrationTokens);
      console.log('[Admin Database Test]', {
        requestId,
        success: true,
        count: testQuery[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('[Admin Database Test Failed]', {
        requestId,
        error: dbError instanceof Error ? {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack
        } : dbError,
        timestamp: new Date().toISOString()
      });
      throw new Error('Database connection test failed');
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/json');

    const tokens = await db
      .select()
      .from(registrationTokens)
      .orderBy(desc(registrationTokens.createdAt));

    console.log('[Admin Tokens Response]', {
      requestId,
      tokenCount: tokens.length,
      timestamp: new Date().toISOString()
    });

    return res.json(tokens);
  } catch (error) {
    console.error("[Admin Tokens Error]", {
      requestId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });

    // Ensure JSON response even for errors
    res.setHeader('Content-Type', 'application/json');

    if (error instanceof Error && error.message === 'Database connection test failed') {
      return res.status(503).json({ 
        message: "Database service unavailable",
        requestId
      });
    }

    return res.status(500).json({ 
      message: "Failed to fetch tokens",
      error: error instanceof Error ? error.message : "Unknown error",
      requestId
    });
  }
});

// Generate new token
adminRouter.post("/tokens", requireAdmin, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log('[Admin Token Generation Request]', {
      requestId,
      adminUser: res.locals.adminUser,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const subscriptionTypeSchema = z.object({
      subscriptionType: z.enum(['paid', 'trial', 'free']).default('paid'),
      parameters: z.record(z.string(), z.any()).optional().default({})
    });

    const result = subscriptionTypeSchema.safeParse(req.body);
    if (!result.success) {
      console.error('[Admin Token Generation Schema Error]', {
        requestId,
        errors: result.error.issues,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: "Invalid subscription type",
        errors: result.error.issues,
        requestId
      });
    }

    // Verify database connection
    try {
      const testQuery = await db.select({ count: sql<number>`count(*)` }).from(registrationTokens);
      console.log('[Admin Database Test]', {
        requestId,
        success: true,
        count: testQuery[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('[Admin Database Test Failed]', {
        requestId,
        error: dbError instanceof Error ? {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack
        } : dbError,
        timestamp: new Date().toISOString()
      });
      throw new Error('Database connection test failed');
    }

    const token = uuidv4();
    const [newToken] = await db
      .insert(registrationTokens)
      .values({
        token: token,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString(),
        subscriptionType: result.data.subscriptionType,
        parameters: result.data.parameters,
        isActive: true
      })
      .returning();

    console.log('[Admin Token Generation Success]', {
      requestId,
      tokenId: newToken.id,
      userId: req.user!.id,
      timestamp: new Date().toISOString()
    });

    res.json(newToken);
  } catch (error) {
    console.error("[Admin Token Generation Error]", {
      requestId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error && error.message === 'Database connection test failed') {
      return res.status(503).json({ 
        message: "Database service unavailable",
        requestId
      });
    }

    res.status(500).json({ 
      message: "Failed to generate token",
      error: error instanceof Error ? error.message : "Unknown error",
      requestId
    });
  }
});

// Get funnel analytics data
adminRouter.get("/", requireAdmin, async (req, res) => {
      const requestId = Math.random().toString(36).substring(7);
      console.log('[Funnel Analytics Request]', {
        requestId,
        query: req.query,
        user: req.user ? { id: req.user.id, isAdmin: req.user.isAdmin } : null,
        timestamp: new Date().toISOString()
      });

      try {
        const { timeframe = '30d', startDate, endDate } = req.query;
        
        let startDateTime = new Date();
        const endDateTime = new Date();

        console.log('[Funnel Analytics Timeframe]', {
          requestId,
          timeframe,
          startDate,
          endDate,
          timestamp: new Date().toISOString()
        });
    
    // Parse timeframe
    switch(timeframe) {
      case '1d':
        startDateTime.setDate(startDateTime.getDate() - 1);
        break;
      case '7d':
        startDateTime.setDate(startDateTime.getDate() - 7);
        break;
      case '30d':
        startDateTime.setDate(startDateTime.getDate() - 30);
        break;
      case 'custom':
        if (startDate && endDate) {
          startDateTime = new Date(startDate as string);
          endDateTime.setTime(new Date(endDate as string).getTime());
        }
        break;
      default:
        startDateTime.setDate(startDateTime.getDate() - 30);
    }

    // First, get the list of users who started from /intro in this timeframe
    console.log('[Funnel Analytics Query Start]', {
      requestId,
      timeRange: {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      },
      timestamp: new Date().toISOString()
    });

    // First, get all funnel events for debugging
    const allEvents = await db
      .select()
      .from(funnel_events)
      .orderBy(desc(funnel_events.createdAt))
      .limit(10);

    console.log('[Funnel Analytics Recent Events]', {
      requestId,
      eventCount: allEvents.length,
      events: allEvents.map(e => ({
        id: e.id,
        type: e.eventType,
        data: e.eventData,
        userId: e.userId,
        sessionId: e.sessionId,
        createdAt: e.createdAt
      })),
      timestamp: new Date().toISOString()
    });

    const funnelUsersQuery = db
      .select({ sessionId: funnel_events.sessionId })
      .from(funnel_events)
      .where(and(
        eq(funnel_events.eventType, 'page_view'),
        eq(funnel_events.eventData, '/intro'),
        sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`
      ));

    // Log the compiled SQL for debugging
    const compiledSql = funnelUsersQuery.toSQL();
    console.log('[Funnel Analytics Base Query]', {
      requestId,
      sql: compiledSql.sql,
      params: compiledSql.params,
      timestamp: new Date().toISOString()
    });

    console.log('[Funnel Analytics Query]', {
      requestId,
      query: funnelUsersQuery,
      timestamp: new Date().toISOString()
    });

    // Query all the necessary funnel steps
    const [
      introPageViews,
      quizStarts,
      quizStep1,
      quizStep2,
      quizStep3,
      introCompleted,
      registrations,
      firstAnalysis,
      trialPageViews,
      trialSignups,
      paidUsers
    ] = await Promise.all([
      // Count intro page views (this is our baseline)
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'page_view'),
          eq(funnel_events.eventData, '/intro'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`
        )),

      // Count quiz starts from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'quiz_start'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count quiz step completions from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'quiz_step'),
          eq(funnel_events.eventData, '1'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'quiz_step'),
          eq(funnel_events.eventData, '2'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'quiz_step'),
          eq(funnel_events.eventData, '3'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count intro completions from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'intro_complete'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count free registrations from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'registration_token_generated'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count users who completed first analysis from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'first_analysis_complete'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count trial page views from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'page_view'),
          eq(funnel_events.eventData, '/trial'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count trial signups from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'trial_signup'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        )),

      // Count paid users from funnel users
      db.select({ count: sql<number>`count(distinct ${funnel_events.sessionId})` })
        .from(funnel_events)
        .where(and(
          eq(funnel_events.eventType, 'subscription_paid'),
          sql`${funnel_events.createdAt} > ${startDateTime} AND ${funnel_events.createdAt} <= ${endDateTime}`,
          sql`${funnel_events.sessionId} IN (${funnelUsersQuery})`
        ))
    ]);

    const funnelData = {
      lastUpdated: new Date().toISOString(),
      timeframe,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      steps: [
        {
          id: 'intro_views',
          name: 'Landing Page Views',
          value: Number(introPageViews[0].count),
          description: 'Visitors on main /intro landing page',
          conversionRate: 100
        },
        {
          id: 'quiz_starts',
          name: 'Quiz Started',
          value: Number(quizStarts[0].count),
          description: 'Users who begin the quiz',
          conversionRate: introPageViews[0].count > 0 ? 
            (Number(quizStarts[0].count) / Number(introPageViews[0].count) * 100) : 0
        },
        {
          id: 'quiz_step1',
          name: 'Quiz Step 1',
          value: Number(quizStep1[0].count),
          description: 'Users who complete question 1',
          conversionRate: quizStarts[0].count > 0 ?
            (Number(quizStep1[0].count) / Number(quizStarts[0].count) * 100) : 0
        },
        {
          id: 'quiz_step2',
          name: 'Quiz Step 2',
          value: Number(quizStep2[0].count),
          description: 'Users who complete question 2',
          conversionRate: quizStep1[0].count > 0 ?
            (Number(quizStep2[0].count) / Number(quizStep1[0].count) * 100) : 0
        },
        {
          id: 'quiz_step3',
          name: 'Quiz Step 3',
          value: Number(quizStep3[0].count),
          description: 'Users who complete question 3',
          conversionRate: quizStep2[0].count > 0 ?
            (Number(quizStep3[0].count) / Number(quizStep2[0].count) * 100) : 0
        },
        {
          id: 'intro_complete',
          name: 'Intro Completed',
          value: Number(introCompleted[0].count),
          description: 'Users who click the final button',
          conversionRate: quizStep3[0].count > 0 ?
            (Number(introCompleted[0].count) / Number(quizStep3[0].count) * 100) : 0
        },
        {
          id: 'registrations',
          name: 'Free Registrations',
          value: Number(registrations[0].count),
          description: 'Users who register a free account',
          conversionRate: introCompleted[0].count > 0 ?
            (Number(registrations[0].count) / Number(introCompleted[0].count) * 100) : 0
        },
        {
          id: 'first_analysis',
          name: 'First Analysis',
          value: Number(firstAnalysis[0].count),
          description: 'Free users who complete first voice analysis',
          conversionRate: registrations[0].count > 0 ?
            (Number(firstAnalysis[0].count) / Number(registrations[0].count) * 100) : 0
        },
        {
          id: 'trial_views',
          name: 'Trial Page Views',
          value: Number(trialPageViews[0].count),
          description: 'Free users who reach the trial page',
          conversionRate: firstAnalysis[0].count > 0 ?
            (Number(trialPageViews[0].count) / Number(firstAnalysis[0].count) * 100) : 0
        },
        {
          id: 'trial_signups',
          name: 'Trial Signups',
          value: Number(trialSignups[0].count),
          description: 'Users who start a trial',
          conversionRate: trialPageViews[0].count > 0 ?
            (Number(trialSignups[0].count) / Number(trialPageViews[0].count) * 100) : 0
        },
        {
          id: 'paid_users',
          name: 'Paid Users',
          value: Number(paidUsers[0].count),
          description: 'Trial users who convert to paid',
          conversionRate: trialSignups[0].count > 0 ?
            (Number(paidUsers[0].count) / Number(trialSignups[0].count) * 100) : 0
        }
      ]
    };

    console.log('[Funnel Analytics Result]', {
      requestId,
      funnelData,
      timestamp: new Date().toISOString()
    });

    res.json(funnelData);
  } catch (error) {
    console.error("Error fetching funnel data:", error);
    res.status(500).json({ message: "Failed to fetch funnel data" });
  }
});

// Get user UTM data
adminRouter.get("/users/:id/utm-data", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    console.log('[UserManagement UTM Data Request]', {
      userId,
      timestamp: new Date().toISOString()
    });

    const [userData] = await db
      .select({
        utm_source: users.utm_source,
        utm_adid: users.utm_adid,
        utm_angle: users.utm_angle,
        utm_funnel: users.utm_funnel
      })
      .from(users)
      .where(eq(users.id, userId));

    console.log('[UserManagement UTM Data Result]', {
      userId,
      data: userData,
      timestamp: new Date().toISOString()
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userData);
  } catch (error) {
    console.error("[UserManagement UTM Data Error]", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ message: "Failed to fetch user UTM data" });
  }
});

// Get user LTV data
adminRouter.get("/users/:id/ltv", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    console.log('[UserManagement LTV Data Request]', {
      userId,
      timestamp: new Date().toISOString()
    });

    // Get all transactions for the user
    const transactions = await db
      .select()
      .from(ltvTransactions)
      .where(eq(ltvTransactions.userId, userId))
      .orderBy(desc(ltvTransactions.createdAt));

    // Calculate total LTV
    const totalLtv = transactions.reduce((total, tx) => {
      return total + (tx.type === 'addition' ? tx.amount : -tx.amount);
    }, 0);

    console.log('[UserManagement LTV Data Result]', {
      userId,
      transactionCount: transactions.length,
      totalLtv,
      timestamp: new Date().toISOString()
    });

    res.json({ transactions, totalLtv });
  } catch (error) {
    console.error("[UserManagement LTV Data Error]", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ message: "Failed to fetch user LTV data" });
  }
});

// Record LTV transaction
adminRouter.post("/users/:id/ltv", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const transactionSchema = z.object({
      type: z.enum(['addition', 'deduction']),
      amount: z.number().int().positive()
    });

    const result = transactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid transaction data",
        errors: result.error.issues
      });
    }

    // Record the transaction
    const [transaction] = await db
      .insert(ltvTransactions)
      .values({
        userId,
        amount: result.data.amount,
        type: result.data.type
      })
      .returning();

    res.json(transaction);
  } catch (error) {
    console.error("Error recording LTV transaction:", error);
    res.status(500).json({ message: "Failed to record LTV transaction" });
  }
});

export default adminRouter;