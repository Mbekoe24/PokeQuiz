import { describe, expect, it } from 'vitest';
import { normalizePokemonNameGuess, pokemonNamesMatch } from '.';

describe('normalizePokemonNameGuess', () => {
  it('trims, lowercases, collapses spaces', () => {
    expect(normalizePokemonNameGuess('  Pikachu  ')).toBe('pikachu');
    expect(normalizePokemonNameGuess('Mr   Mime')).toBe('mr mime');
  });
});

describe('pokemonNamesMatch', () => {
  it('ignores case and extra spaces', () => {
    expect(pokemonNamesMatch('PIKACHU', 'Pikachu')).toBe(true);
    expect(pokemonNamesMatch('farfetch d', "Farfetch'd")).toBe(false);
  });
});
