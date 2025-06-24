
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { checkForNewPeriod, archiveCurrentPeriod, markPeriodAsChecked } from "@/utils/periodManager";
import { formatPeriodRange } from "@/utils/monthlyPeriod";

interface NewPeriodPromptProps {
  onClose: () => void;
}

export const NewPeriodPrompt = ({ onClose }: NewPeriodPromptProps) => {
  const handleArchiveAndStart = () => {
    archiveCurrentPeriod();
    toast({
      title: "New period started! 🎉",
      description: "Previous expenses have been archived and your budget is ready for the new month.",
    });
    onClose();
  };

  const handleContinue = () => {
    markPeriodAsChecked();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-purple-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-lg text-gray-800 flex items-center justify-center gap-2">
            🗓️ New Budget Period Detected
          </CardTitle>
          <p className="text-sm text-gray-600">
            Current period: {formatPeriodRange()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 text-center">
            It looks like you're in a new budget period. Would you like to archive your previous expenses and start fresh?
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleArchiveAndStart} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Archive & Start New Period
            </Button>
            <Button 
              onClick={handleContinue} 
              variant="outline" 
              className="w-full"
            >
              Continue with Current Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
