import express, { Request, Response } from "express";
import { db } from "../db"; // Assuming you are using Drizzle ORM or similar
import { registrationTokens, funnel_events, users } from "@db/schema"; // Updated to match the correct table name
import { generateToken } from "./utils/tokenUtils"; // You can create a utility function to generate tokens
import { eq, and, gte, lte } from "drizzle-orm"; // For query filters

export function registerAdminRoutes(app: express.Express) {
  // Token generation route
  app.post("/api/admin/tokens", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { subscriptionType } = req.body;

    if (!["paid", "trial", "free"].includes(subscriptionType)) {
      return res.status(400).json({ message: "Invalid subscription type" });
    }

    try {
      // Generate a token using your logic or utility
      const newToken = generateToken(subscriptionType);

      // Save token to the database
      const [token] = await db
        .insert(registrationTokens)
        .values({
          token: newToken,
          subscriptionType,
          createdBy: req.user?.id, // Assuming the admin is creating the token
          createdAt: new Date().toISOString(), // Convert Date to ISO string
          isActive: true,
        })
        .returning();

      // Respond with the token and its registration link
      const registrationLink = `${req.protocol}://${req.get(
        "host"
      )}/register?token=${token.token}`;
      return res.status(201).json({
        token: token.token,
        registrationLink,
        subscriptionType,
      });
    } catch (error) {
      console.error("Token generation error:", error);
      return res.status(500).json({ message: "Failed to generate token" });
    }
  });

  app.post(
    "/api/admin/free-registration-token",
    async (req: Request, res: Response) => {
      try {
        // Generate a free registration token
        const newToken = generateToken("free");

        // Save the token to the database
        const [token] = await db
          .insert(registrationTokens)
          .values({
            token: newToken,
            subscriptionType: "free",
            createdBy: 0, // Assuming the admin is creating the token
            createdAt: new Date().toISOString(),
            isActive: true,
          })
          .returning();

        // Return the token and registration link
        const registrationLink = `${req.protocol}://${req.get(
          "host"
        )}/register?token=${token.token}`;
        return res.status(201).json({
          token: token.token,
          registrationLink,
          subscriptionType: "free",
        });
      } catch (error) {
        console.error("Error creating free registration token:", error);
        return res
          .status(500)
          .json({ message: "Failed to create free registration token" });
      }
    }
  );

  //Funnel Track Events
  app.post("/api/admin/funnel/track", async (req: Request, res: Response) => {
    const { eventType, eventData, sessionId, userId } = req.body;

    // Validate required fields
    if (!eventType || !sessionId) {
      return res.status(400).json({
        message: "Missing required fields: eventType or sessionId",
      });
    }

    try {
      // Insert the funnel event into the database
      const [funnelEvent] = await db
        .insert(funnel_events)
        .values({
          eventType,
          eventData: eventData || null, // Optional field
          sessionId,
          userId: userId || null, // Optional field
        })
        .returning();

      return res.status(201).json({
        message: "Funnel event tracked successfully",
        event: funnelEvent,
      });
    } catch (error) {
      console.error("Error tracking funnel event:", error);
      return res.status(500).json({ message: "Failed to track funnel event" });
    }
  });

  app.get("/api/admin/funnel", async (req: Request, res: Response) => {
    const { timeframe } = req.query;

    // Parse timeframe (e.g., "30d" -> 30 days)
    const days = timeframe ? parseInt(timeframe.replace("d", ""), 10) : null;
    const startDate = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      : null;

    try {
      // Fetch events within the specified timeframe, including eventData field
      const query = startDate
        ? db
            .select()
            .from(funnel_events)
            .where(gte(funnel_events.createdAt, startDate))
        : db.select().from(funnel_events);

      const events = await query;

      // Aggregated analytics by event type
      const analytics = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Tabular data for specific event types including eventData
      const userSpecificEvents = events.map((event) => ({
        userId: event.userId,
        eventType: event.eventType,
        timestamp: event.createdAt,
        eventData: event.eventData,
        // derive the status  it is in other table but in users table in
      }));

      // Send the response including eventData
      res.json({
        success: true,
        analytics,
        userEvents: userSpecificEvents,
      });
    } catch (error) {
      console.error("Error fetching funnel analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/funnel2", async (req: Request, res: Response) => {
    const { timeframe } = req.query;

    // Parse timeframe (e.g., "30d" -> 30 days)
    const days = timeframe ? parseInt(timeframe.replace("d", ""), 10) : null;
    const startDate = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      : null;

    try {
      const query = startDate
        ? db
            .select()
            .from(users)
            .where(
              and(gte(users.createdAt, startDate), eq(users.isIntro, true))
            )
        : db
            .select({
              userId: users.id,
              subscriptionStatus: users.subscriptionStatus,
              isIntro: users.isIntro,
              createdAt: users.createdAt, // Optional based on your schema
            })
            .from(users);

      const usersData = await query;

      // Process users to add `subscription_status` logic
      const processedUsers = usersData.map((user) => {
        let subscriptionStatus = user.subscriptionStatus;

        // Determine subscription status based on `isIntro`
        if (user.isIntro) {
          subscriptionStatus =
            subscriptionStatus === "paid"
              ? "paid"
              : subscriptionStatus === "trial"
              ? "trial"
              : "free";
        }

        return {
          isIntro: user.isIntro,
          subscriptionStatus,
          createdAt: user.createdAt, // Include other relevant fields as needed
        };
      });

      // Aggregate analytics if needed

      type SubscriptionStatus = "free" | "trial" | "paid" | "churned";

      const analytics: Record<SubscriptionStatus | "total", number> =
        processedUsers.reduce(
          (acc, user) => {
            if (
              ["free", "trial", "paid", "churned"].includes(
                user.subscriptionStatus
              )
            ) {
              acc[user.subscriptionStatus] =
                (acc[user.subscriptionStatus] || 0) + 1;
            }
            acc.total += 1;
            return acc;
          },
          { free: 0, trial: 0, paid: 0, churned: 0, total: 0 }
        );

      res.json({
        success: true,
        analytics,
        userEvents: processedUsers,
      });
    } catch (error) {
      console.error("Error fetching funnel analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}
