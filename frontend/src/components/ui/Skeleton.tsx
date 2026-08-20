import '../../styles/ui/Skeleton.css';

type SkeletonVariant = 'text' | 'title' | 'image' | 'card' | 'avatar' | 'button';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton = ({ variant = 'text', width, height, className = '' }: SkeletonProps) => {
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return <div className={`skeleton skeleton--${variant} ${className}`.trim()} style={style} />;
};

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-card ${className}`.trim()}>
    <Skeleton variant="image" />
    <div className="skeleton-card__body">
      <Skeleton variant="title" width="70%" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="50%" />
      <Skeleton variant="button" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="skeleton-table">
    <div className="skeleton-table__header">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`h-${i}`} variant="text" width="80%" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="skeleton-table__row">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`c-${r}-${c}`} variant="text" width={c === 0 ? '60%' : '80%'} />
        ))}
      </div>
    ))}
  </div>
);
