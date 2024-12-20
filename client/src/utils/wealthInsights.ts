// Wealth insight generation utility for client-side
import { FREQUENCY_OBSERVATIONS, PATTERN_INSIGHTS, GUIDANCE } from "@/lib/constants";

export function generateDailyInsight(): string {
  function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  return [
    getRandomItem(FREQUENCY_OBSERVATIONS),
    getRandomItem(PATTERN_INSIGHTS),
    getRandomItem(GUIDANCE)
  ].join(" ");
}
