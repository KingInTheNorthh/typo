import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Audio } from './audio/AudioEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { PauseOverlay } from './components/overlays/PauseOverlay';
import { SettingsOverlay } from './components/overlays/SettingsOverlay';
import { AchievementsScreen } from './components/screens/AchievementsScreen';
import { CreditsScreen } from './components/screens/CreditsScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { HangarScreen } from './components/screens/HangarScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { MainMenu } from './components/screens/MainMenu';
import { StatsScreen } from './components/screens/StatsScreen';
import { WaveBanner } from './components/WaveBanner';
import { useGame } from './state/gameStore';
import { useSettings } from './state/settingsStore';

export default function App() {
  const screen = useGame((s) => s.screen);
  const reducedMotion = useSettings((s) => s.reducedMotion);

  // Browsers gate AudioContext behind a user gesture — unlock on the first one.
  useEffect(() => {
    const unlock = () => {
      Audio.init();
      const s = useSettings.getState();
      Audio.setVolumes(s.masterVolume, s.sfxVolume, s.musicVolume);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className={`relative h-full w-full overflow-hidden ${reducedMotion ? '' : 'scanlines'}`}>
      {screen === 'game' && (
        <>
          <GameCanvas />
          <HUD />
          <WaveBanner />
          <PauseOverlay />
        </>
      )}

      <AnimatePresence mode="wait">
        {screen === 'menu' && <MainMenu key="menu" />}
        {screen === 'gameover' && <GameOverScreen key="gameover" />}
        {screen === 'leaderboard' && <LeaderboardScreen key="leaderboard" />}
        {screen === 'stats' && <StatsScreen key="stats" />}
        {screen === 'hangar' && <HangarScreen key="hangar" />}
        {screen === 'achievements' && <AchievementsScreen key="achievements" />}
        {screen === 'credits' && <CreditsScreen key="credits" />}
      </AnimatePresence>

      <SettingsOverlay />
    </div>
  );
}
