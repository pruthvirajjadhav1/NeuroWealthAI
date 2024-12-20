import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  firstAccessDate: timestamp("first_access_date", { mode: 'string' }).defaultNow().notNull(),
  lastAccessDate: timestamp("last_access_date", { mode: 'string' }).defaultNow().notNull(),
  totalSessions: integer("total_sessions").default(0),
  lastWealthScore: integer("last_wealth_score"),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  wealthDnaPrediction: text("wealth_dna_prediction"),
  lastActionGuide: text("last_action_guide"),
  lastExpertOpinion: text("last_expert_opinion"),
  isAdmin: boolean("is_admin").default(false),
  isDebug: boolean("is_debug").default(false),
  isIntro: boolean("is_intro").default(false),
  subscriptionStatus: text("subscription_status")
    .$type<'paid' | 'trial' | 'churned' | 'free'>()
    .default('paid')
    .notNull(), // Feature access level flag: paid (full access), trial (temporary access), free (limited access), churned (revoked access)
  utm_source: text("utm_source"),
  utm_adid: text("utm_adid"),
  utm_angle: text("utm_angle"),
  utm_funnel: text("utm_funnel")
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  neuralScore: integer("neuralScore"),
  wealthScore: integer("wealthScore").notNull(),
  isBaseline: boolean("isBaseline").default(false),
  audioUrl: text("audioUrl"),
  audioData: text("audioData"), // Base64 encoded audio data for offline playback
  hasGeneratedGammaSession: boolean("hasGeneratedGammaSession").default(false),
  gammaSessionCompleted: boolean("gammaSessionCompleted").default(false),
  gammaSessionGeneratedAt: timestamp("gammaSessionGeneratedAt"),
  gammaSessionCompletedAt: timestamp("gammaSessionCompletedAt"),
  completed: boolean("completed").default(false),
  wealthReading: text("wealthReading"), // Personalized wealth reading text
  wealthReadingExpiresAt: timestamp("wealthReadingExpiresAt"), // Expiration date for the reading
  expertOpinion: text("expertOpinion"), // Daily expert insight
  wealthFrequency: text("wealthFrequency"), // Selected frequency for the session
  actionGuide: text("actionGuide"), // Personalized action guide for the day
  improvementPercentage: integer("improvementPercentage"), // Progress from last session
  dailyWealthInsight: text("dailyWealthInsight"), // Personalized wealth reading text
  dailyAffirmations: text("dailyAffirmations"), // Daily affirmations stored as JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  affirmationCompleted: boolean("affirmationCompleted").default(false),
});

export const gammaSessionCompletions = pgTable("gamma_session_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionDate: timestamp("session_date").defaultNow().notNull(),
  completed: boolean("completed").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export const insertUserSchema = createInsertSchema(users).extend({
  token: z.string().min(1, "Registration token is required").optional(),
  email: z.string().email("Invalid email format").optional()
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export const selectUserSchema = createSelectSchema(users);
export const successStories = pgTable("success_stories", {
  id: serial("id").primaryKey(),
  userSegment: text("user_segment").notNull(),
  story: text("story").notNull(),
  improvement: integer("improvement").notNull(),
  timeframe: integer("timeframe").notNull(), // in days
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityStats = pgTable("community_stats", {
  id: serial("id").primaryKey(),
  onlineUsers: integer("online_users").notNull(),
  totalUsers: integer("total_users").notNull(),
  avgImprovement: integer("avg_improvement").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const userImprovements = pgTable("user_improvements", {
  id: serial("id").primaryKey(),
  anonymousId: text("anonymous_id").notNull(),
  improvement: integer("improvement").notNull(),
  category: text("category").notNull().$type<'Wealth Alignment'>().default('Wealth Alignment'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertSuccessStorySchema = createInsertSchema(successStories);
export const selectSuccessStorySchema = createSelectSchema(successStories);
export const insertCommunityStatsSchema = createInsertSchema(communityStats);
export const selectCommunityStatsSchema = createSelectSchema(communityStats);
export const insertUserImprovementSchema = createInsertSchema(userImprovements);
export const selectUserImprovementSchema = createSelectSchema(userImprovements);
export const utmTracking = pgTable("utm_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  source: text("source"),
  adid: text("adid"),
  angle: text("angle"),
  funnel: text("funnel"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  rawParams: text("raw_params"), // Store all UTM parameters as JSON string
});

export type UtmTracking = typeof utmTracking.$inferSelect;
export type InsertUtmTracking = typeof utmTracking.$inferInsert;
export const insertUtmTrackingSchema = createInsertSchema(utmTracking);
export const selectUtmTrackingSchema = createSelectSchema(utmTracking);

export const ltvTransactions = pgTable("ltv_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  type: text("type").$type<'addition' | 'deduction'>().notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export type LtvTransaction = typeof ltvTransactions.$inferSelect;
export type InsertLtvTransaction = typeof ltvTransactions.$inferInsert;

export const registrationTokens = pgTable("registration_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").unique().notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  usedAt: timestamp("used_at", { mode: 'string' }),
  usedBy: integer("used_by").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionType: text("subscription_type")
    .$type<'paid' | 'trial' | 'free'>()
    .default('paid')
    .notNull(), // Initial feature access level when registering: paid (full), trial (temporary), free (limited)
});

export type RegistrationToken = typeof registrationTokens.$inferSelect;
export type InsertRegistrationToken = typeof registrationTokens.$inferInsert;
export const insertRegistrationTokenSchema = createInsertSchema(registrationTokens);
export const selectRegistrationTokenSchema = createSelectSchema(registrationTokens);
export const funnel_events = pgTable("funnel_events", {
  id: serial("id").primaryKey(),
  eventType: text("eventType").notNull(),
  eventData: text("eventData"),
  userId: integer("userId").references(() => users.id),
  sessionId: text("sessionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelEvent = typeof funnel_events.$inferSelect;
export type InsertFunnelEvent = typeof funnel_events.$inferInsert;
export const insertFunnelEventSchema = createInsertSchema(funnel_events);
export const selectFunnelEventSchema = createSelectSchema(funnel_events);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").unique().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
  usedAt: timestamp("used_at", { mode: 'string' }),
  isActive: boolean("is_active").default(true).notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);