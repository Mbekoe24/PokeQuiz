import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home';

vi.mock('../utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/api')>();
  return {
    ...actual,
    fetchRandomPokemonFact: vi.fn(() =>
      Promise.resolve({
        pokemonName: 'Bulbasaur',
        artworkUrl: '',
        text: 'Test fact for the home card.',
      }),
    ),
  };
});

function renderHome() {
  return render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<h1>Game route</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Home', () => {
  it('loads fact card without hitting the network', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    });
    expect(screen.getByText(/Test fact for the home card/)).toBeInTheDocument();
  });

  it('clicks generation, difficulty, and quiz mode buttons', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Gen II' }));
    expect(screen.getByText(/Gen II · .* rounds/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hard' }));
    expect(screen.getByText(/· 5s ·/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Type' }));
    expect(screen.getByText(/· type$/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cry' }));
    expect(screen.getByText(/· audio$/)).toBeInTheDocument();
  });

  it('toggles option checkboxes (hardcore, evolved, hints)', async () => {
    const user = userEvent.setup();
    renderHome();

    const hardcore = screen.getByRole('checkbox', { name: /hardcore/i });
    const evolved = screen.getByRole('checkbox', { name: /evolved only/i });
    const hints = screen.getByRole('checkbox', { name: /hints/i });

    expect(hardcore).not.toBeChecked();
    await user.click(hardcore);
    expect(hardcore).toBeChecked();

    await user.click(evolved);
    expect(evolved).toBeChecked();

    await user.click(hints);
    expect(hints).toBeChecked();
  });

  it('practice mode shows no timer in summary', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('checkbox', { name: /practice/i }));
    expect(screen.getByText(/rounds ·\s*No timer ·\s*name$/)).toBeInTheDocument();
  });

  it('start quiz navigates to /game', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /start quiz/i }));
    expect(await screen.findByRole('heading', { name: /game route/i })).toBeInTheDocument();
  });
});
