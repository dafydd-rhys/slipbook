// Server-only. Uses the Anthropic API to read a betslip screenshot and pull out
// the fields that matter for a bet entry — everything else the admin still
// fills in / confirms via the normal preview flow.
import Anthropic from '@anthropic-ai/sdk';
import { BetResult, SportType } from './types';

const SPORTS: SportType[] = [
  'football', 'tennis', 'basketball', 'esports', 'cricket', 'horse_racing',
  'golf', 'rugby', 'boxing', 'mma', 'darts', 'baseball', 'other',
];

const RESULTS: BetResult[] = ['won', 'lost', 'void', 'pending'];

export interface ParsedSubLeg {
  selection: string;
  market: string;
}

export interface ParsedLeg {
  selection: string;
  market: string;
  matchup: string;
  odds: number;
  sport: SportType;
  result: BetResult;
  isBetBuilder: boolean;
  subLegs: ParsedSubLeg[];
}

export interface ParsedSlip {
  date: string; // resolved ISO date/time — see resolveDate()
  stake: number | null;
  legs: ParsedLeg[];
}

// Raw shape returned by the model, before date resolution / stripping the
// per-leg dateTime used only to compute the fallback.
interface RawLeg extends ParsedLeg {
  dateTime: string | null;
}

interface RawSlip {
  betDateTime: string | null;
  stake: number | null;
  legs: RawLeg[];
}

const SUB_LEG_SCHEMA = {
  type: 'object',
  properties: {
    selection: { type: 'string' },
    market: { type: 'string' },
  },
  required: ['selection', 'market'],
  additionalProperties: false,
} as const;

const LEG_SCHEMA = {
  type: 'object',
  properties: {
    selection: { type: 'string', description: 'The specific pick, e.g. player, team, or outcome name' },
    market: { type: 'string', description: "The bet market, e.g. 'Match Winner', 'Over/Under 2.5 Goals'" },
    matchup: { type: 'string', description: "The event/fixture, e.g. 'Arsenal vs Chelsea'" },
    odds: { type: 'number', description: 'Decimal odds for this leg' },
    sport: { type: 'string', enum: SPORTS, description: 'Best-guess sport for this leg; "other" if unclear' },
    result: { type: 'string', enum: RESULTS, description: 'Settled result of this leg; "pending" if not yet settled/unclear' },
    dateTime: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Kickoff/event date-time for this leg as ISO 8601, or null if not visible',
    },
    isBetBuilder: {
      type: 'boolean',
      description: 'True if this leg is itself a combined "bet builder" / "same game parlay" selection bundling multiple conditions on one event into a single price',
    },
    subLegs: {
      type: 'array',
      items: SUB_LEG_SCHEMA,
      description: 'Individual conditions bundled into this leg when isBetBuilder is true; empty array otherwise',
    },
  },
  required: ['selection', 'market', 'matchup', 'odds', 'sport', 'result', 'dateTime', 'isBetBuilder', 'subLegs'],
  additionalProperties: false,
} as const;

const SCHEMA = {
  type: 'object',
  properties: {
    legs: { type: 'array', items: LEG_SCHEMA },
    betDateTime: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: "The bet's overall placed-at or kickoff date-time as ISO 8601, or null if not visible",
    },
    stake: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
      description: 'Total stake as a plain number with no currency symbol, or null if not visible',
    },
  },
  required: ['legs', 'betDateTime', 'stake'],
  additionalProperties: false,
} as const;

