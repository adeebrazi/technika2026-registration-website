import eventsData from '../data/events.json';

export interface EventDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  date?: string;
  time?: string;
  venue?: string;
  prizePool?: string;
  coordinator?: string;
  minMembers?: number;
  maxMembers?: number;
  rules_list?: string[];
  rounds_list?: string[];
  criteria_list?: string[];
  objective?: string;
}

const EXTRA_PHOTOS = [
  "/021A0059.webp",
  "/021A0104.webp",
  "/021A0129.webp",
  "/021A0140.webp",
  "/021A0164.webp",
  "/021A0239.webp",
  "/021A0262.webp",
  "/021A9976.webp",
];

const ID_ALIAS_MAP: Record<string, string> = {
  "cod001": "code-busters",
  "web001": "web-wizard",
  "robo01": "robo-wars",
  "robo02": "robo-race",
  "robo03": "robo-pick-n-place",
  "bgmi01": "bgmi",
  "red001": "red-tech",
  "cad001": "circuit-crafter",
  "val001": "ai-quizathon",
  "fifa01": "need-for-speed",
  "dance01": "group-dance",
  "music01": "group-singing",
  "art001": "art-attack"
};

const ALL_EVENT_PHOTOS: Record<string, string> = {
  // Backend DB Event IDs
  "cod001": "/code-buster.webp",
  "web001": "/web-wizard.webp",
  "robo01": "/robo-wars.webp",
  "robo02": "/robo-race.webp",
  "robo03": "/robo-pick-n-place.webp",
  "bgmi01": "/bgmi.webp",
  "red001": "/red-tech.webp",
  "cad001": "/circuit-crafter.webp",
  "val001": "/ai-quizathon.webp",
  "fifa01": "/need-for-speed.webp",
  "dance01": "/group-dance.webp",
  "music01": "/group-singing.webp",
  "art001": "/art-attack.webp",

  // Slugs
  "code-busters": "/code-buster.webp",
  "code-buster": "/code-buster.webp",
  "red-tech": "/red-tech.webp",
  "web-wizard": "/web-wizard.webp",
  "robo-wars": "/robo-wars.webp",
  "robo-race": "/robo-race.webp",
  "robo-pick-n-place": "/robo-pick-n-place.webp",
  "intelliquest": "/intelliquest.webp",
  "brainstorm-battle": "/brainstorm-battle.webp",
  "circuit-crafter": "/circuit-crafter.webp",
  "electrofix-challenge": "/electrofix-challenge.webp",
  "junkyard-wars": "/junkyard-wars.webp",
  "ai-quizathon": "/ai-quizathon.webp",
  "ai-quizzathon": "/ai-quizathon.webp",
  "ecoai-challenge": "/ecoai-challenge.webp",
  "project-model-exhibition": "/project-model-exhibition.webp",
  "coding-ladder": "/coding-ladder.webp",
  "cyber-shield": "/cyber-shield.webp",
  "app-attack": "/app-attack.webp",
  "data-dash": "/data-dash.webp",
  "design-dash": "/design-dash.webp",
  "load-bridging": "/load-bridging.webp",
  "poster-presentation": "/poster-presentation.webp",
  "face-painting": "/face-painting.webp",
  "pot-painting": "/pot-painting.webp",
  "photography": "/photography.webp",
  "greenearth-challenge": "/greenearth-challenge.webp",
  "cricket": "/cricket.webp",
  "need-for-speed": "/need-for-speed.webp",
  "bgmi": "/bgmi.webp",
  "free-fire": "/free-fire.webp",
  "technical-debate": "/technical-debate.webp",
  "group-ramp-walk": "/group-ramp-walk.webp",
  "solo-ramp-walk": "/solo-ramp-walk.webp",
  "treasure-hunt": "/treasure-hunt.webp",
  "tug-of-war": "/tug-of-war.webp",
  "sudoku": "/sudoku.webp",
  "fire-free-cooking": "/fire-free-cooking.webp",
  "solo-singing": "/solo-singing.webp",
  "solo-dance": "/solo-dance.webp",
  "group-singing": "/group-singing.webp",
  "group-dance": "/group-dance.webp",
  "rap": "/rap.webp",
  "beat-boxing": "/beat-boxing.webp",
  "poetry": "/poetry.webp",
  "story-telling": "/story-telling.webp",
  "art-attack": "/art-attack.webp",
  "paint-ball": "/021A0059.webp",
  "night-show": "/021A9976.webp",

  // Normalized Title Fallbacks
  "codebuster": "/code-buster.webp",
  "redtech": "/red-tech.webp",
  "robowars": "/robo-wars.webp",
  "roborace": "/robo-race.webp",
  "robopicknplace": "/robo-pick-n-place.webp",
  "robopickplace": "/robo-pick-n-place.webp",
  "brainstormbattle": "/brainstorm-battle.webp",
  "circuitcrafter": "/circuit-crafter.webp",
  "electrofixchallenge": "/electrofix-challenge.webp",
  "junkyardwars": "/junkyard-wars.webp",
  "aiquizathon": "/ai-quizathon.webp",
  "ecoaichallenge": "/ecoai-challenge.webp",
  "projectmodelexhibition": "/project-model-exhibition.webp",
  "codingladder": "/coding-ladder.webp",
  "webwizard": "/web-wizard.webp",
  "cybershield": "/cyber-shield.webp",
  "appattack": "/app-attack.webp",
  "datadash": "/data-dash.webp",
  "designdash": "/design-dash.webp",
  "loadbridging": "/load-bridging.webp",
  "posterpresentation": "/poster-presentation.webp",
  "facepainting": "/face-painting.webp",
  "potpainting": "/pot-painting.webp",
  "greenearthchallenge": "/greenearth-challenge.webp",
  "needforspeed": "/need-for-speed.webp",
  "bgmibattlegroundmobileindia": "/bgmi.webp",
  "battlegroundmobileindia": "/bgmi.webp",
  "freefire": "/free-fire.webp",
  "technicaldebate": "/technical-debate.webp",
  "grouprampwalk": "/group-ramp-walk.webp",
  "solorampwalk": "/solo-ramp-walk.webp",
  "treasurehunt": "/treasure-hunt.webp",
  "tugofwar": "/tug-of-war.webp",
  "firefreecooking": "/fire-free-cooking.webp",
  "solosinging": "/solo-singing.webp",
  "solodance": "/solo-dance.webp",
  "groupsinging": "/group-singing.webp",
  "groupdance": "/group-dance.webp",
  "beatboxing": "/beat-boxing.webp",
  "storytelling": "/story-telling.webp",
  "artattack": "/art-attack.webp"
};

