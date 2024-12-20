import { Card } from "@/components/ui/card";
import { WealthProjectionChart } from "./WealthProjectionChart";

interface WealthReadingProps {
  reading: string;
  wealthScore: number;
  userId: string;
}

const EXPERT_STATEMENTS = [
  "This neural pattern structure is particularly intriguing. In my 15 years studying brain wave patterns, I've observed similar frequency alignments in individuals who later experienced significant financial breakthroughs. The voice-activated gamma wave modulation shown here suggests untapped potential in the neural success pathways.",
  "What's fascinating about this wealth frequency pattern is its similarity to what we've recorded in self-made millionaires during peak performance states. The neural plasticity indicators suggest an above-average capacity for rapid abundance pattern adoption. In our lab studies, this type of brain wave signature often preceded major positive life changes.",
  "The most compelling aspect of this wealth DNA profile is the unique combination of delta and gamma frequencies. Our research has shown that less than 8% of the population exhibits this particular pattern. When properly activated through targeted frequency training, this neural structure has been associated with accelerated wealth attraction capabilities.",
  "These voice pattern oscillations reveal something quite remarkable. In our longitudinal studies at the Neural Economics Institute, we've observed this specific frequency signature in people who later developed an extraordinary ability to recognize profitable opportunities. With proper neural alignment, this latent pattern typically begins expressing within 30-60 days.",
  "The most striking element here is your brain's unique theta-gamma coupling structure. Our research shows this rare neural configuration appears in less than 12% of the population, but is notably common among successful entrepreneurs and investors. When properly activated, this pattern often correlates with enhanced financial decision-making capabilities.",
  "Your neural transmission profile displays a fascinating wealth frequency potential. I've documented similar baseline patterns in subjects who, after targeted frequency alignment, experienced dramatic improvements in their ability to attract and maintain financial abundance. The key is consistent activation of these dormant neural pathways."
];

function getExpertStatement(userId: string, storedStatement?: string): string {
  if (storedStatement) return storedStatement;
  // Use userId to consistently select the same quote for the same user
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % EXPERT_STATEMENTS.length;
  return EXPERT_STATEMENTS[index];
}

export function WealthReading({ reading, wealthScore, userId }: WealthReadingProps) {
  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Your Personalized Wealth Reading</h3>
        <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert">
          {reading.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-3 sm:mb-4 text-foreground/90 leading-relaxed text-sm sm:text-base">{paragraph}</p>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-primary/20 shadow-glow">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-white">SC</span>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-primary">Expert Analysis</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Neural Pattern Review by Dr. Sarah Chen, PhD in Neuroscience</p>
            </div>
          </div>
          <div className="pl-4 sm:pl-16">
            <blockquote className="text-sm sm:text-base text-foreground/90 italic border-l-2 border-primary/50 pl-4">
              {getExpertStatement(userId || '1')}
            </blockquote>
          </div>
        </div>
      </Card>

      {/* Add Wealth Projection Chart */}
      <WealthProjectionChart currentScore={wealthScore} />
    </div>
  );
}