// Instructions given to the model alongside the betslip screenshot.
function promptFor(nowIso: string): string {
  return `You are extracting structured data from a screenshot of a sports betting slip (a bet confirmation or bet history entry from a bookmaker app or website).

Today's date and time (for resolving relative references like "today", "tomorrow", or a bare time) is: ${nowIso}.

Identify every individual leg (selection) in the bet, in the order they appear on the slip. For each leg extract:
- selection: the specific pick made (player, team, or outcome name)
- market: the type of bet/market (e.g. "Match Winner", "Over/Under 2.5 Goals", "Anytime Goalscorer")
- matchup: the two competitors or event name (e.g. "Arsenal vs Chelsea")
- odds: the odds for that leg, converted to decimal odds as a number (e.g. fractional 6/4 -> 2.5, American +150 -> 2.5)
- sport: classify this leg's sport as one of: ${SPORTS.join(', ')}. Use "other" if you can't confidently tell.
- result: this leg's settled result: "won", "lost", "void", or "pending". Look for colour coding (commonly green = won, red = lost), checkmarks/crosses, strikethrough text, or explicit labels. If nothing indicates a settled result, use "pending".
- dateTime: the kickoff/event date-time for this leg as an ISO 8601 string (resolve relative days/bare times against today's date above), or null if not visible.
- isBetBuilder: true if this single leg is actually a combined "bet builder" / "same game parlay" selection bundling multiple conditions on the same event into one price (look for wording like "Bet Builder" or several bullet-pointed conditions grouped under one price). Otherwise false.
- subLegs: when isBetBuilder is true, list each bundled condition as {selection, market}. Otherwise an empty array.

Also extract:
- betDateTime: the bet's overall placed-at or kickoff date-time as an ISO 8601 string if shown anywhere on the slip, or null if not visible.
- stake: the total stake as a plain number with no currency symbol (e.g. 10.5), or null if no stake is visible.

If a value is hard to read, make your best reasonable estimate rather than leaving it blank.`;
}

// True if the string parses as a valid date — used to fall back cleanly when
// the model returns null or an unparseable value.
function isValidIsoDate(value: string | null): value is string {
  return !!value && !Number.isNaN(Date.parse(value));
}

// Resolves the bet's overall date: the model's top-level betDateTime if
// valid, else the last leg's own date-time, else "now".
function resolveDate(betDateTime: string | null, legs: RawLeg[]): string {
  if (isValidIsoDate(betDateTime)) {
    return betDateTime;
  }

  const lastLeg = legs[legs.length - 1];

  if (lastLeg && isValidIsoDate(lastLeg.dateTime)) {
    return lastLeg.dateTime;
  }

  return new Date().toISOString();
}

// Converts the model's raw response shape into the public ParsedSlip shape,
// resolving the overall date and dropping the per-leg dateTime field.
function rawToParsedSlip(raw: RawSlip): ParsedSlip {
  if (!Array.isArray(raw.legs) || raw.legs.length === 0) {
    throw new Error('No legs found');
  }

  return {
    date: resolveDate(raw.betDateTime, raw.legs),
    stake: raw.stake,
    legs: raw.legs.map((leg): ParsedLeg => ({
      selection: leg.selection,
      market: leg.market,
      matchup: leg.matchup,
      odds: leg.odds,
      sport: leg.sport,
      result: leg.result,
      isBetBuilder: leg.isBetBuilder,
      subLegs: leg.subLegs,
    })),
  };
}

// Reads a betslip screenshot and returns its parsed bet shape.
export async function parseSlipImage(mediaType: string, base64Data: string): Promise<ParsedSlip> {
  const anthropic = new Anthropic();
  const now = new Date().toISOString();

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', data: base64Data },
          },
          { type: 'text', text: promptFor(now) },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');

  if (!textBlock) {
    throw new Error('No text response from model');
  }

  return rawToParsedSlip(JSON.parse(textBlock.text) as RawSlip);
}

// Instructions given to the model alongside a plain-English bet description.
function textPromptFor(nowIso: string): string {
  return `You are converting a natural-language description of a sports bet — written by the person placing it — into structured data.

Today's date and time (for resolving relative references like "today", "tomorrow", "tonight") is: ${nowIso}.

Identify every individual leg (selection) described, in the order mentioned. For each leg extract:
- selection: the specific pick (player, team, or outcome name)
- market: the type of bet/market (e.g. "Match Winner", "Over/Under 2.5 Goals"). Infer a reasonable market if only implied (e.g. "Arsenal to win" -> "Match Result").
- matchup: the fixture/event if mentioned (e.g. "Arsenal vs Chelsea"), else empty string
- odds: decimal odds as a number. Convert fractional/American if given. If odds truly aren't mentioned for a leg, use 2.00 as a placeholder — the admin will correct it.
- sport: classify as one of: ${SPORTS.join(', ')}. Use "other" if unclear.
- result: "pending" unless the text explicitly says the bet already won or lost.
- dateTime: kickoff/event date-time as ISO 8601 if mentioned or impliable from today's date above, else null.
- isBetBuilder: true only if the text explicitly describes a combined "bet builder" / "same game parlay" of multiple conditions on one event priced as a single leg.
- subLegs: the bundled conditions when isBetBuilder is true, else empty array.

Also extract betDateTime (ISO 8601 or null) and stake (a plain number, or null if not mentioned).

Do not invent specifics (team names, markets, odds) that were not stated or clearly implied — leave fields as their default/placeholder rather than fabricating detail.`;
}

