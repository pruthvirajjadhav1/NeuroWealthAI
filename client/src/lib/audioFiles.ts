import { FREQUENCY_TYPES } from "@/components/FrequencySelector";

// Define available frequencies and their corresponding index ranges
const frequencyRanges = {
  confidence: [1, 3],
  opportunity: [4, 6],
  abundance: [7, 9],
  intuition: [10, 12],
  decision: [13, 15],
  action: [16, 18]
};

// Keep track of recently played audio files to avoid repetition
const recentlyPlayedAudio = new Set<string>();

const MAX_RECENT_TRACKS = 3; // Don't repeat a track until at least 3 others have played

export function getRandomAudioForType(frequencyType: string): string {
  // Get the range for this frequency type
  const range = frequencyRanges[frequencyType as keyof typeof frequencyRanges];
  if (!range) {
    console.error('Invalid frequency type:', frequencyType);
    throw new Error(`Invalid frequency type: ${frequencyType}`);
  }

  // Generate all possible track numbers for this frequency
  const [min, max] = range;
  const possibleTracks = Array.from(
    { length: max - min + 1 },
    (_, i) => `/api/audio/track?index=${min + i}`
  );

  // Filter out recently played tracks
  const availableTracks = possibleTracks.filter(track => !recentlyPlayedAudio.has(track));

  // If all tracks have been played recently, clear history and use all tracks
  if (availableTracks.length === 0) {
    console.log('All tracks played recently, resetting history');
    recentlyPlayedAudio.clear();
    const randomIndex = Math.floor(Math.random() * possibleTracks.length);
    const selectedTrack = possibleTracks[randomIndex];
    recentlyPlayedAudio.add(selectedTrack);
    return selectedTrack;
  }

  // Select a random track from available ones
  const randomIndex = Math.floor(Math.random() * availableTracks.length);
  const selectedTrack = availableTracks[randomIndex];

  // Update recently played tracks
  recentlyPlayedAudio.add(selectedTrack);
  if (recentlyPlayedAudio.size > MAX_RECENT_TRACKS) {
    const oldestTrack = Array.from(recentlyPlayedAudio)[0];
    recentlyPlayedAudio.delete(oldestTrack);
  }

  console.log('Selected audio track:', {
    frequencyType,
    selectedTrack,
    recentlyPlayed: Array.from(recentlyPlayedAudio)
  });

  return selectedTrack;
}

// Function to preload audio files
export function preloadAudioFiles(): void {
  // Preload first 5 files to reduce initial load time
  audioFiles.slice(0, 5).forEach(audioFile => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioFile;
  });
}
