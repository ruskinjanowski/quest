import type { QuestColorKey } from "@/lib/quest-colors";

/**
 * ⚠️ STUB — PRODUCT_PLAN 2.1, extended. Every person and number below is
 * invented and lives in this file only.
 *
 * The bet this makes tangible: the unit of connection in Quest is *hours on a
 * quest*, not followers or posts. Nobody else can say "187 people are shipping
 * a side project, typically 6h a week" because nobody else measures the split.
 * That is why a bucket leads with hours and a profile leads with a rhythm.
 *
 * Two rules the data itself encodes, so a real implementation inherits them:
 *
 * 1. **Not a leaderboard.** `typicalHoursWeek` is bucket context, never a rank.
 *    People are ordered by recent activity — see `discover/domain.ts`.
 * 2. **Buckets group intent, not wording.** Every member phrases the quest
 *    their own way (`phrasing`); the bucket name is the canonical form that
 *    2.3's autocomplete would resolve to.
 *
 * Replacing this means swapping `data.ts` for real queries. Nothing outside
 * `features/discover` reads it.
 */

export type SocialLink = {
  platform: string;
  handle: string;
};

export type SharedQuestMember = {
  id: string;
  name: string;
  location: string;
  /** Their own name for the quest — the bucket is the canonical form. */
  phrasing: string;
  /** Their rhythm, the number this product is uniquely able to show. */
  hoursPerWeek: number;
  /** How long they've been at it, in their own words. */
  since: string;
  nextTask: string;
  note: string;
  links: SocialLink[];
};

export type SharedQuestBucket = {
  slug: string;
  name: string;
  color: QuestColorKey;
  /** Everyone who has made this quest public. */
  members: number;
  /** Typical weekly hours across the bucket. Context, never a ranking. */
  typicalHoursWeek: number;
  /** What else people here are working on — the lateral way in. */
  alsoPursue: { name: string; members: number }[];
  /** The public ones, in recent-activity order. */
  people: SharedQuestMember[];
  /**
   * Phrasings that resolve onto this bucket. Stands in for the embedding
   * similarity the real thing would use (PRODUCT_PLAN 2.3).
   */
  aliases: string[];
};

