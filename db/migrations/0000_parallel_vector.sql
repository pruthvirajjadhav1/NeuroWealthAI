CREATE TABLE "community_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"online_users" integer NOT NULL,
	"total_users" integer NOT NULL,
	"avg_improvement" integer NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamma_session_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_date" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"neuralScore" integer,
	"wealthScore" integer NOT NULL,
	"isBaseline" boolean DEFAULT false,
	"audioUrl" text,
	"audioData" text,
	"gammaSessionCompleted" boolean DEFAULT false,
	"gammaSessionGeneratedAt" timestamp,
	"completed" boolean DEFAULT false,
	"wealthReading" text,
	"wealthReadingExpiresAt" timestamp,
	"expertOpinion" text,
	"wealthFrequency" text,
	"actionGuide" text,
	"improvementPercentage" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "success_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_segment" text NOT NULL,
	"story" text NOT NULL,
	"improvement" integer NOT NULL,
	"timeframe" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_improvements" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_id" text NOT NULL,
	"improvement" integer NOT NULL,
	"category" text DEFAULT 'Wealth Alignment' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"first_access_date" timestamp DEFAULT now() NOT NULL,
	"last_access_date" timestamp DEFAULT now() NOT NULL,
	"total_sessions" integer DEFAULT 0,
	"last_wealth_score" integer,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"wealth_dna_prediction" text,
	"last_action_guide" text,
	"last_expert_opinion" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "gamma_session_completions" ADD CONSTRAINT "gamma_session_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;