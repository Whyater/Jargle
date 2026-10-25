import { BEIGE, CREAM, NAVY, OUTLINE, WHITE } from './palette';

type FloydProps = {
  size?: number;
  title?: string;
  wiggle?: boolean;
};

// Floyd is a 3.5 inch floppy disk. His label is his face: closed, content
// eyes and reading glasses low on his nose. The drawing is 96 units square
// and his feet rest on y = 90, the same baseline Bud uses. The view box is cropped
// close to the drawing (bottom edge y = 92, same as Bud's) so the size prop is close
// to how big he looks.
export function Floyd({ size = 96, title, wiggle = false }: FloydProps) {
  let className = 'art art-floyd';
  if (wiggle) className += ' art-wiggle';

  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="10 16 76 76"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      {...OUTLINE}
    >
      {title && <title>{title}</title>}
      {/* feet */}
      <path d="M25 87.5h9M62 87.5h9" stroke-width="5" />
      {/* disk body with the cut corner */}
      <path d="M18 18H74L82 26V82Q82 86 78 86H18Q14 86 14 82V22Q14 18 18 18Z" fill={NAVY} />
      {/* metal shutter */}
      <rect x="30" y="18" width="34" height="24" rx="1.5" fill={BEIGE} />
      <rect x="49" y="23" width="9" height="14" rx="1" fill={NAVY} stroke="none" />
      {/* label */}
      <rect x="21" y="47" width="54" height="35" rx="3" fill={CREAM} />
      {/* face */}
      <g fill="none">
        <path d="M33.5 59Q38 55.5 42.5 59M53.5 59Q58 55.5 62.5 59" />
        <path d="M31 53.5Q36 50.5 42 52.5M54 52.5Q60 50.5 65 53.5" stroke-width="2.5" />
        <path
          d="M31 63.5H45V65.5Q45 70 38 70Q31 70 31 65.5ZM51 63.5H65V65.5Q65 70 58 70Q51 70 51 65.5Z"
          fill={WHITE}
        />
        <path d="M45 64.5Q48 62.5 51 64.5" />
        <path d="M42 75.5Q48 79.5 54 75.5" />
      </g>
    </svg>
  );
}
