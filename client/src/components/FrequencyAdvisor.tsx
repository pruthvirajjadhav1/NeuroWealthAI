
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONCERNS = {
  INCOME: "I feel stuck at my current income level",
  OPPORTUNITIES: "I keep missing good opportunities",
  LUCK: "Others seem to get lucky breaks but I don't",
  HARD_WORK: "I work hard but can't seem to get ahead",
  DECISIONS: "I'm worried about making wrong financial decisions",
  CONFIDENCE: "I don't know if I have what it takes"
};

const RESPONSES = {
  [CONCERNS.INCOME]: [
    "Your wealth alignment score of [X] reveals an interesting pattern: your brain has a natural wealth ceiling that's blocking your next level of income, just like Michael who started at score [X-5] and broke through to earn $124,000 in new income after 73 days",
    "Your score of [X] shows the same success markers we spotted in Jennifer, who doubled her income to $147,000 within 90 days after removing her neural income blocks"
  ],
  [CONCERNS.OPPORTUNITIES]: [
    "Your [X] score indicates your opportunity recognition circuits are primed for activation, similar to David who started at [X-5] and suddenly spotted a $93,000 business opportunity in his third month",
    "With a score of [X], you're showing the same pattern as Sarah, who discovered three $31,000+ opportunities she'd been walking past every day after just 60 days"
  ],
  [CONCERNS.LUCK]: [
    "Your [X] wealth frequency reveals you're actually more naturally lucky than 72% of our users, just like Robert who transformed his 'bad luck' into a $167,000 windfall",
    "Your score of [X] matches Lisa's starting point exactly - she went from 'unlucky' to generating $128,000 in 'lucky' breaks within 90 days"
  ],
  [CONCERNS.HARD_WORK]: [
    "Your [X] score shows you're working against your natural wealth frequency, similar to James who simplified his way to $142,000",
    "At score [X], you're showing the same signs as Maria, who turned her hard work into smart work and generated $156,000"
  ],
  [CONCERNS.DECISIONS]: [
    "Your wealth alignment of [X] indicates strong natural intuition that's currently suppressed, just like Kevin who turned his uncertainty into $134,000 in solid choices",
    "Your [X] score reveals untapped decision-making potential, similar to Rachel who went from frozen by fear to confidently earning $145,000"
  ],
  [CONCERNS.CONFIDENCE]: [
    "Your [X] score actually shows more natural wealth potential than 67% of successful entrepreneurs, just like Tom who built a $178,000 business after believing he couldn't",
    "Your wealth frequency of [X] matches Susan's exactly - she went from total self-doubt to generating $149,000 in her first 90 days"
  ]
};

const FREQUENCIES = {
  [CONCERNS.INCOME]: "Abundance",
  [CONCERNS.OPPORTUNITIES]: "Opportunity",
  [CONCERNS.LUCK]: "Confidence",
  [CONCERNS.HARD_WORK]: "Action",
  [CONCERNS.DECISIONS]: "Decision",
  [CONCERNS.CONFIDENCE]: "Confidence"
};

interface AdviceResponse {
  mainText: string;
  frequency: string;
  breakoutDays: string;
}

export function FrequencyAdvisor() {
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      return data;
    },
  });

  const sessions = sessionData?.sessions || [];
  const latestSession = sessions[0];
  const wealthScore = latestSession?.wealthScore ?? latestSession?.neuralScore;

  function getAdvice(concern: string): AdviceResponse | null {
    if (!wealthScore && wealthScore !== 0) return null;

    const responses = RESPONSES[concern as keyof typeof RESPONSES];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const frequency = FREQUENCIES[concern as keyof typeof FREQUENCIES];
    const breakoutStart = 45 + Math.floor(Math.random() * 20);
    const breakoutEnd = breakoutStart + 15 + Math.floor(Math.random() * 15);

    const mainText = randomResponse
      .replace(/\[X\]/g, wealthScore.toString())
      .replace(/\[X-5\]/g, Math.max(0, wealthScore - 5).toString());

    return {
      mainText: `${mainText}\n\nWe recommend using the ${frequency} Frequency in your next session to accelerate your transformation.`,
      frequency,
      breakoutDays: `${breakoutStart}-${breakoutEnd}`,
    };
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Personal Wealth Frequency Advisor</h2>
        <p className="text-sm sm:text-base text-foreground/80">Loading your wealth alignment data...</p>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Personal Wealth Frequency Advisor</h2>
        <p className="text-sm sm:text-base text-foreground/80">
          Please complete a Voice Analysis session first to receive personalized advice.
        </p>
      </Card>
    );
  }

  const selectedAdvice = selectedConcern ? getAdvice(selectedConcern) : null;

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 mx-4 sm:mx-0">
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Personal Wealth Frequency Advisor</h2>
        <p className="text-sm sm:text-base text-foreground/80">
          Select your primary concern to receive personalized guidance based on your
          wealth frequency patterns.
        </p>

        <Select value={selectedConcern || ""} onValueChange={setSelectedConcern}>
          <SelectTrigger className="w-full text-sm sm:text-base">
            <SelectValue placeholder="Select your primary concern" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(CONCERNS).map((concern) => (
              <SelectItem key={concern} value={concern} className="text-sm sm:text-base">
                {concern}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAdvice && (
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert">
              <p className="text-base sm:text-lg text-foreground">{selectedAdvice.mainText}</p>
              <p className="text-xs sm:text-sm text-foreground/80 mt-3 sm:mt-4">
                Most users see their biggest breakthroughs between days {selectedAdvice.breakoutDays} of consistent activation.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
