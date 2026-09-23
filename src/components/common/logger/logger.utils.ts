export const getCurrentTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace("T", " ").split(".")[0];
};

export const getEpochTime = (epoch?: number): number => epoch ?? Date.now();
