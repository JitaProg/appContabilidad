export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
  sort: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "supermercado",
    name: "Supermercado",
    emoji: "🛒",
    color: "#15803d",
    keywords: [
      "mercadona",
      "carrefour",
      "lidl",
      "aldi",
      "supermercado",
      "alcampo",
      "eroski",
      "consum",
      "spar",
      "supercor",
      "ahorramas",
      "gadis",
      "hipercor",
      "dia",
      "frutería",
      "fruteria",
      "carnicería",
      "carniceria",
      "panadería",
      "panaderia",
      "pescadería",
      "pescaderia",
    ],
    sort: 1,
  },
  {
    id: "restaurantes",
    name: "Restaurantes",
    emoji: "🍔",
    color: "#c2410c",
    keywords: [
      "restaurante",
      "cafetería",
      "cafeteria",
      "bar ",
      "burger",
      "mcdonald",
      "kfc",
      "telepizza",
      "domino",
      "pizzería",
      "pizzeria",
      "taberna",
      "mesón",
      "meson",
      "starbucks",
      "cervecería",
      "cerveceria",
      "heladería",
      "heladeria",
    ],
    sort: 2,
  },
  {
    id: "gasolina",
    name: "Gasolina",
    emoji: "⛽",
    color: "#1d4ed8",
    keywords: [
      "repsol",
      "cepsa",
      "shell",
      "galp",
      "ballenoil",
      "petroprix",
      "gasolinera",
      "estación de servicio",
      "estacion de servicio",
      "combustible",
      "gasóleo",
      "gasoleo",
    ],
    sort: 3,
  },
  {
    id: "transporte",
    name: "Transporte",
    emoji: "🚇",
    color: "#0e7490",
    keywords: [
      "renfe",
      "metro",
      "emt",
      "alsa",
      "uber",
      "cabify",
      "taxi",
      "autobús",
      "autobus",
      "parking",
      "aparcamiento",
      "peaje",
      "saba",
      "apark",
      "blablacar",
    ],
    sort: 4,
  },
  {
    id: "hogar",
    name: "Hogar",
    emoji: "🏠",
    color: "#7e22ce",
    keywords: [
      "ikea",
      "leroy merlin",
      "bricomart",
      "bricodepot",
      "ferretería",
      "ferreteria",
      "droguería",
      "drogueria",
      "muebles",
      "textil hogar",
    ],
    sort: 5,
  },
  {
    id: "salud",
    name: "Salud",
    emoji: "💊",
    color: "#b91c1c",
    keywords: [
      "farmacia",
      "parafarmacia",
      "clínica",
      "clinica",
      "dentista",
      "hospital",
      "sanitas",
      "adeslas",
      "óptica",
      "optica",
      "fisioterapia",
    ],
    sort: 6,
  },
  {
    id: "ocio",
    name: "Ocio",
    emoji: "🎬",
    color: "#be185d",
    keywords: [
      "cine",
      "cinesa",
      "yelmo",
      "teatro",
      "concierto",
      "steam",
      "playstation",
      "xbox",
      "museo",
      "parque de atracciones",
    ],
    sort: 7,
  },
  {
    id: "compras",
    name: "Compras",
    emoji: "🛍️",
    color: "#a21caf",
    keywords: [
      "zara",
      "primark",
      "decathlon",
      "media markt",
      "mediamarkt",
      "amazon",
      "el corte inglés",
      "el corte ingles",
      "h&m",
      "tienda",
      "librería",
      "libreria",
      "papelería",
      "papeleria",
    ],
    sort: 8,
  },
  {
    id: "suscripciones",
    name: "Suscripciones",
    emoji: "🔁",
    color: "#4338ca",
    keywords: [
      "netflix",
      "spotify",
      "hbo",
      "disney+",
      "prime video",
      "movistar",
      "vodafone",
      "orange",
      "yoigo",
      "digi",
      "suscripción",
      "suscripcion",
      "cuota",
    ],
    sort: 9,
  },
  {
    id: "otros",
    name: "Otros",
    emoji: "📦",
    color: "#64748b",
    keywords: [],
    sort: 10,
  },
];

export const FALLBACK_CATEGORY = "otros";

export function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function guessCategory(
  text: string,
  categories: Category[] = DEFAULT_CATEGORIES,
): string {
  if (!text) return FALLBACK_CATEGORY;
  const haystack = normalizeForMatch(text);

  let best: { id: string; length: number } | null = null;

  for (const category of categories) {
    for (const keyword of category.keywords) {
      const needle = normalizeForMatch(keyword).trim();
      if (!needle) continue;

      const matched =
        needle.length <= 4
          ? new RegExp(`\\b${escapeRegExp(needle)}\\b`).test(haystack)
          : haystack.includes(needle);

      if (matched && (!best || needle.length > best.length)) {
        best = { id: category.id, length: needle.length };
      }
    }
  }

  return best?.id ?? FALLBACK_CATEGORY;
}
