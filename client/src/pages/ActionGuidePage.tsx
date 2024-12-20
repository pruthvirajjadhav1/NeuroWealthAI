import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumFeature } from "@/components/PremiumFeature";

interface ActionGuide {
  dailyPowerFocus: string;
  weeklyWealthForecast: string;
  weeklyGrowthForecast: string;
  weeklyCautionForecast: string;
  moneyAction: string;
  connectionAction: string;
  mindsetAction: string;
  successTip: string;
  breakthroughPrediction: string;
  lastGeneratedDate: string;
}

const DAILY_POWER_FOCUS = [
  "Your voice patterns show peak manifestation energy today. Focus on visualizing your biggest goals for 7 minutes this morning.",
  "Your wealth frequency is aligned for networking today. One chance encounter could change everything.",
  "Your abundance receptor patterns are highly active. Stay alert for unexpected opportunities between 2-5 PM.",
  "Today's neural analysis shows incredible clarity for financial decisions. Trust your instincts before 6 PM.",
  "Your wealth DNA is perfectly aligned for starting new ventures today. That idea you've been hesitating on? Now's the time.",
  "Your success frequency is magnetically charged today. The right people will be naturally drawn to your energy.",
  "Your prosperity patterns indicate a strong manifestation window until sunset. Write down your biggest money goal three times today."
];

const WEEKLY_WEALTH_FORECAST = [
  "This week's neural pattern suggests you'll notice money-making opportunities others miss",
  "Your wealth frequency indicates a potential breakthrough in passive income streams",
  "Your success patterns show high receptivity to new business connections",
  "Your abundance frequency is attracting unexpected money conversations this week",
  "A wealth opportunity you previously overlooked is about to resurface",
  "Your neural patterns suggest a mentor figure entering your life soon",
  "This week's alignment shows perfect timing for launching new income streams"
];

const WEEKLY_GROWTH_FORECAST = [
  "An overlooked relationship could become your biggest asset this week",
  "A past idea you dismissed might suddenly show massive potential",
  "Someone in your network needs exactly what you offer",
  "A casual conversation this week contains a million-dollar insight",
  "Your side project has more potential than you realize - watch for signs",
  "Someone is about to recognize your hidden talents in a big way",
  "An old contact is thinking about you with a golden opportunity"
];

const WEEKLY_CAUTION_FORECAST = [
  "Avoid rushing into decisions on Tuesday when your clarity waves are lower",
  "Your abundance frequency suggests waiting 24 hours before any major financial choices",
  "Watch for old doubt patterns trying to resurface - they're just last-minute resistance before a breakthrough",
  "Your prosperity channel shows temporary interference mid-week - delay big purchases",
  "An energy vampire might try to disturb your wealth frequency - stay focused on your path",
  "Your success pattern indicates a need for extra due diligence on Thursday",
  "Protected your elevated energy by avoiding negative financial news until Friday"
];

const MONEY_FLOW_ACTIONS = [
  "Review your goals during your peak neural hour: [TIME] AM",
  "Write down your next income target when your manifestation frequency peaks at [TIME] PM",
  "Schedule important money conversations during your high-alignment window: [TIME]",
  "Check your investments when your clarity peaks at [TIME] AM",
  "Practice your wealth affirmations during your golden hour: [TIME] PM",
  "Make that important call during your charisma peak: [TIME]",
  "Review new opportunities during your insight window: [TIME]"
];

const CONNECTION_ACTIONS = [
  "Reach out to someone successful - your charisma frequency is exceptionally strong today",
  "Share your business idea with a trusted advisor - your communication clarity is peaked",
  "Accept that social invitation - your networking energy shows rare alignment",
  "Send that message you've been hesitating on - your persuasion frequency is perfect",
  "Pitch your idea today - your conviction energy is magnetically charged",
  "Join that online group - your visibility frequency shows perfect timing",
  "Make that introduction - your connection energy is highly aligned"
];

const MINDSET_ACTIONS = [
  "Release old money beliefs during tonight's neural reprogramming session",
  "Take 3 minutes to record a new wealth affirmation - your voice carries extra manifestation power today",
  "Listen to your custom frequency track before any important meetings",
  "Visualize your ideal outcome for 4 minutes during peak alignment hour",
  "Journal your gratitude list when your abundance frequency peaks",
  "Meditate on your biggest goal during your manifestation window",
  "Record your success vision during high-frequency hours"
];

const SUCCESS_ACCELERATION_TIPS = [
  "Your wealth DNA shows strongest reception of opportunities after completing morning success rituals",
  "Your neural patterns suggest journaling your goals at [TIME] will accelerate manifestation",
  "Brief meditation at [TIME] will boost your abundance frequency by up to 80% today",
  "Your voice patterns indicate high receptivity to wealth affirmations before sleep",
  "Charging your water with abundance intentions amplifies your wealth frequency today",
  "Setting your phone wallpaper to your financial goal strengthens your manifestation field",
  "Wearing blue or gold today will harmonize with your success frequency",
  "A 90-second visualization at noon will lock in your prosperity programming"
];

