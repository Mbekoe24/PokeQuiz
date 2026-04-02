import type { QuizMode, QuizQuestion } from '../types/game';

function getBaseUrl(): string {
  const raw =
    import.meta.env.VITE_POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2';
  return raw.replace(/\/+$/, '');
}

function getRequestInit(extra: RequestInit = {}): RequestInit {
  const key = import.meta.env.VITE_POKEAPI_API_KEY;
  const headers = new Headers(extra.headers);
  if (key) headers.set('Authorization', `Bearer ${key}`);
  return { ...extra, headers };
}

function formatName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const ALL_POKE_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
] as const;

interface PokeApiTypeSlot {
  slot: number;
  type: { name: string };
}

interface PokeApiPokemonJson {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites?: {
    other?: { 'official-artwork'?: { front_default?: string | null } };
    front_default?: string | null;
  };
  types: PokeApiTypeSlot[];
  cries?: { latest?: string; legacy?: string };
}

interface PokeApiSpeciesJson {
  names?: { language?: { name: string }; name: string }[];
  evolves_from_species: unknown | null;
}

export interface PokemonBrief {
  id: number;
  name: string;
  artworkUrl: string;
}

export interface PokemonFull extends PokemonBrief {
  types: string[];
  primaryType: string;
  cryUrl: string;
}

type PokemonFullWithDisplay = PokemonFull & { displayName?: string };

export async function fetchPokemonById(id: number): Promise<PokemonBrief> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/pokemon/${id}`, getRequestInit());
  if (!res.ok) throw new Error('Could not load Pokémon. Try again.');
  const data = (await res.json()) as PokeApiPokemonJson;
  const artworkUrl =
    data.sprites?.other?.['official-artwork']?.front_default ??
    data.sprites?.front_default ??
    '';

  return {
    id: data.id,
    name: formatName(data.name),
    artworkUrl,
  };
}

export async function fetchPokemonFull(id: number): Promise<PokemonFull> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/pokemon/${id}`, getRequestInit());
  if (!res.ok) throw new Error('Could not load Pokémon. Try again.');
  const data = (await res.json()) as PokeApiPokemonJson;
  const artworkUrl =
    data.sprites?.other?.['official-artwork']?.front_default ??
    data.sprites?.front_default ??
    '';
  const types = [...data.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => formatName(t.type.name));
  const cryUrl = data.cries?.latest ?? data.cries?.legacy ?? '';
  return {
    id: data.id,
    name: formatName(data.name),
    artworkUrl,
    types,
    primaryType: types[0] ?? 'Normal',
    cryUrl,
  };
}

