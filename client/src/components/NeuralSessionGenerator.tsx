import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNeuralSession } from "@/hooks/use-neural-session";
import { Brain } from "lucide-react";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NeuralSessionGenerator() {
  const [selectedFrequency, setSelectedFrequency] = useState<string>("Abundance");
  const { canGenerate, reason, isLoading, generate, isGenerating } = useNeuralSession();

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const handleGenerate = async () => {
    console.log("Generate button clicked, selected frequency:", selectedFrequency);
    try {
      await generate(selectedFrequency as 'Confidence' | 'Opportunity' | 'Abundance' | 'Action');
    } catch (error) {
      console.error("Error generating neural track:", error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Neural Optimization</h2>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {canGenerate ? (
            <>
              <Select
                value={selectedFrequency}
                onValueChange={setSelectedFrequency}
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confidence">Confidence Frequency</SelectItem>
                  <SelectItem value="Opportunity">Opportunity Frequency</SelectItem>
                  <SelectItem value="Abundance">Abundance Frequency</SelectItem>
                  <SelectItem value="Action">Action Frequency</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full max-w-sm"
              >
                <Brain className="w-4 h-4 mr-2" />
                Generate Neural Track
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center">
              {reason || "Neural track generation unavailable"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
