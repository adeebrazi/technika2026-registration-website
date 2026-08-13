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
  "/021A0059.JPG",
  "/021A0104.JPG",
  "/021A0129.JPG",
  "/021A0140.JPG",
  "/021A0164.JPG",
  "/021A0239.JPG",
  "/021A0262.JPG",
  "/021A9976.JPG",
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
  "cod001": "/code-buster.jpg",
  "web001": "/web-wizard.jpg",
  "robo01": "/robo-wars.jpg",
  "robo02": "/robo-race.jpg",
  "robo03": "/robo-pick-n-place.jpg",
  "bgmi01": "/bgmi.png",
  "red001": "/red-tech.jpg",
  "cad001": "/circuit-crafter.jpg",
  "val001": "/ai-quizathon.jpg",
  "fifa01": "/need-for-speed.png",
  "dance01": "/group-dance.png",
  "music01": "/group-singing.png",
  "art001": "/art-attack.png",

  // Slugs
  "code-busters": "/code-buster.jpg",
  "code-buster": "/code-buster.jpg",
  "red-tech": "/red-tech.jpg",
  "web-wizard": "/web-wizard.jpg",
  "robo-wars": "/robo-wars.jpg",
  "robo-race": "/robo-race.jpg",
  "robo-pick-n-place": "/robo-pick-n-place.jpg",
  "intelliquest": "/intelliquest.jpg",
  "brainstorm-battle": "/brainstorm-battle.jpg",
  "circuit-crafter": "/circuit-crafter.jpg",
  "electrofix-challenge": "/electrofix-challenge.jpg",
  "junkyard-wars": "/junkyard-wars.jpg",
  "ai-quizathon": "/ai-quizathon.jpg",
  "ai-quizzathon": "/ai-quizathon.jpg",
  "ecoai-challenge": "/ecoai-challenge.jpg",
  "project-model-exhibition": "/project-model-exhibition.jpg",
  "coding-ladder": "/coding-ladder.jpg",
  "cyber-shield": "/cyber-shield.jpg",
  "app-attack": "/app-attack.jpg",
  "data-dash": "/data-dash.jpg",
  "design-dash": "/design-dash.jpg",
  "load-bridging": "/load-bridging.png",
  "poster-presentation": "/poster-presentation.png",
  "face-painting": "/face-painting.png",
  "pot-painting": "/pot-painting.png",
  "photography": "/photography.png",
  "greenearth-challenge": "/greenearth-challenge.png",
  "cricket": "/cricket.png",
  "need-for-speed": "/need-for-speed.png",
  "bgmi": "/bgmi.png",
  "free-fire": "/free-fire.png",
  "technical-debate": "/technical-debate.png",
  "group-ramp-walk": "/group-ramp-walk.png",
  "solo-ramp-walk": "/solo-ramp-walk.png",
  "treasure-hunt": "/treasure-hunt.png",
  "tug-of-war": "/tug-of-war.png",
  "sudoku": "/sudoku.png",
  "fire-free-cooking": "/fire-free-cooking.png",
  "solo-singing": "/solo-singing.jpg",
  "solo-dance": "/solo-dance.jpg",
  "group-singing": "/group-singing.png",
  "group-dance": "/group-dance.png",
  "rap": "/rap.png",
  "beat-boxing": "/beat-boxing.png",
  "poetry": "/poetry.png",
  "story-telling": "/story-telling.png",
  "art-attack": "/art-attack.png",
  "paint-ball": "/021A0059.JPG",
  "night-show": "/021A9976.JPG",

  // Normalized Title Fallbacks
  "codebuster": "/code-buster.jpg",
  "redtech": "/red-tech.jpg",
  "robowars": "/robo-wars.jpg",
  "roborace": "/robo-race.jpg",
  "robopicknplace": "/robo-pick-n-place.jpg",
  "robopickplace": "/robo-pick-n-place.jpg",
  "brainstormbattle": "/brainstorm-battle.jpg",
  "circuitcrafter": "/circuit-crafter.jpg",
  "electrofixchallenge": "/electrofix-challenge.jpg",
  "junkyardwars": "/junkyard-wars.jpg",
  "aiquizathon": "/ai-quizathon.jpg",
  "ecoaichallenge": "/ecoai-challenge.jpg",
  "projectmodelexhibition": "/project-model-exhibition.jpg",
  "codingladder": "/coding-ladder.jpg",
  "webwizard": "/web-wizard.jpg",
  "cybershield": "/cyber-shield.jpg",
  "appattack": "/app-attack.jpg",
  "datadash": "/data-dash.jpg",
  "designdash": "/design-dash.jpg",
  "loadbridging": "/load-bridging.png",
  "posterpresentation": "/poster-presentation.png",
  "facepainting": "/face-painting.png",
  "potpainting": "/pot-painting.png",
  "greenearthchallenge": "/greenearth-challenge.png",
  "needforspeed": "/need-for-speed.png",
  "bgmibattlegroundmobileindia": "/bgmi.png",
  "battlegroundmobileindia": "/bgmi.png",
  "freefire": "/free-fire.png",
  "technicaldebate": "/technical-debate.png",
  "grouprampwalk": "/group-ramp-walk.png",
  "solorampwalk": "/solo-ramp-walk.png",
  "treasurehunt": "/treasure-hunt.png",
  "tugofwar": "/tug-of-war.png",
  "firefreecooking": "/fire-free-cooking.png",
  "solosinging": "/solo-singing.jpg",
  "solodance": "/solo-dance.jpg",
  "groupsinging": "/group-singing.png",
  "groupdance": "/group-dance.png",
  "beatboxing": "/beat-boxing.png",
  "storytelling": "/story-telling.png",
  "artattack": "/art-attack.png"
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
