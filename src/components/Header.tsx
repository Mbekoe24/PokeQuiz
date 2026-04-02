import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas-surface/90 backdrop-blur supports-[backdrop-filter]:bg-canvas-surface/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5 lg:px-8 xl:px-10">
        <Link
          to="/"
          className="min-h-[44px] min-w-[44px] text-base font-bold leading-10 tracking-tight text-brand transition hover:text-brand-hover sm:text-lg"
        >
          PokeQuiz
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
