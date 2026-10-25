import { AMBER, BEIGE, NAVY, OUTLINE, WHITE, YELLOW } from './palette';

export type BudMood = 'idle' | 'happy' | 'sympathetic';

type BudProps = {
  size?: number;
  title?: string;
  wiggle?: boolean;
  mood?: BudMood;
};

// The light dot on Bud's stem. Navy circle when idle, yellow star after a
// right answer, amber heart after a miss. Each shape is centered on 0, 0 and
// sized to nearly fill the stem so the shape still reads at 48 px.
function MoodDot({ mood }: { mood: BudMood }) {
  if (mood === 'happy') {
    return (
      <path
        d="M0-6.2L1.58-2.18L5.9-1.92L2.57 0.83L3.64 5.02L0 2.7L-3.64 5.02L-2.57 0.83L-5.9-1.92L-1.58-2.18Z"
        fill={YELLOW}
      />
    );
  }
  if (mood === 'sympathetic') {
    return (
      <path
        d="M0 4.6C-6 0.5-5.6-4.6-2.65-4.6C-1.25-4.6-0.3-3.7 0-2.65C0.3-3.7 1.25-4.6 2.65-4.6C5.6-4.6 6 0.5 0 4.6Z"
        fill={AMBER}
      />
    );
  }
  return <circle r="4" fill={NAVY} stroke="none" />;
}

// Brows and mouth change with the mood too, so his face backs up the dot.
function Face({ mood }: { mood: BudMood }) {
  if (mood === 'happy') {
    return (
      <g fill="none">
        <path d="M27 37.5Q30.5 34 34 36.5M39 36Q42.5 33.5 46 36" />
        <path d="M32 51h9a4.5 4.5 0 0 1-9 0Z" fill={NAVY} />
      </g>
    );
  }
  if (mood === 'sympathetic') {
    return (
      <g fill="none">
        <path d="M27.5 39L34 36.5M39 36.5L45.5 39" />
        <path d="M33.5 53.5Q36.5 52 39.5 53.5" />
      </g>
    );
  }
  return (
    <g fill="none">
      <path d="M27 39Q30.5 35.5 34 37.5M39 37.5Q42.5 35 46 37" />
      <path d="M33 52Q36.5 54.5 40 52" />
    </g>
  );
}

// Bud is a wireless earbud: a rounded bud with a rubber ear tip and a stem
// that angles down from it. He leans toward Floyd and looks at him.
// The drawing is 96 units square and the end of his stem rests on y = 90,
// the same baseline Floyd uses. The lean pivots on that end so it stays put.
// The view box is cropped close to the drawing, with the same bottom edge as Floyd's.
export function Bud({ size = 96, title, wiggle = false, mood = 'idle' }: BudProps) {
  let className = 'art art-bud';
  if (wiggle) className += ' art-wiggle';

  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="6 22 70 70"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      {...OUTLINE}
    >
      {title && <title>{title}</title>}
      <g transform="rotate(-12 60 89)">
        {/* rubber ear tip on the back of the bud, with the speaker mesh at its end */}
        <g transform="rotate(-35 64 43)">
          <path d="M60 37H67A6 6 0 0 1 67 49H60Z" fill={BEIGE} />
          <rect x="69.5" y="40" width="3" height="6" rx="1.5" fill={NAVY} stroke="none" />
        </g>
        {/* bud and stem in one shape, like the side of a real earbud */}
        <path
          d="M52.5 81.5V68C52.5 65 49.5 65 45 65C32 65 24 58 24 50C24 41 32 36 44 36C57 36 67.5 41 67.5 51V81.5A7.5 7.5 0 0 1 52.5 81.5Z"
          fill={WHITE}
        />
        {/* metal cap on the end of the stem */}
        <path d="M52.5 82.5h15v-1a7.5 7.5 0 0 1-15 0Z" fill={NAVY} />
        {/* face, with eyes looking left toward Floyd */}
        <g transform="translate(1.5 5.5)">
          <circle cx="30.5" cy="44.5" r="3" fill={NAVY} stroke="none" />
          <circle cx="42" cy="44" r="3" fill={NAVY} stroke="none" />
          <Face mood={mood} />
        </g>
        {/* undo the lean so the mood shape sits upright */}
        <g transform="translate(60 73.5) rotate(12)">
          <MoodDot mood={mood} />
        </g>
      </g>
    </svg>
  );
}
