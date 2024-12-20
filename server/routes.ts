import { TimeManager } from "./utils/time-manager";
import express, { Express } from "express";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  sessions,
  communityStats,
  userImprovements,
  successStories
} from "@db/schema";
import { generateDailyInsight } from './utils/wealthInsights';
import path from "path";
import fs from "fs";
import passport from "passport";


export function registerRoutes(app: Express) {
  // User routes
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Initialize passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());


  // API Routes
  // Check neural session availability
  app.get("/api/neural-session/check", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = TimeManager.getCurrentEST();
      const today = TimeManager.getESTMidnight(now);
      const tomorrow = TimeManager.getNextMidnight(now);
      const currentDayNumber = TimeManager.getDayNumber(user.firstAccessDate, now);

      // Get all user's sessions
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, user.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // Find session for current user's day
      const todaySession = userSessions.find(session =>
        TimeManager.getDayNumber(user.firstAccessDate, session.createdAt) === currentDayNumber &&
        session.completed
      );


      // Check neural session status
      const neuralSessionGenerated = todaySession?.hasGeneratedGammaSession || false;
      const neuralSessionCompleted = todaySession?.gammaSessionCompleted || false;

      res.json({
        canGenerate: todaySession && !neuralSessionGenerated,
        reason: !todaySession
          ? "Complete today's voice analysis session first"
          : neuralSessionGenerated
            ? neuralSessionCompleted
              ? "Neural session completed for today"
              : "Session generated - listen to complete it"
            : null,
        currentDay: currentDayNumber,
        nextSession: tomorrow.toISOString()
      });
    } catch (error) {
      console.error('Error checking neural session availability:', error);
      res.status(500).send("Failed to check neural session availability");
    }
  });

  // Generate neural session
  app.post("/api/neural-session/generate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Use debug-adjusted time for all checks
      const now = TimeManager.getCurrentEST();
      const currentDayNumber = TimeManager.getDayNumber(now);


      // Validate request data
      if (!req.body.audioData) {
        return res.status(400).json({
          message: "Audio data is required"
        });
      }

      if (!req.body.frequencyType) {
        return res.status(400).json({
          message: "Frequency type is required"
        });
      }

      // Get all user's sessions
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // Find session for current debug day
      const todaySession = userSessions.find(session =>
        TimeManager.getDayNumber(session.createdAt) === currentDayNumber &&
        session.completed
      );

      if (!todaySession) {
        return res.status(400).json({
          message: "Complete today's voice analysis session first"
        });
      }

      // Check if neural session was already generated for this debug day
      const neuralSessionGenerated = userSessions.find(session =>
        TimeManager.getDayNumber(session.createdAt) === currentDayNumber &&
        session.hasGeneratedGammaSession
      );

      if (neuralSessionGenerated) {
        return res.status(400).json({
          message: "You've already generated a neural session today. Complete the existing session before generating a new one."
        });
      }

      const existingImprovements = await db.query.userImprovements.findMany({
        orderBy: (improvements, { desc }) => [desc(improvements.createdAt)],
        limit: 20 // Keep last 20 improvements
      });

      // Keep existing improvements
      const currentTime = new Date();

      // Generate only 2-4 new improvements
      const newImprovementsCount = Math.floor(Math.random() * 3) + 2; // Random number between 2-4

      // Generate new improvements with distributed timestamps
      const newImprovements = Array.from({ length: newImprovementsCount }, (_, index) => {
        // Calculate timestamp segments for even distribution across 30-400 seconds
        // Newer improvements should have more recent timestamps
        const totalRange = 370; // 400 - 30
        const segmentSize = totalRange / newImprovementsCount;
        const baseDelay = 30; // Minimum delay in seconds

        // Calculate delay for this improvement (newer improvements have smaller delays)
        const reversedIndex = newImprovementsCount - 1 - index; // Reverse index for newest first
        const segmentStart = baseDelay + (reversedIndex * segmentSize);
        const segmentEnd = segmentStart + segmentSize;
        const randomDelay = Math.floor(Math.random() * (segmentEnd - segmentStart) + segmentStart);

        // Create timestamp with calculated delay
        const timestamp = new Date(currentTime.getTime() - (randomDelay * 1000));

        // Generate random username
        const firstNames = ['john', 'emma', 'kai', 'sofia', 'aiden', 'nina', 'omar', 'priya'];
        const lastNames = ['smith', 'wilson', 'martinez', 'ali', 'kim', 'ivanov', 'mueller', 'lee'];
        const nameType = Math.random() > 0.5 ? 'first_last' : 'username';

        let anonymousId;
        if (nameType === 'first_last') {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          anonymousId = Math.random() > 0.5 ?
            `${firstName}_${lastName}` :
            `${firstName}.${lastName}`;
        } else {
          const baseName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const suffix = Math.floor(Math.random() * 999);
          anonymousId = Math.random() > 0.5 ?
            `${baseName}${suffix}` :
            `${baseName.charAt(0)}-${lastNames[Math.floor(Math.random() * lastNames.length)]}-${suffix}`;
        }

        const improvement = {
          anonymousId,
          improvement: Math.floor(Math.random() * 6) + 2, // Random improvement 2-7
          category: "Wealth Alignment" as const, // Type assertion to match schema
          createdAt: timestamp
        };

        return improvement;
      });

      // Sort new improvements by timestamp (newest first)
      newImprovements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Combine existing and new improvements, keeping the most recent ones
      const allImprovements = [...existingImprovements, ...newImprovements]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20); // Keep only the 20 most recent improvements

      // Insert only the new improvements
      const insertedImprovements = await db
        .insert(userImprovements)
        .values(newImprovements)
        .returning();


      // Update current session with audio data - only set generation state, not completion
      const [updatedSession] = await db.update(sessions)
        .set({
          gammaSessionCompleted: false, // Initialize as not completed
          gammaSessionGeneratedAt: new Date(),
          audioData: req.body.audioData, // Store the audio data in the session
          hasGeneratedGammaSession: true // New flag to track generation state
        })
        .where(eq(sessions.id, todaySession.id))
        .returning();

      // Return session data with generation metadata
      res.json(updatedSession);
    } catch (error) {
      console.error('[Neural Session API] Error in neural session generation:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id
      });
      res.status(500).json({
        message: "Failed to generate neural session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Check previous day's session completion
  app.get("/api/sessions/check-previous-completion", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find previous day's session
      const previousSession = await db.query.sessions.findFirst({
        where: (sessions, { and, eq, gte, lt }) => and(
          eq(sessions.userId, req.user!.id),
          gte(sessions.createdAt, yesterday),
          lt(sessions.createdAt, today),
        ),
      });

      // Check if previous session exists and was completed with gamma session
      const wasCompleted = previousSession ?
        (previousSession.completed && previousSession.gammaSessionCompleted) : false;

      res.json({ wasCompleted });
    } catch (error) {
      console.error('Error checking previous session completion:', error);
      res.status(500).json({
        message: "Failed to check previous session completion",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark gamma session as completed
  app.post("/api/sessions/complete-gamma", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find today's session
      const todaySession = await db.query.sessions.findFirst({
        where: (sessions, { and, eq, gte, lt }) => and(
          eq(sessions.userId, req.user!.id),
          gte(sessions.createdAt, today),
          lt(sessions.createdAt, tomorrow),
          eq(sessions.completed, true)
        ),
      });

      if (!todaySession) {
        return res.status(400).json({
          message: "Complete today's voice analysis session first"
        });
      }

      // Verify the session has been generated first
      if (!todaySession.hasGeneratedGammaSession) {
        return res.status(400).json({
          message: "Cannot complete a session that hasn't been generated yet"
        });
      }

      // Update the session to mark gamma completion
      const [updatedSession] = await db.update(sessions)
        .set({
          gammaSessionCompleted: true,
          gammaSessionCompletedAt: new Date() // Track when it was completed
        })
        .where(eq(sessions.id, todaySession.id))
        .returning();

      res.json(updatedSession);
    } catch (error) {
      console.error('Error completing gamma session:', error);
      res.status(500).json({
        message: "Failed to complete gamma session",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get user sessions
  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Get current debug day number
      const now = TimeManager.getCurrentEST();
      const currentDayNumber = TimeManager.getDayNumber(now);

      // Get all user sessions ordered by creation date
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      });

      // Get user data first
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      // For debug mode users, don't restrict based on current day
      const todaySession = userData.isDebug ? null : userSessions.find(session => {
        const sessionDay = TimeManager.getDayNumber(userData.firstAccessDate, session.createdAt);
        return sessionDay === currentDayNumber;
      });

      // Map sessions with their day numbers
      const sessionsWithDays = userSessions.map(session => ({
        ...session,
        dayNumber: TimeManager.getDayNumber(session.createdAt)
      }));

      res.json({
        sessions: sessionsWithDays,
        todaySessionExists: !!todaySession,
        currentDayNumber,
        nextRecordingTime: todaySession ? TimeManager.getESTMidnight(new Date(now)).toISOString() : null,
        todaySession
      });
    } catch (error) {
      console.error('[Sessions API] Error fetching sessions:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : 'Unknown error type',
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        requestPath: req.path,
        query: req.query
      });

      res.status(500).json({
        message: "Failed to fetch sessions",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Check if today's affirmation is completed
  // Audio file routes
  app.get("/api/audio/track", (req, res) => {
    try {
      const audioDir = path.join(process.cwd(), 'abundance-audio');
      const index = parseInt(req.query.index as string) || 0;

      // Read audio directory
      const files = fs.readdirSync(audioDir)
        .filter(file => file.toLowerCase().endsWith('.mp3'))
        .sort((a, b) => {
          // Extract numbers from filenames and compare
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      if (files.length === 0) {
        return res.status(404).send('No audio files found');
      }

      // Use modulo to wrap around if index is out of bounds
      const safeIndex = index % files.length;
      const filePath = path.join(audioDir, files[safeIndex]);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Audio file not found');
      }

      // Set correct headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');

      // Stream the file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error('Error serving audio file:', error);
      res.status(500).send('Error serving audio file');
    }
  });

  app.get("/api/sessions/today-affirmation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const now = TimeManager.getCurrentEST();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current day's session
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, now);
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // Find if there's a completed session for today
      const todaySession = userSessions.find(session =>
        TimeManager.getDayNumber(user.firstAccessDate, session.createdAt) === currentDay
      );

      const completed = todaySession?.affirmationCompleted || false;

      res.json({ completed });
    } catch (error) {
      console.error('Error checking today\'s affirmation:', error);
      res.status(500).json({
        error: "Failed to check today's affirmation status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark today's affirmation as completed
  app.post("/api/sessions/complete-affirmation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const now = TimeManager.getCurrentEST();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current day's session
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, now);
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // Find today's session
      const todaySession = userSessions.find(session =>
        TimeManager.getDayNumber(user.firstAccessDate, session.createdAt) === currentDay
      );

      if (!todaySession) {
        return res.status(400).json({
          message: "Complete today's voice analysis session first"
        });
      }

      // Update the session to mark affirmation as completed
      try {
        await db
          .update(sessions)
          .set({ affirmationCompleted: true })
          .where(eq(sessions.id, todaySession.id))
          .execute();

        res.json({ success: true });
      } catch (error) {
        console.error('Database error while updating affirmation status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error completing affirmation:', error);
      res.status(500).json({
        error: "Failed to complete affirmation",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // Generate and store daily affirmations when starting a session
  app.post("/api/sessions/start-affirmations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const now = TimeManager.getCurrentEST();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current day's session
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, now);
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // Find today's session
      const todaySession = userSessions.find(session => {
        const sessionDay = TimeManager.getDayNumber(user.firstAccessDate, session.createdAt);
        return sessionDay === currentDay;
      });

      if (!todaySession) {
        return res.status(400).json({
          message: "Complete today's voice analysis session first"
        });
      }

      // If affirmations already exist, return them
      if (todaySession.dailyAffirmations) {
        return res.json({ affirmations: todaySession.dailyAffirmations });
      }


      // Generate new affirmations
      const AFFIRMATIONS = {
        identity: [
          "I am naturally aligned with wealth and abundance",
          "My mind is programmed for exceptional financial success",
          "I am worthy of extraordinary wealth and prosperity",
          "My neural patterns are perfectly tuned to attract money",
          "I embody the wealth frequency of the ultrasuccessful",
          "My brain is wired for unlimited financial abundance",
          "I am a powerful creator of wealth and prosperity","My neural circuitry is optimized for massive wealth creation",
          "I carry the wealth frequency patterns ofbillionaires",
          "My DNA resonates perfectly with financial abundance",
          "I am genetically coded for exponential prosperity",
          "My brain waves naturally attract unlimited resources"
        ],
        abundance: [
          "Money flows to me easily and effortlessly",
          "Wealth surrounds me in expected and unexpected ways",
          "My financial success benefits everyone around me",
          "I see abundant opportunities in every situation",
          "My wealth consciousness expands infinitely each day",
          "The universe conspires to increase my wealth daily",
          "My capacity to receive wealth is unlimited",
          "Wealth accelerates towards me at quantum speed",
          "My prosperity field magnetizes infinite opportunities",
          "Money multiplies effortlessly in my energy field",
          "My wealth frequency amplifies everything I touch",
          "Abundance flows through my optimized neural pathways"
        ],
        action: [
          "I take inspired actions that multiply my wealth",
          "I make decisions with confidence and financial clarity",
          "I recognize and seize lucrative opportunities instantly",
          "My actions align perfectly with wealth creation",
          "I execute my wealth-building plans with precision",
          "Every action I take increases my net worth",
          "I naturally choose the most profitable path forward",
          "My neural patterns automatically generate wealth",
          "I attract strategic opportunities at the perfect frequency",
          "My wealth DNA activates profitable decisions instantly",
          "I manifest abundance through aligned action",
          "My brain waves synchronize with perfect timing"
        ],
        gratitude: [
          "I am deeply grateful for my growing wealth",
          "I appreciate the abundance that flows into my life",
          "Thank you for my perfect wealth alignment",
          "I am thankful for my natural ability to create wealth",
          "Gratitude amplifies my wealth frequency daily",
          "I appreciate every dollar that flows to me",
          "Thank you for my increasing financial success",
          "I am grateful for my optimized wealth frequency",
          "Thank you for my perfectly aligned neural patterns",
          "Deep gratitude activates my abundance DNA",
          "I appreciate my natural wealth magnetism",
          "Thank you for my quantum wealth acceleration"
        ]
      };

      // Select three random affirmations from each category
      const dailyAffirmations = Object.entries(AFFIRMATIONS).reduce((acc, [category, affirmations]) => {
        const shuffled = [...affirmations].sort(() => Math.random() - 0.5);
        acc[category] = shuffled.slice(0, 3);
        return acc;
      }, {} as Record<string, string[]>);

      try {
        // Update the session with the generated affirmations
        await db.update(sessions)
          .set({ dailyAffirmations })
          .where(eq(sessions.id, todaySession.id));

        // Verify storage by retrieving the updated session
        const [updatedSession] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.id, todaySession.id))
          .limit(1);

        res.json({ affirmations: dailyAffirmations });
      } catch (dbError) {
        console.error('[Affirmations API] Database error while storing affirmations:', {
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        });
        throw dbError;
      }
    } catch (error) {
      console.error('[Affirmations API] Error in affirmations generation:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        error: "Failed to generate daily affirmations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create new session
  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Use debug-adjusted time for all date checks
      const now = TimeManager.getCurrentEST();
      // Get the user's information for day calculation
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate current day based on user's first access date
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, now);

      // Get all user's sessions ordered by creation time
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user!.id),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });

      // In debug mode, we don't restrict session creation
      // For normal mode, check if a session exists for the current day
      const existingSession = user.isDebug ? null : userSessions.find(session => {
        const sessionDay = TimeManager.getDayNumber(user.firstAccessDate, session.createdAt);
        return sessionDay === currentDay;
      });

      // Allow new session if we're on a different debug day
      if (existingSession && TimeManager.getDayNumber(user.firstAccessDate, existingSession.createdAt) === currentDay) {
        // Calculate next recording time using TimeManager
        const nextRecordingTime = TimeManager.getNextMidnight(now);
        return res.status(429).json({
          message: "Only one recording per day is allowed",
          nextRecordingTime: nextRecordingTime.toISOString(),
          latestSession: existingSession
        });
      }

      // Get user's existing readings and improvement history
      const existingImprovements = await db.query.userImprovements.findMany({
        orderBy: (improvements, { desc }) => [desc(improvements.createdAt)],
        limit: 20 // Keep last 20 improvements
      });

      // Generate only 2-4 new improvements
      const newImprovementsCount = Math.floor(Math.random() * 3) + 2; // Random number between 2-4
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      // Generate daily wealth insight
      const dailyInsight = generateDailyInsight();

      // Generate daily insight immediately after wealth score calculation
      const dailyWealthInsight = generateDailyInsight();

      // Create new session using debug-adjusted time
      const [session] = await db.insert(sessions)
        .values({
          userId: req.user!.id,
          wealthScore: req.body.wealthScore,
          audioUrl: req.body.audioUrl,
          audioData: req.body.audioData,
          wealthReading: existingUser.wealthDnaPrediction || req.body.wealthReading,
          expertOpinion: existingUser.lastExpertOpinion || req.body.expertOpinion,
          completed: true,
          gammaSessionCompleted: false,
          dailyWealthInsight: dailyWealthInsight, // Explicitly assign server-generated insight
          createdAt: now // Use debug-adjusted time for creation
        })
        .returning();

      // Get yesterday's date in EST
      const yesterdayEST = new Date(now);
      yesterdayEST.setDate(yesterdayEST.getDate() - 1);
      yesterdayEST.setHours(0, 0, 0, 0);

      // Check if user completed a session yesterday
      const yesterdaySession = await db.query.sessions.findFirst({
        where: (sessions, { and, eq, gte, lt }) => and(
          eq(sessions.userId, req.user!.id),
          gte(sessions.createdAt, yesterdayEST),
          lt(sessions.createdAt, TimeManager.getESTMidnight(now))
        ),
      });

      // Update streak information
      const currentStreak = yesterdaySession ? (existingUser.currentStreak || 0) + 1 : 1;
      const longestStreak = Math.max(currentStreak, existingUser.longestStreak || 0);

      // Update user streak information
      await db.update(users)
        .set({
          currentStreak,
          longestStreak,
          wealthDnaPrediction: req.body.wealthReading || existingUser.wealthDnaPrediction,
          lastExpertOpinion: req.body.expertOpinion || existingUser.lastExpertOpinion
        })
        .where(eq(users.id, req.user!.id));

      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        error: "Failed to create session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Store community growth data in memory
  let lastCommunityUpdate = new Date('2024-12-13');
  let baseCommunityCount = 45638;
  let currentOnlineUsers = 1550 + Math.floor(Math.random() * 7111); // Initial random between 1550-8660
  let lastOnlineUpdate = Date.now();

  // Update online users every 15 seconds
  setInterval(() => {
    const targetOnline = 1550 + Math.floor(Math.random() * 7111);
    const diff = targetOnline - currentOnlineUsers;
    currentOnlineUsers += Math.floor(diff * 0.3);
    lastOnlineUpdate = Date.now();
  }, 15000);

  // Community Stats API
  app.get("/api/community/stats", async (req, res) => {
    try {
      // Get or generate community stats
      let stats = await db.query.communityStats.findFirst({
        orderBy: (communityStats, { desc }) => [desc(communityStats.lastUpdated)],
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Update total community count daily
      if (today > lastCommunityUpdate) {
        const daysDiff = Math.floor((today.getTime() - lastCommunityUpdate.getTime()) / (1000 * 60 * 60 * 24));
        for (let i = 0; i < daysDiff; i++) {
          baseCommunityCount += 75 + Math.floor(Math.random() * 326); // Random increase between 75 and 400
        }
        lastCommunityUpdate = today;
      }

      // Update online users every 30 seconds with smooth transitions
      if (Date.now() - lastOnlineUpdate > 30000) {
        const targetOnline = 1550 + Math.floor(Math.random() * 7111); // Random between 1550 and 8660
        const diff = targetOnline - currentOnlineUsers;
        currentOnlineUsers += Math.floor(diff * 0.3); // Smooth transition
        lastOnlineUpdate = Date.now();
      }

      if (!stats || Date.now() - new Date(stats.lastUpdated).getTime() > 30000) {
        const [newStats] = await db.insert(communityStats)
          .values({
            onlineUsers: currentOnlineUsers,
            totalUsers: baseCommunityCount,
            avgImprovement: 78, // Fixed 78% improvement
            lastUpdated: new Date(),
          })
          .returning();

        stats = newStats;
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching community stats:', error);
      res.status(500).send("Failed to fetch community stats");
    }
  });

  // User Improvements API
  app.get("/api/community/improvements", async (req, res) => {
    try {
      // Get recent improvements ordered by creation time
      let improvements = await db.query.userImprovements.findMany({
        orderBy: (userImprovements, { desc }) => [desc(userImprovements.createdAt)],
        limit: 10,
      });

      // Helper function to generate improvement between 2-7%
      // Helper function to generate realistic usernames (6-15 chars)
      const generateUsername = () => {
        // Diverse first names across demographics
        const firstNames = [
          'emma', 'liam', 'sofia', 'noah', 'ava', 'muhammad', 'isabella', 'lucas',
          'yuki', 'chen', 'priya', 'aiden', 'zara', 'diego', 'nina', 'kai',
          'maria', 'james', 'leila', 'omar', 'ana', 'pavel', 'mei', 'andre'
        ];

        // Diverse last names across demographics
        const lastNames = [
          'smith', 'garcia', 'kim', 'patel', 'wang', 'mueller', 'silva', 'jones',
          'zhang', 'kumar', 'lopez', 'ivanov', 'sato', 'nguyen', 'cohen', 'lee',
          'rodriguez', 'singh', 'brown', 'ali', 'martinez', 'wilson', 'chen', 'park'
        ];

        const patterns = [
          // firstname.lastname
          () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            return `${first}.${last}`;
          },
          // firstnamelastInitial + birth year
          () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)][0];
            const year = Math.floor(Math.random() * (2005 - 1960 + 1)) + 1960;
            return `${first}${last}${year}`;
          },
          // firstname_lastname
          () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            return `${first}_${last}`;
          },
          // lastnamefirstInitial + area code
          () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)][0];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            const areaCode = Math.floor(Math.random() * 900) + 100;
            return `${last}${first}${areaCode}`;
          },
          // firstInitial-lastname-birthYear
          () => {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)][0];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            const year = (Math.floor(Math.random() * (2005 - 1960 + 1)) + 1960).toString().slice(2);
            return `${first}-${last}-${year}`;
          }
        ];

        // Generate username with proper length constraints
        let username;
        do {
          const pattern = patterns[Math.floor(Math.random() * patterns.length)];
          username = pattern().toLowerCase();
        } while (username.length < 6 || username.length > 15);

        return username;
      };

      const generateImprovement = () => {
        // Generate a random number between 2 and 7 (inclusive)
        const MIN_IMPROVEMENT = 2;
        const MAX_IMPROVEMENT = 7;
        const improvement = Math.min(
          MAX_IMPROVEMENT,
          MIN_IMPROVEMENT + Math.floor(Math.random() * (MAX_IMPROVEMENT - MIN_IMPROVEMENT + 1))
        );

        // Validate improvement is within bounds
        if (improvement < MIN_IMPROVEMENT || improvement > MAX_IMPROVEMENT) {
          console.error('Invalid improvement value generated:', improvement);
          return {
            anonymousId: generateUsername(),
            improvement: MIN_IMPROVEMENT, // Fallback to minimum if calculation fails
            category: 'Wealth Alignment' as const,
            createdAt: new Date(),
          };
        }

        return {
          anonymousId: generateUsername(),
          improvement,
          category: 'Wealth Alignment' as const,
          createdAt: new Date(),
        };
      };

      // Clear existing test data and regenerate
      try {
        // Remove old test data
        await db.delete(userImprovements).execute();

        // Generate fresh improvements
        const initialImprovements = Array(10).fill(null).map(() => {
          const improvement = generateImprovement();
          return improvement;
        });

        // Insert new improvements
        improvements = await db.insert(userImprovements)
          .values(initialImprovements)
          .returning();
      } catch (error) {
        console.error('Error resetting improvements:', error);
        throw error;
      }

      // Add new improvement every 15 seconds
      const lastUpdate = improvements[0]?.createdAt;
      if (!lastUpdate || Date.now() - new Date(lastUpdate).getTime() > 15000) {
        const newImprovement = generateImprovement();

        try {
          const [insertedImprovement] = await db.insert(userImprovements)
            .values(newImprovement)
            .returning();

          // Refresh the improvements list
          improvements = await db.query.userImprovements.findMany({
            orderBy: (userImprovements, { desc }) => [desc(userImprovements.createdAt)],
            limit: 10,
          });
        } catch (error) {
          console.error('Error inserting new improvement:', error);
          throw error;
        }
      }

      res.json(improvements);
    } catch (error) {
      console.error('Error with improvements:', error);
      res.status(500).send("Failed to fetch improvements");
    }
  });

  // Success Stories API
  app.get("/api/community/success-stories", async (req, res) => {
    try {
      let stories = await db.query.successStories.findMany({
        orderBy: (successStories, { desc }) => [desc(successStories.createdAt)],
        limit: 5,
      });

      if (!stories.length) {
        // Generate initial success stories if none exist
        const segments = [
          'Early Career Professional',
          'Small Business Owner',
          'Creative Entrepreneur',
          'Corporate Executive',
          'Real Estate Investor'
        ];

        const storyTemplates = [
          "Started at a similar wealth score and achieved breakthrough in just [TIME] days. Now consistently identifying opportunities worth $[AMOUNT]k+",
          "Transformed financial mindset using daily neural optimization. Income increased by [PERCENT]% within [TIME] days",
          "Used the [FREQUENCY] frequency daily, leading to [AMOUNT]k in unexpected opportunities within [TIME] days",
          "Began with similar patterns, now generating [AMOUNT]k+ in passive income after [TIME] days of activation",
          "Overcame financial blocks using neural alignment, resulting in [PERCENT]% portfolio growth in [TIME] days"
        ];

        const newStories = segments.map((segment, index) => {
          const timeframe = 45 + Math.floor(Math.random() * 45); // 45-90 days
          const improvement = 25 + Math.floor(Math.random() * 75); // 25-100%
          const amount = 20 + Math.floor(Math.random() * 80); // $20k-$100k
          const percent = 30 + Math.floor(Math.random() * 70); // 30-100%
          const frequency = ['Abundance', 'Confidence', 'Opportunity', 'Action'][Math.floor(Math.random() * 4)];

          let story = storyTemplates[index]
            .replace('[TIME]', timeframe.toString())
            .replace('[AMOUNT]', amount.toString())
            .replace('[PERCENT]', percent.toString())
            .replace('[FREQUENCY]', frequency);

          return {
            userSegment: segment,
            story,
            improvement,
            timeframe,
            createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Last 30 days
          };
        });

        stories = await db.insert(successStories)
          .values(newStories)
          .returning();
      }

      res.json(stories);
    } catch (error) {
      console.error('Error fetching success stories:', error);
      res.status(500).send("Failed to fetch success stories");
    }
  });


  // Debug endpoint to skip to next day
  app.post("/api/debug/skip-day", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Calculate new first access date by subtracting a day
      const newFirstAccessDate = new Date(user.firstAccessDate);
      newFirstAccessDate.setDate(newFirstAccessDate.getDate() - 1);

      // Get current day's sessions
      const currentSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, user.id));

      // Calculate current day number before update
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, new Date());

      // Filter sessions from the current day
      const todaysSessions = currentSessions.filter(session =>
        TimeManager.getDayNumber(user.firstAccessDate, session.createdAt) === currentDay
      );

      // Move today's sessions to previous day by updating their timestamps
      for (const session of todaysSessions) {
        const sessionDate = new Date(session.createdAt);
        sessionDate.setDate(sessionDate.getDate() - 1);

        await db
          .update(sessions)
          .set({
            createdAt: sessionDate
          })
          .where(eq(sessions.id, session.id));
      }

      // Update user's first access date
      await db
        .update(users)
        .set({
          firstAccessDate: newFirstAccessDate
        })
        .where(eq(users.id, user.id));

      res.json({
        message: "Day skipped successfully",
        newFirstAccessDate: newFirstAccessDate.toISOString()
      });
    } catch (error) {
      console.error('Error skipping day:', error);
      res.status(500).json({ error: "Failed to skip day" });
    }
  });

  // Get current day information
  app.get("/api/user/day-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Use current EST time and user's first access date for day calculation
      const estNow = TimeManager.getCurrentEST();
      const currentDay = TimeManager.getDayNumber(user.firstAccessDate, estNow);
      const nextMidnight = TimeManager.getESTMidnight(estNow);
      nextMidnight.setDate(nextMidnight.getDate() + 1);

      res.json({
        currentDay,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        nextSessionTime: nextMidnight.toISOString()
      });

    } catch (error) {
      console.error('Error getting day info:', error);
      res.status(500).json({
        error: "Failed to get day information",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Handle subscription status updates (without payment integration)
  app.post("/api/subscription/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { status } = req.body;

      if (!['trial', 'free', 'paid', 'churned'].includes(status)) {
        return res.status(400).json({
          message: "Invalid subscription status"
        });
      }

      // Update user's subscription status
      const [updatedUser] = await db
        .update(users)
        .set({
          subscriptionStatus: status
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({
        message: "Subscription status updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      res.status(500).json({
        message: "Failed to update subscription status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get subscription status
  app.get("/api/subscription/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        status: user.subscriptionStatus,
        isActive: user.subscriptionStatus !== 'churned'
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({
        message: "Failed to fetch subscription status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update subscription status
  app.post("/api/update-subscription-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { status } = req.body;

      // Validate status
      if (!status || status !== 'trial') {
        return res.status(400).json({
          message: "Invalid subscription status. Only 'trial' status is supported."
        });
      }

      // Update user subscription status
      const [updatedUser] = await db
        .update(users)
        .set({
          subscriptionStatus: status
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Subscription status updated successfully",
        status: updatedUser.subscriptionStatus
      });
    } catch (error) {
      console.error('Error updating status:', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id
      });
      res.status(500).json({
        message: "Failed to update subscription status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // End of routes
}