import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const scripts = [
  "I am naturally attracted to wealth and abundance. Money flows to me easily and effortlessly. I am a magnet for financial opportunities. My wealth consciousness expands daily. I deserve prosperity in all its forms.",
  "My voice carries the frequency of abundance. Each word I speak manifests my wealth destiny. I activate prosperity through my vocal vibrations. My voice is a channel for wealth attraction.",
  "I transcend all financial limitations. Abundance flows through me like a river. I am aligned with infinite prosperity. My wealth potential knows no bounds.",
  "My energy field radiates wealth attraction. Every cell in my body vibrates at the frequency of abundance. I am one with universal prosperity. Wealth naturally gravitates towards me.",
  "I am the architect of my financial destiny. My thoughts create my wealthy reality. I build my abundance through conscious intention. My prosperity path unfolds perfectly.",
];

export function ScriptOfTheDay() {
  const [isOpen, setIsOpen] = useState(false);
  const [todayScript, setTodayScript] = useState("");

  // Fetch the current day info which includes the current day number
  const { data: dayInfo } = useQuery({
    queryKey: ["/api/user/day-info"],
    queryFn: async () => {
      const response = await fetch("/api/user/day-info", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch day info");
      }
      const data = await response.json();
      return data;
    },
    // Refetch every minute to check for day changes
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (dayInfo?.currentDay) {
      // Use the current day to determine today's script
      const scriptIndex = (dayInfo.currentDay - 1) % scripts.length;
      console.log('Updating script for day:', {
        currentDay: dayInfo.currentDay,
        scriptIndex,
        newScript: scripts[scriptIndex]
      });
      setTodayScript(scripts[scriptIndex]);
    }
  }, [dayInfo?.currentDay]); // This will trigger when the day changes

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2"
    >
      <CollapsibleTrigger className="w-full">
        <div className="group flex w-full items-center justify-between rounded-md border border-cyan-700/50 bg-black/40 px-4 py-2 text-sm font-medium hover:bg-cyan-950/30 hover:border-cyan-600/50 transition-all duration-300">
          <span className="text-cyan-400">Text of the Day</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-cyan-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border border-cyan-700/50 bg-black/40 px-4 py-3 text-sm leading-relaxed text-cyan-100/90 shadow-glow-sm">
          {todayScript}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