export const SHARED_QUEST_BUCKETS: readonly SharedQuestBucket[] = [
  {
    slug: "learn-a-language",
    name: "Learn a language",
    color: "teal",
    members: 412,
    typicalHoursWeek: 3.5,
    aliases: [
      "learn a language",
      "learn spanish",
      "spanish",
      "french",
      "japanese",
      "german",
      "italian",
      "language",
      "fluency",
    ],
    alsoPursue: [
      { name: "Read more books", members: 96 },
      { name: "Travel somewhere new", members: 71 },
      { name: "Write in public", members: 38 },
    ],
    people: [
      {
        id: "lang-1",
        name: "Marta Oyelaran",
        location: "Lisbon",
        phrasing: "Hold a 30-minute conversation in Spanish",
        hoursPerWeek: 4.2,
        since: "January 2026",
        nextTask: "Conversation exchange — Tuesday",
        note: "Two evenings of grammar, one call with a real person. The call is the only part that actually moves.",
        links: [
          { platform: "X", handle: "@martao" },
          { platform: "Instagram", handle: "@marta.learns" },
        ],
      },
      {
        id: "lang-2",
        name: "Devin Kaur",
        location: "Manchester",
        phrasing: "Spanish before the Seville trip",
        hoursPerWeek: 2.8,
        since: "March 2026",
        nextTask: "Finish unit 12",
        note: "Deadline-driven and not ashamed of it. Booked the flight first, started studying second.",
        links: [{ platform: "LinkedIn", handle: "devin-kaur" }],
      },
      {
        id: "lang-3",
        name: "Yuki Almeida",
        location: "São Paulo",
        phrasing: "Japanese — N4 by December",
        hoursPerWeek: 6.1,
        since: "August 2025",
        nextTask: "Kanji review, 40 cards",
        note: "A year in. The hours chart is the only reason I can tell that the plateau months were still working.",
        links: [
          { platform: "YouTube", handle: "@yuki.studies" },
          { platform: "X", handle: "@yukialmeida" },
        ],
      },
      {
        id: "lang-4",
        name: "Tomas Brandt",
        location: "Berlin",
        phrasing: "Actually speak French, not just read it",
        hoursPerWeek: 1.9,
        since: "May 2026",
        nextTask: "Podcast episode + shadowing",
        note: "Low hours on purpose. Two focused sessions beat the seven I kept failing to do.",
        links: [{ platform: "Instagram", handle: "@tb.speaks" }],
      },
      {
        id: "lang-5",
        name: "Nour Haddad",
        location: "Amman",
        phrasing: "Spanish with my daughter",
        hoursPerWeek: 3.3,
        since: "February 2026",
        nextTask: "Cook from the Spanish recipe book",
        note: "Every session is with a seven-year-old, so it is all games and cooking. It counts.",
        links: [],
      },
    ],
  },
  {
    slug: "ship-a-side-project",
    name: "Ship a side project",
    color: "violet",
    members: 187,
    typicalHoursWeek: 6.2,
    aliases: [
      "ship a side project",
      "ship side project",
      "side project",
      "launch",
      "indie",
      "build an app",
      "saas",
      "startup",
    ],
    alsoPursue: [
      { name: "Write in public", members: 64 },
      { name: "Learn a language", members: 29 },
      { name: "Run a half marathon", members: 24 },
    ],
    people: [
      {
        id: "ship-1",
        name: "Priya Raman",
        location: "Bengaluru",
        phrasing: "Launch the invoicing tool",
        hoursPerWeek: 8.4,
        since: "November 2025",
        nextTask: "Reply to the beta feedback thread",
        note: "Nights and Sunday mornings. The Sunday morning is worth three of the nights.",
        links: [
          { platform: "X", handle: "@priyabuilds" },
          { platform: "LinkedIn", handle: "priya-raman" },
        ],
      },
      {
        id: "ship-2",
        name: "Callum Reyes",
        location: "Austin",
        phrasing: "Get the plugin to 100 paying users",
        hoursPerWeek: 5.5,
        since: "June 2025",
        nextTask: "Pricing page rewrite",
        note: "Shipped a year ago, still here. The quest changed from build to sell and the hours barely moved.",
        links: [{ platform: "X", handle: "@callumships" }],
      },
      {
        id: "ship-3",
        name: "Ines Novak",
        location: "Ljubljana",
        phrasing: "Weekend game jam project → real game",
        hoursPerWeek: 11.2,
        since: "April 2026",
        nextTask: "Level 3 blockout",
        note: "Unsustainable and I know it. Watching the admin bar shrink is the only thing keeping me honest.",
        links: [
          { platform: "YouTube", handle: "@inesmakesgames" },
          { platform: "Instagram", handle: "@ines.novak" },
        ],
      },
      {
        id: "ship-4",
        name: "Adaeze Mbeki",
        location: "Lagos",
        phrasing: "Ship the recipe app before December",
        hoursPerWeek: 3.1,
        since: "July 2026",
        nextTask: "Set up the database",
        note: "Full-time job, small kid, three hours a week. Slow is still shipping.",
        links: [{ platform: "LinkedIn", handle: "adaeze-mbeki" }],
      },
      {
        id: "ship-5",
        name: "Ravi Lindqvist",
        location: "Stockholm",
        phrasing: "Open-source the CLI properly",
        hoursPerWeek: 4.7,
        since: "February 2026",
        nextTask: "Write the contributing guide",
        note: "Most of the work turned out to be documentation, which nobody warns you about.",
        links: [{ platform: "X", handle: "@ravilind" }],
      },
      {
        id: "ship-6",
        name: "Sofia Bianchi",
        location: "Milan",
        phrasing: "Turn the newsletter into a product",
        hoursPerWeek: 6.8,
        since: "September 2025",
        nextTask: "Interview three subscribers",
        note: "Half of my quest hours are conversations. It felt like cheating until the churn dropped.",
        links: [
          { platform: "Instagram", handle: "@sofia.writes" },
          { platform: "LinkedIn", handle: "sofia-bianchi" },
        ],
      },
    ],
  },
  {
    slug: "get-strong",
    name: "Get strong",
    color: "orange",
    members: 264,
    typicalHoursWeek: 4.4,
    aliases: [
      "get strong",
      "strength",
      "gym",
      "lift",
      "lifting",
      "fitness",
      "get fit",
      "training",
    ],
    alsoPursue: [
      { name: "Run a half marathon", members: 88 },
      { name: "Cook properly at home", members: 52 },
      { name: "Sleep before midnight", members: 41 },
    ],
    people: [
      {
        id: "strong-1",
        name: "Jonah Weiss",
        location: "Toronto",
        phrasing: "Squat bodyweight ×2",
        hoursPerWeek: 5.0,
        since: "October 2025",
        nextTask: "Gym — push day",
        note: "Four sessions, 75 minutes each, same three lifts. Boring on purpose.",
        links: [{ platform: "Instagram", handle: "@jonah.lifts" }],
      },
      {
        id: "strong-2",
        name: "Amara Osei",
        location: "Accra",
        phrasing: "Back to full strength after the injury",
        hoursPerWeek: 2.6,
        since: "April 2026",
        nextTask: "Physio exercises",
        note: "Rehab hours count as quest hours. That reframe is the only reason I kept going.",
        links: [],
      },
      {
        id: "strong-3",
        name: "Lukas Fenn",
        location: "Vienna",
        phrasing: "Climb V6 by summer",
        hoursPerWeek: 6.3,
        since: "January 2026",
        nextTask: "Bouldering session",
        note: "Two climbing nights plus one deeply unglamorous hangboard session.",
        links: [
          { platform: "YouTube", handle: "@lukasclimbs" },
          { platform: "X", handle: "@lfenn" },
        ],
      },
      {
        id: "strong-4",
        name: "Grace Kimani",
        location: "Nairobi",
        phrasing: "Strength train twice a week, every week",
        hoursPerWeek: 2.2,
        since: "March 2026",
        nextTask: "Lower body — Thursday",
        note: "The quest is the consistency, not the number. Two is the whole target.",
        links: [{ platform: "Instagram", handle: "@grace.k" }],
      },
      {
        id: "strong-5",
        name: "Hendrik Louw",
        location: "Cape Town",
        phrasing: "Deadlift 200kg before I turn 40",
        hoursPerWeek: 4.9,
        since: "December 2025",
        nextTask: "Heavy singles",
        note: "Eleven months left. The trend chart is genuinely stressful and genuinely useful.",
        links: [{ platform: "LinkedIn", handle: "hendrik-louw" }],
      },
    ],
  },
  {
    slug: "read-more-books",
    name: "Read more books",
    color: "blue",
    members: 318,
    typicalHoursWeek: 2.8,
    aliases: ["read more books", "read", "reading", "books", "book a week"],
    alsoPursue: [
      { name: "Write in public", members: 74 },
      { name: "Learn a language", members: 96 },
      { name: "Sleep before midnight", members: 33 },
    ],
    people: [
      {
        id: "read-1",
        name: "Elena Sarkisian",
        location: "Yerevan",
        phrasing: "24 books this year",
        hoursPerWeek: 3.6,
        since: "January 2026",
        nextTask: "Finish chapter 9",
        note: "Fourteen down. The gap between what I planned to read and what I read is the interesting number.",
        links: [{ platform: "X", handle: "@elenareads" }],
      },
      {
        id: "read-2",
        name: "Ben Achterberg",
        location: "Rotterdam",
        phrasing: "Read a book a month, properly",
        hoursPerWeek: 1.7,
        since: "February 2026",
        nextTask: "Evening reading, 30 min",
        note: "Swapped the phone for a book after dinner. That is the entire system.",
        links: [],
      },
      {
        id: "read-3",
        name: "Mei Tanaka",
        location: "Osaka",
        phrasing: "Work through the philosophy reading list",
        hoursPerWeek: 4.1,
        since: "August 2025",
        nextTask: "Notes on the Aristotle chapter",
        note: "Reading without note-taking never stuck, so half these hours are writing.",
        links: [{ platform: "Instagram", handle: "@mei.reads" }],
      },
    ],
  },
  {
    slug: "run-a-half-marathon",
    name: "Run a half marathon",
    color: "green",
    members: 204,
    typicalHoursWeek: 3.9,
    aliases: ["run a half marathon", "half marathon", "marathon", "run", "running", "10k"],
    alsoPursue: [
      { name: "Get strong", members: 88 },
      { name: "Sleep before midnight", members: 47 },
      { name: "Cook properly at home", members: 29 },
    ],
    people: [
      {
        id: "run-1",
        name: "Fiona Delacroix",
        location: "Montréal",
        phrasing: "Half marathon in under two hours",
        hoursPerWeek: 4.6,
        since: "March 2026",
        nextTask: "Long run — Sunday",
        note: "Race in October. Three easy runs and one that hurts.",
        links: [{ platform: "Instagram", handle: "@fionaruns" }],
      },
      {
        id: "run-2",
        name: "Samir Qureshi",
        location: "Karachi",
        phrasing: "First half marathon, just finish it",
        hoursPerWeek: 2.9,
        since: "June 2026",
        nextTask: "Easy 5k",
        note: "Started at zero in June. No time goal, which removed most of the anxiety.",
        links: [{ platform: "X", handle: "@samirq" }],
      },
      {
        id: "run-3",
        name: "Ida Bergström",
        location: "Gothenburg",
        phrasing: "Run three times a week through winter",
        hoursPerWeek: 3.2,
        since: "November 2025",
        nextTask: "Intervals",
        note: "The quest is really about the winter, not the distance.",
        links: [{ platform: "LinkedIn", handle: "ida-bergstrom" }],
      },
    ],
  },
  {
    slug: "write-in-public",
    name: "Write in public",
    color: "rose",
    members: 96,
    typicalHoursWeek: 2.1,
    aliases: ["write in public", "write", "writing", "blog", "newsletter", "essay"],
    alsoPursue: [
      { name: "Read more books", members: 74 },
      { name: "Ship a side project", members: 64 },
      { name: "Learn a language", members: 38 },
    ],
    people: [
      {
        id: "write-1",
        name: "Theo Marchetti",
        location: "Buenos Aires",
        phrasing: "One essay a month, published",
        hoursPerWeek: 2.4,
        since: "January 2026",
        nextTask: "Draft the September piece",
        note: "Publishing monthly means writing weekly. Nobody tells you the ratio.",
        links: [
          { platform: "X", handle: "@theomarchetti" },
          { platform: "LinkedIn", handle: "theo-marchetti" },
        ],
      },
      {
        id: "write-2",
        name: "Ruth Nakamura",
        location: "Wellington",
        phrasing: "Newsletter every Friday, no exceptions",
        hoursPerWeek: 3.8,
        since: "September 2025",
        nextTask: "Friday issue outline",
        note: "Forty-something issues in. The weeks it felt pointless look identical to the good ones on the chart.",
        links: [{ platform: "Instagram", handle: "@ruth.writes" }],
      },
      {
        id: "write-3",
        name: "Omar Fadel",
        location: "Cairo",
        phrasing: "Write about what I'm building",
        hoursPerWeek: 1.5,
        since: "May 2026",
        nextTask: "Post the teardown",
        note: "Started to market a side project, stayed because it made the thinking better.",
        links: [{ platform: "X", handle: "@omarfadel" }],
      },
    ],
  },
] as const;