async function fetchSpeciesExtras(
  id: number,
): Promise<{ japaneseName: string | null; evolvesFrom: boolean }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/pokemon-species/${id}`, getRequestInit());
  if (!res.ok) return { japaneseName: null, evolvesFrom: false };
  const s = (await res.json()) as PokeApiSpeciesJson;
  const japaneseName =
    s.names?.find((n) => n.language?.name === 'ja')?.name ?? null;
  const evolvesFrom = s.evolves_from_species != null;
  return { japaneseName, evolvesFrom };
}

interface PickPokemonArgs {
  min: number;
  max: number;
  randomIntFn: (min: number, max: number) => number;
  evolvedOnly: boolean;
  maxAttempts?: number;
}

async function pickPokemonId({
  min,
  max,
  randomIntFn: ri,
  evolvedOnly,
  maxAttempts = 48,
}: PickPokemonArgs): Promise<number> {
  for (let a = 0; a < maxAttempts; a += 1) {
    const id = ri(min, max);
    if (!evolvedOnly) return id;
    const { evolvesFrom } = await fetchSpeciesExtras(id);
    if (evolvesFrom) return id;
  }
  return ri(min, max);
}

async function attachJapaneseNames(mon: PokemonFull): Promise<PokemonFullWithDisplay> {
  const { japaneseName } = await fetchSpeciesExtras(mon.id);
  return {
    ...mon,
    displayName: japaneseName || mon.name,
  };
}

export interface BuildQuizQuestionArgs {
  min: number;
  max: number;
  randomIntFn: (min: number, max: number) => number;
  shuffleFn: <T>(arr: readonly T[]) => T[];
  mode: QuizMode;
  evolvedOnly: boolean;
  japaneseNames: boolean;
}

export async function buildQuizQuestion(opts: BuildQuizQuestionArgs): Promise<QuizQuestion> {
  const {
    min,
    max,
    randomIntFn: ri,
    shuffleFn: sh,
    mode,
    evolvedOnly,
    japaneseNames,
  } = opts;

  if (mode === 'type') {
    const targetId = await pickPokemonId({
      min,
      max,
      randomIntFn: ri,
      evolvedOnly,
    });
    const mon = await fetchPokemonFull(targetId);
    const correctType = mon.primaryType;
    const wrongPool = ALL_POKE_TYPES.filter((t) => t !== correctType);
    const wrong: string[] = [];
    const used = new Set<string>([correctType]);
    let guard = 0;
    while (wrong.length < 3 && guard < 100) {
      guard += 1;
      const t = wrongPool[ri(0, wrongPool.length - 1)]!;
      if (!used.has(t)) {
        used.add(t);
        wrong.push(t);
      }
    }
    while (wrong.length < 3) {
      const t = wrongPool.find((x) => !wrong.includes(x));
      if (t) wrong.push(t);
      else break;
    }
    const choices = sh([
      { id: `type:${correctType}`, name: correctType, isCorrect: true },
      ...wrong.map((name) => ({
        id: `type:${name}`,
        name,
        isCorrect: false,
      })),
    ]);
    return {
      kind: 'type',
      correctPokemonId: mon.id,
      correctName: mon.name,
      artworkUrl: mon.artworkUrl,
      cryUrl: mon.cryUrl,
      primaryType: correctType,
      choices,
    };
  }

  const targetId = await pickPokemonId({
    min,
    max,
    randomIntFn: ri,
    evolvedOnly,
  });
  // Wrong answers are always random species in-range (not the target). Requiring
  // "evolved only" on distractors starves the pool and can yield 1–2 choices only.
  const wrongIds: number[] = [];
  const usedIds = new Set<number>([targetId]);
  let guard = 0;
  while (wrongIds.length < 3 && guard < 400) {
    guard += 1;
    const id = ri(min, max);
    if (!usedIds.has(id)) {
      usedIds.add(id);
      wrongIds.push(id);
    }
  }
  if (wrongIds.length < 3) {
    for (let id = min; id <= max && wrongIds.length < 3; id += 1) {
      if (!usedIds.has(id)) {
        usedIds.add(id);
        wrongIds.push(id);
      }
    }
  }

  const ids = [targetId, ...wrongIds];
  const mons = await Promise.all(ids.map((pid) => fetchPokemonFull(pid)));
  let withDisplay: PokemonFullWithDisplay[] = mons;
  if (japaneseNames) {
    withDisplay = await Promise.all(mons.map((m) => attachJapaneseNames(m)));
  }

  const correct = withDisplay[0]!;
  const wrongMons = withDisplay.slice(1);
  const choices = sh([
    {
      id: correct.id,
      name: correct.displayName ?? correct.name,
      isCorrect: true,
    },
    ...wrongMons.map((p) => ({
      id: p.id,
      name: p.displayName ?? p.name,
      isCorrect: false,
    })),
  ]);

  const kind: QuizMode = mode === 'audio' ? 'audio' : 'name';

  return {
    kind,
    correctPokemonId: correct.id,
    correctName: correct.name,
    displayCorrectName: correct.displayName ?? correct.name,
    artworkUrl: correct.artworkUrl,
    cryUrl: correct.cryUrl,
    primaryType: correct.primaryType,
    choices,
  };
}

/** National dex upper bound for random trivia (gen IX). */
const NATIONAL_DEX_MAX = 1025;

interface PokeApiFlavorTextEntry {
  flavor_text: string;
  language: { name: string };
}

interface PokeApiSpeciesFlavorJson {
  flavor_text_entries?: PokeApiFlavorTextEntry[];
}

function cleanFlavorText(raw: string): string {
  return raw
    .replace(/\f/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickRandomElement<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export interface PokemonHomeFact {
  pokemonName: string;
  artworkUrl: string;
  text: string;
}

/** Random Pokédex-style line or measurement tidbit from the public API. */
export async function fetchRandomPokemonFact(): Promise<PokemonHomeFact | null> {
  const base = getBaseUrl();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const id = Math.floor(Math.random() * NATIONAL_DEX_MAX) + 1;
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${base}/pokemon/${id}`, getRequestInit()),
        fetch(`${base}/pokemon-species/${id}`, getRequestInit()),
      ]);
      if (!pRes.ok || !sRes.ok) continue;

      const p = (await pRes.json()) as PokeApiPokemonJson;
      const s = (await sRes.json()) as PokeApiSpeciesFlavorJson;

      const pokemonName = formatName(p.name);
      const artworkUrl =
        p.sprites?.other?.['official-artwork']?.front_default ??
        p.sprites?.front_default ??
        '';

      const enEntries = (s.flavor_text_entries ?? []).filter(
        (e) => e.language?.name === 'en',
      );
      const preferDex = Math.random() < 0.72;
      let text: string | undefined;

      if (preferDex && enEntries.length > 0) {
        const entry = pickRandomElement(enEntries);
        if (entry) text = cleanFlavorText(entry.flavor_text);
      }

      if (!text) {
        const m = p.height / 10;
        const kg = p.weight / 10;
        text = `${pokemonName} is about ${m.toFixed(1)} m tall and weighs roughly ${kg.toFixed(1)} kg—per the Pokédex.`;
      }

      return { pokemonName, artworkUrl, text };
    } catch {
      /* try another id */
    }
  }

  return null;
}
