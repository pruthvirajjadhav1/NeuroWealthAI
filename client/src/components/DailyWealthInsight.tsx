import { Card } from "@/components/ui/card";
import { generateDailyInsight } from "@/utils/wealthInsights";

interface DailyWealthInsightProps {
  wealthScore: number;
  dailyInsight?: string | null;
}

export function DailyWealthInsight({
  wealthScore,
  dailyInsight,
}: DailyWealthInsightProps) {
  // Debug logging for insight state
  console.log('[DailyWealthInsight] Rendering with props:', {
    hasWealthScore: !!wealthScore,
    hasDailyInsight: !!dailyInsight,
    wealthScore,
    dailyInsight
  });

  // Generate a fallback insight if none exists
  const displayedInsight = dailyInsight || generateDailyInsight() || 
    "Complete today's voice analysis to receive your daily wealth insight.";

  // Log which insight is being displayed
  console.log('[DailyWealthInsight] Using insight:', {
    type: dailyInsight ? 'stored' : 'generated',
    displayedInsight
  });

  return (
    <Card className="relative p-4 sm:p-6 mb-4 bg-gradient-to-br from-slate-900/50 via-slate-900/30 to-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-20 pointer-events-none" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-white"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06L5.636 5.197a.75.75 0 0 1 0-1.06Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.06-1.061l1.591-1.591a.75.75 0 0 1 1.06 0ZM4.5 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H5.25A.75.75 0 0 1 4.5 12Zm12.75 0a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75ZM12 19.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Today's Wealth Insight
            </h3>
            <p className="text-sm text-cyan-400/60">Neural Pattern Analysis</p>
          </div>
        </div>

        <div className="pl-2 border-l-2 border-cyan-500/20">
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-light">
            {displayedInsight}
          </p>
        </div>
      </div>
    </Card>
  );
}