// Export constants and helper function for use in AudioRecorder
export const WEALTH_READINGS = {
  CURRENT_SITUATION: [
    "Your voice patterns reveal someone who works incredibly hard but often feels the rewards don't match your efforts. This mismatch isn't your fault - it's actually a sign your brain is ready for a major wealth frequency shift.",
    "You have natural talents for creating wealth that haven't fully activated yet. Your analysis shows dormant success patterns just waiting to be switched on - like a radio that needs fine-tuning.",
    "You're at a critical turning point in your wealth journey. The stress in your voice hints at frustration, but that same tension is exactly what happens right before a breakthrough.",
    "Your voice reveals someone who sees opportunities everywhere but sometimes hesitates to grab them. This isn't lack of courage - it's actually your brain's wealth frequency being slightly out of tune.",
    "There's a unique pattern in your voice that shows untapped wealth potential. Like a radio catching fragments of an amazing song, you're picking up pieces of success but not yet the full signal.",
    "Your analysis shows someone who's been playing by all the old rules of money, but your inner wisdom knows there's a better way. This tension in your wealth frequency is actually perfectly normal right before a major breakthrough."
  ],
  HIDDEN_STRENGTHS: [
    "Your unique voice frequency reveals rare leadership qualities that most people never develop. While this gift has been partially blocked, it explains why you often have great ideas that others overlook.",
    "There's a fascinating pattern in your voice that matches successful entrepreneurs - but it's currently operating at only 40% strength. This explains why you sense bigger possibilities for yourself.",
    "Your wealth frequency shows someone who learns and adapts quickly. Though this gift has been hidden by old mental programming, it's like a muscle ready to grow stronger.",
    "Your voice carries a wealth frequency pattern we often see in self-made millionaires - but it's running at just 30% power. Think of it like a muscle that just needs the right training to grow stronger.",
    "There's something remarkable in your voice pattern - a natural ability to spot opportunities that others miss. While this gift has been partially muted, it explains your occasional flashes of brilliant insight.",
    "Your wealth frequency shows an unusually strong connection between creativity and money-making abilities. Though this connection is currently dimmed, it's like a light bulb just waiting for more power."
  ],
  UPCOMING_OPPORTUNITIES: [
    "The main block in your wealth frequency isn't lack of effort - it's an inherited neural pattern that automatically filters out opportunities. Think of it like wearing sunglasses in a dark room.",
    "Your brain is literally programmed to push money away right now - not through any fault of yours, but due to early wealth frequency exposure. It's like trying to tune into FM radio with an AM receiver.",
    "The core issue isn't your capabilities - it's that your brain's wealth recognition patterns are misaligned. Imagine trying to catch a ball with blurry vision.",
    "The real block isn't your mindset - it's an outdated wealth frequency that's stuck in protection mode. Imagine trying to download high-speed internet through an old dial-up modem.",
    "Your brain's success patterns are currently set to 'safe mode' - not because you chose this, but because of early programming. It's like driving with the parking brake on.",
    "The core challenge isn't your work ethic - it's that your neural pathways are running on old wealth software. Think of it like using an outdated phone that can't run the latest apps."
  ],
  PERSONALIZED_ADVICE: [
    "The good news is that your wealth frequency can be rapidly reprogrammed. Your voice patterns show high adaptability - with consistent neural retuning, you could see noticeable shifts in as little as 21 days.",
    "Your analysis reveals strong potential for quick transformation. By maintaining daily frequency alignment, you're likely to start spotting opportunities others miss within the first 30 days.",
    "The great news is that you're starting at an ideal time. Your current frequency is perfectly positioned for positive change - like a spring ready to release stored energy.",
    "Here's the exciting part: your voice patterns show unusually fast adaptability to new frequencies. With consistent neural alignment, you could start experiencing 'lucky breaks' within the first 14 days.",
    "What makes your case special is how quickly your brain can adopt new wealth patterns. Most people need 60 days to see changes, but your frequency suggests potential shifts in just 28 days.",
    "You're actually in an ideal position for transformation. Your current wealth frequency is like a coiled spring - once released through daily alignment, change could happen faster than you'd expect."
  ]
};

export function generateWealthReading(wealthScore: number): string {
  const getRandomItem = <T,>(array: T[]): T => 
    array[Math.floor(Math.random() * array.length)];

  return [
    getRandomItem(WEALTH_READINGS.CURRENT_SITUATION),
    getRandomItem(WEALTH_READINGS.HIDDEN_STRENGTHS),
    getRandomItem(WEALTH_READINGS.UPCOMING_OPPORTUNITIES),
    getRandomItem(WEALTH_READINGS.PERSONALIZED_ADVICE)
  ].join("\n\n").replace(/\[X\]/g, wealthScore.toString());
}