export function getEventDetails(idOrName: string): EventDetail | null {
  if (!idOrName) return null;
  const raw = String(idOrName).toLowerCase().trim();
  const targetId = ID_ALIAS_MAP[raw] || raw;
  const target = targetId.replace(/[^a-z0-9]/g, '');
  
  const match = (eventsData as EventDetail[]).find(e => {
    const eId = e.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const eTitle = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return eId === target || eTitle === target || target.includes(eId) || eId.includes(target) || target.includes(eTitle) || eTitle.includes(target);
  });

  return match || null;
}

export function getEventPhoto(idOrName: string, index: number = 0): string {
  if (!idOrName) return EXTRA_PHOTOS[index % EXTRA_PHOTOS.length];
  
  const rawLower = String(idOrName).toLowerCase().trim();
  if (ALL_EVENT_PHOTOS[rawLower]) return ALL_EVENT_PHOTOS[rawLower];

  const norm = rawLower.replace(/[^a-z0-9]/g, '');
  if (ALL_EVENT_PHOTOS[norm]) return ALL_EVENT_PHOTOS[norm];

  // Try finding in eventsData by title or id
  const detail = getEventDetails(idOrName);
  if (detail) {
    if (ALL_EVENT_PHOTOS[detail.id]) return ALL_EVENT_PHOTOS[detail.id];
    const detailNorm = detail.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ALL_EVENT_PHOTOS[detailNorm]) return ALL_EVENT_PHOTOS[detailNorm];
  }

  return EXTRA_PHOTOS[index % EXTRA_PHOTOS.length];
}
