export function normalizePokemonNameGuess(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function pokemonNamesMatch(guess: string, canonical: string): boolean {
  return normalizePokemonNameGuess(guess) === normalizePokemonNameGuess(canonical);
}
