import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const FREQUENCY_TYPES = {
  confidence: {
    id: "confidence",
    name: "Confidence Frequency",
    description: "Unlock natural confidence and remove self-doubt",
    message: "You're now beginning your Confidence Frequency activation session, designed to unlock your natural wealth potential"
  },
  opportunity: {
    id: "opportunity",
    name: "Opportunity Frequency",
    description: "Enhance your ability to spot lucrative opportunities",
    message: "Your Opportunity Frequency session is starting, prepare to enhance your opportunity recognition"
  },
  abundance: {
    id: "abundance",
    name: "Abundance Frequency",
    description: "Remove scarcity mindset and open to greater wealth",
    message: "Welcome to your Abundance Frequency activation, releasing old scarcity patterns"
  },
  intuition: {
    id: "intuition",
    name: "Intuition Frequency",
    description: "Strengthen your inner guidance system for better decisions",
    message: "Your Intuition Frequency session is beginning, strengthening your inner guidance system"
  },
  decision: {
    id: "decision",
    name: "Decision Frequency",
    description: "Enhance clarity and certainty in financial choices",
    message: "Starting your Decision Frequency activation, enhancing your natural clarity"
  },
  action: {
    id: "action",
    name: "Action Frequency",
    description: "Overcome procrastination and take decisive action",
    message: "Beginning your Action Frequency session, activating your wealth momentum"
  }
} as const;

interface FrequencySelectorProps {
  selectedFrequency: string;
  onFrequencySelect: (frequency: string) => void;
}

export function FrequencySelector({ selectedFrequency, onFrequencySelect }: FrequencySelectorProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Select Your Neural Optimization Track</h3>
      <RadioGroup value={selectedFrequency} onValueChange={onFrequencySelect}>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.values(FREQUENCY_TYPES).map((frequency) => (
            <div key={frequency.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value={frequency.id} id={frequency.id} />
              <Label htmlFor={frequency.id} className="cursor-pointer">
                <div className="font-medium">{frequency.name}</div>
                <div className="text-sm text-muted-foreground">{frequency.description}</div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </Card>
  );
}