const BREAKTHROUGH_PREDICTIONS = [
  "Keep following your guidance - your neural patterns show a major breakthrough approaching within 14-21 days",
  "Your wealth frequency is restructuring in a pattern we often see 30-45 days before unexpected opportunities",
  "Maintain your evening sessions - your abundance receptors are 70% through a major positive shift",
  "Your success blueprint is activating - watch for synchronicities in the next 10-15 days",
  "Your prosperity coding is 80% complete - major shifts often occur at this stage",
  "A 28-day manifestation cycle is starting - stay consistent with your sessions",
  "Your wealth DNA is reaching critical mass - breakthrough typically follows this pattern"
];

function getRandomTime(startHour: number, endHour: number): string {
  const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
  const minute = Math.floor(Math.random() * 12) * 5; // Round to nearest 5 minutes
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour > 12 ? hour - 12 : hour;
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function formatActionWithTime(action: string): string {
  if (action.includes('[TIME]')) {
    const time = getRandomTime(6, 19); // Between 6 AM and 7 PM
    return action.replace('[TIME]', time);
  }
  return action;
}

function generateRandomGuidance(userId: string): ActionGuide {
  const date = new Date();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  
  // Use userId and week start to generate consistent weekly selections
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const weeklyHash = hash(`${userId}-${weekStart.toISOString()}`);
  
  // Use the hash to select consistent items for the week
  const getWeeklySelection = (array: string[], offset: number = 0) => {
    return array[(weeklyHash + offset) % array.length];
  };
  
  // Daily selection changes with each generation
  const dailyHash = hash(`${userId}-${date.toISOString()}`);
  
  return {
    dailyPowerFocus: DAILY_POWER_FOCUS[dailyHash % DAILY_POWER_FOCUS.length],
    weeklyWealthForecast: getWeeklySelection(WEEKLY_WEALTH_FORECAST),
    weeklyGrowthForecast: getWeeklySelection(WEEKLY_GROWTH_FORECAST, 1),
    weeklyCautionForecast: getWeeklySelection(WEEKLY_CAUTION_FORECAST, 2),
    moneyAction: formatActionWithTime(getWeeklySelection(MONEY_FLOW_ACTIONS, 3)),
    connectionAction: getWeeklySelection(CONNECTION_ACTIONS, 4),
    mindsetAction: getWeeklySelection(MINDSET_ACTIONS, 5),
    successTip: formatActionWithTime(getWeeklySelection(SUCCESS_ACCELERATION_TIPS, 6)),
    breakthroughPrediction: getWeeklySelection(BREAKTHROUGH_PREDICTIONS, 7),
    lastGeneratedDate: date.toISOString(),
  };
}

export default function ActionGuidePage() {
  const { user } = useUser();
  
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
  });
  
  const { data: sessionData } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      return {
        sessions: data.sessions || [],
        todaySessionExists: data.todaySessionExists || false,
      };
    },
  });

  const todaySessionExists = sessionData?.todaySessionExists;
  
  if (!todaySessionExists) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center">Complete Your Daily Voice Analysis</h2>
          <p className="text-center text-muted-foreground">
            To receive your personalized action guide, please complete today's voice analysis session first.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => window.location.href = "/"}>
              <Wand2 className="w-4 h-4 mr-2" />
              Start Voice Analysis
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const actionGuide = generateRandomGuidance(user?.id?.toString() || '1');

  const GuidanceSection = ({ title, content, className }: { title: string; content: string; className?: string }) => (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="text-foreground/90 leading-relaxed">{content}</p>
    </div>
  );

  const subscriptionStatus = userData?.subscriptionStatus || 'trial';

  return (
    <PremiumFeature 
      subscriptionStatus={subscriptionStatus}
      sessionCount={sessionData?.sessions?.length}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold mb-8">Your Personalized Action Guide</h1>
        
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 shadow-glow">
          <div className="space-y-6">
            <GuidanceSection 
              title="Daily Power Focus"
              content={actionGuide.dailyPowerFocus}
              className="border-b border-primary/10 pb-6"
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <GuidanceSection 
                  title="Wealth Alignment"
                  content={actionGuide.weeklyWealthForecast}
                />
                <GuidanceSection 
                  title="Growth Opportunities"
                  content={actionGuide.weeklyGrowthForecast}
                />
                <GuidanceSection 
                  title="Caution Areas"
                  content={actionGuide.weeklyCautionForecast}
                />
              </div>
              
              <div className="space-y-6">
                <GuidanceSection 
                  title="Money Flow Action"
                  content={actionGuide.moneyAction}
                />
                <GuidanceSection 
                  title="Connection Action"
                  content={actionGuide.connectionAction}
                />
                <GuidanceSection 
                  title="Mindset Optimization"
                  content={actionGuide.mindsetAction}
                />
              </div>
            </div>
            
            <div className="border-t border-primary/10 pt-6 space-y-6">
              <GuidanceSection 
                title="Success Acceleration Tip"
                content={actionGuide.successTip}
              />
              <GuidanceSection 
                title="Breakthrough Prediction"
                content={actionGuide.breakthroughPrediction}
              />
            </div>
          </div>
        </Card>
      </div>
      </div>
    </PremiumFeature>
  );
}