// Converts a plain-English bet description into a parsed bet shape.
export async function parseSlipText(text: string): Promise<ParsedSlip> {
  const anthropic = new Anthropic();
  const now = new Date().toISOString();

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: `${textPromptFor(now)}\n\nBet description:\n"""\n${text}\n"""` }],
      },
    ],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');

  if (!textBlock) {
    throw new Error('No text response from model');
  }

  return rawToParsedSlip(JSON.parse(textBlock.text) as RawSlip);
}

// ── Settlement suggestion (web search) ────────────────────────────────────────
export interface SettleLegSuggestion {
  index: number;
  result: BetResult;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export interface SettleSuggestion {
  legs: SettleLegSuggestion[];
  summary: string;
}

// Pulls the first {...} JSON object out of the model's response text,
// tolerating markdown code fences and any stray prose around it.
function extractJsonObject(text: string): unknown {
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Could not find a JSON object in the model response');
  }

  return JSON.parse(stripped.slice(start, end + 1));
}

type SettleInput = {
  title: string;
  eventDate: string;
  legs: { selection: string; market: string; matchup: string; sport: SportType }[];
};

// Instructions given to the model for the web-search settlement-suggestion request.
function settlementPromptFor(input: SettleInput): string {
  const legList = input.legs
    .map((leg, index) => `${index}. [${leg.sport}] ${leg.selection} — ${leg.market}${leg.matchup ? ` — ${leg.matchup}` : ''}`)
    .join('\n');

  return `Search the web to find the outcome of each leg of this bet, "${input.title}", from an event around ${input.eventDate}:

${legList}

For each leg, determine whether the selection won, lost, or was voided (e.g. postponed/cancelled), based on the actual final result. If you cannot find a reliable result for a leg, mark it "pending" with low confidence rather than guessing.

After researching, respond with ONLY a JSON object (no prose before or after, no markdown fences) in exactly this shape:
{"legs": [{"index": 0, "result": "won"|"lost"|"void"|"pending", "confidence": "high"|"medium"|"low", "note": "one short sentence — the final score/outcome and source"}], "summary": "one short sentence overall"}

The "legs" array must have exactly ${input.legs.length} entries, one per index 0 to ${input.legs.length - 1}, in order.`;
}

// Web-searches each leg of a pending bet and proposes a settlement — always
// a suggestion for the admin to review, never applied automatically.
export async function suggestSettlement(input: SettleInput): Promise<SettleSuggestion> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    messages: [
      { role: 'user', content: [{ type: 'text', text: settlementPromptFor(input) }] },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!text.trim()) {
    throw new Error('No text response from model');
  }

  const parsed = extractJsonObject(text) as SettleSuggestion;

  if (!Array.isArray(parsed.legs)) {
    throw new Error('Malformed settlement suggestion');
  }

  return parsed;
}

// ── AI performance summary ─────────────────────────────────────────────────────

// Generates a short plain-English performance summary from precomputed stats text.
export async function generateSummary(statsText: string, periodLabel: string): Promise<string> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: [{
          type: 'text',
          text: `You are writing a short, plain-English performance summary for a personal sports-betting tracker, covering ${periodLabel}. Here are the computed stats:

${statsText}

Write 2-4 sentences, second person ("you"), factual and grounded only in the numbers given — do not invent context about specific bets, teams, or reasons for performance beyond what the numbers show. Call out the standout number(s) if there's a clear one. No headers, no bullet points, just prose.`,
        }],
      },
    ],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');

  return textBlock?.text.trim() ?? '';
}
