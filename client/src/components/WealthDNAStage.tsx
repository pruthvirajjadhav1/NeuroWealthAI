import React from 'react'
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface StageInfo {
  name: string;
  range: [number, number];
  currentText: string;
  noticeText: string;
  nextPreview: string;
}

const STAGES: StageInfo[] = [
  {
    name: "Wealth DNA Awakening",
    range: [0, 20],
    currentText: "You're starting to break free from old wealth-blocking patterns. Your brain is beginning to recognize new opportunities.",
    noticeText: "You'll catch yourself pausing before impulse purchases, naturally questioning fees and costs you used to accept, starting to browse investment articles that previously seemed boring, feeling more curious about successful people's habits instead of resentful.",
    nextPreview: "As your score increases, you'll enter the Abundance Pattern Formation stage where your neural pathways begin rewiring to spot hidden opportunities."
  },
  {
    name: "Abundance Pattern Formation",
    range: [20, 40],
    currentText: "Your neural pathways are rewiring to spot hidden opportunities. You'll notice yourself making more confident financial decisions.",
    noticeText: "You'll start coming up with revenue-generating ideas, notice inefficiencies others miss, begin seeing ways to save money that excite rather than deprive you, feel more comfortable negotiating prices and rates.",
    nextPreview: "Next, you'll reach the Wealth Frequency Activation stage where your wealth frequency aligns with natural abundance patterns."
  },
  {
    name: "Wealth Frequency Activation",
    range: [40, 60],
    currentText: "Your wealth frequency is now aligned with natural abundance patterns. You'll start attracting unexpected money-making opportunities.",
    noticeText: "You'll begin spotting trends before others do, recognize undervalued assets or opportunities in your daily life, naturally network with more successful people, find yourself having ideas for improvements everywhere you look.",
    nextPreview: "Soon you'll enter the Success Circuit Integration stage where your new wealth DNA becomes your natural state."
  },
  {
    name: "Success Circuit Integration",
    range: [60, 80],
    currentText: "Your new wealth DNA is becoming your natural state. Others will notice a shift in how you carry yourself.",
    noticeText: "Colleagues will start coming to you for business advice, you'll instinctively know which opportunities to pursue or avoid, find yourself automatically thinking in terms of ROI and value creation, naturally attract mentors and successful partners.",
    nextPreview: "You're approaching Peak Wealth Resonance where your brain will naturally operate at optimal wealth frequencies."
  },
  {
    name: "Peak Wealth Resonance",
    range: [80, 100],
    currentText: "Your brain now naturally operates at optimal wealth frequencies. You've developed the same neural patterns as self-made millionaires.",
    noticeText: "You'll see profitable connections others miss entirely, turn casual conversations into business opportunities, instinctively know when to scale projects up or down, find yourself regularly being offered partnership opportunities, naturally think in terms of systems and leverage.",
    nextPreview: "You've reached the highest stage of Wealth DNA Evolution. Keep maintaining these optimal patterns!"
  }
];

interface Props {
  score: number;
  className?: string;
}

export function WealthDNAStage({ score, className = "" }: Props) {
  // Find current stage based on score
  const currentStage = STAGES.find(
    stage => score >= stage.range[0] && score <= stage.range[1]
  ) || STAGES[0];

  // Calculate progress within current stage
  const stageProgress = ((score - currentStage.range[0]) / (currentStage.range[1] - currentStage.range[0])) * 100;
  
  // Get next stage if not at final stage
  const nextStage = STAGES[STAGES.indexOf(currentStage) + 1];

  return (
    <Card className={`p-6 bg-gradient-to-br from-background/90 to-background/60 backdrop-blur-xl border-primary/20 hover:shadow-glow transition-shadow duration-300 ${className}`}>
      <div className="space-y-6">
        {/* Stage Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/70 animate-glow">
              {currentStage.name}
            </h3>
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              Stage {STAGES.indexOf(currentStage) + 1}/5
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Score Range: {currentStage.range[0]}-{currentStage.range[1]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Progress 
              value={stageProgress} 
              className="h-3 bg-primary/10" 
            />
            <div className="absolute -top-2 left-0 h-7 w-1 bg-primary/50 rounded-full transition-all duration-300"
                 style={{ left: `${stageProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stage Progress</span>
            <span className="text-primary font-medium">{Math.round(stageProgress)}%</span>
          </div>
        </div>

        {/* Current Stage Info */}
        <div className="space-y-4">
          <p className="text-lg font-semibold">{currentStage.currentText}</p>
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h4 className="font-semibold mb-2">What you might notice:</h4>
            <p className="text-sm text-muted-foreground">{currentStage.noticeText}</p>
          </div>
        </div>

        {/* Next Stage Preview */}
        {nextStage && (
          <div className="mt-6 pt-6 border-t border-primary/10">
            <h4 className="font-semibold mb-2">Next Stage Preview:</h4>
            <p className="text-sm text-muted-foreground">{currentStage.nextPreview}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
