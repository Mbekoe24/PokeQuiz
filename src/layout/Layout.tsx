import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function Layout() {
  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:px-5 sm:py-8 lg:max-w-3xl lg:px-8 lg:py-10 xl:px-10">
        <Outlet />
      </main>
    </div>
  );
}
