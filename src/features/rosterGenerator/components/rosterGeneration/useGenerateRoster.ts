import { useCallback, useState } from "react";

export function useGenerateRoster() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Roster generation API is not wired up yet; this is the integration point for it.
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generate };
}
