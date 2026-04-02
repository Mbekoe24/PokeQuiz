interface QuestionCardProps {
  artworkUrl: string;
  revealed: boolean;
  name: string;
  useSilhouette?: boolean;
}

export default function QuestionCard({
  artworkUrl,
  revealed,
  name,
  useSilhouette = true,
}: QuestionCardProps) {
  const showSilhouette = useSilhouette && !revealed;

  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-line bg-canvas-well p-6 shadow-inner transition-all duration-300 motion-reduce:transition-none">
      {artworkUrl ? (
        <img
          src={artworkUrl}
          alt={revealed ? name : 'Mystery Pokémon silhouette'}
          className={`max-h-56 w-auto object-contain transition-[filter] duration-300 motion-reduce:duration-75 ${
            showSilhouette ? 'brightness-0' : ''
          }`}
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
      ) : (
        <p className="text-ink-muted">No image for this Pokémon.</p>
      )}
    </div>
  );
}
