import { useState } from 'preact/hooks';
import { playSound } from '../../platform/audio';
import { Bud, Floyd } from './art';
import type { Mood } from './art';
import type { Speaker } from '../../engine/types';

interface MascotProps {
  who: Speaker;
  size?: number;
  mood?: Mood;
}

/** A mascot you can tap: he wiggles and makes his own sound. */
export function Mascot({ who, size = 72, mood }: MascotProps) {
  const [wiggle, setWiggle] = useState(false);
  const name = who === 'floyd' ? 'Floyd' : 'Bud';

  function sayHi() {
    // Restart the wiggle even on a quick second tap.
    setWiggle(false);
    window.setTimeout(() => setWiggle(true), 0);
    window.setTimeout(() => setWiggle(false), 320);
    playSound(who === 'floyd' ? 'whirr' : 'bloop');
  }

  return (
    <button type="button" class="mascot-btn" aria-label={'Say hi to ' + name} onClick={sayHi}>
      {who === 'floyd' ? (
        <Floyd size={size} wiggle={wiggle} />
      ) : (
        <Bud size={size} wiggle={wiggle} mood={mood || 'idle'} />
      )}
    </button>
  );
}

/** Floyd and Bud side by side on one baseline. */
export function MascotPair({ size = 72, budMood }: { size?: number; budMood?: Mood }) {
  return (
    <div class="mascots">
      <Mascot who="floyd" size={size} />
      <Mascot who="bud" size={size} mood={budMood} />
    </div>
  );
}
