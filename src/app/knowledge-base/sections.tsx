// Knowledge Base content, kept as data (id/title/Content) so page.tsx just
// maps over it instead of hand-rolling 20 <section> blocks inline.
import { SITE_NAME, UNIT_SIZE } from '@/lib/config';
import {
  SCREENSHOT_COST_ESTIMATE, TEXT_PARSE_COST_ESTIMATE, SETTLE_SUGGEST_COST_ESTIMATE, AI_SUMMARY_COST_ESTIMATE,
} from '@/lib/aiCostEstimates';

// Inline "Term — definition" row used throughout the section content below.
function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{term}</span>
      <span style={{ color: 'var(--text-faint)' }}> — </span>
      <span>{children}</span>
    </div>
  );
}

export interface KbSection {
  id: string;
  title: string;
  Content: () => React.ReactNode;
}

export const KB_SECTIONS: KbSection[] = [
  {
    id: 'overview', title: 'Overview',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          {SITE_NAME} is a personal betting tracker. The public-facing tracker, insights, and bankroll pages show
          everyone the same view of performance — but always in anonymised <strong>units</strong>, never real
          currency. The admin panel is where bets are actually entered, edited, and settled, and it&apos;s the only
          place real stake and returns figures are visible.
        </p>
        <p>
          Every feature below is either something you&apos;ll see on the public pages, or a tool available to whoever
          holds the admin PIN.
        </p>
      </>
    ),
  },
  {
    id: 'bet-types', title: 'Bet Types',
    Content: () => (
      <>
        <Term term="Single">One leg, one outcome.</Term>
        <Term term="Double / Treble">Two or three legs combined into one bet — every leg must win for the bet to win.</Term>
        <Term term="Accumulator (Acca)">Four or more legs combined the same way — the odds multiply across all legs.</Term>
        <Term term="Bet Builder">Multiple conditions on a single event (e.g. both teams to score AND over 2.5 goals) priced as one combined leg.</Term>
        <Term term="Each Way">A bet split into two parts — one on the outright winner, one on a placed finish (common in racing and golf).</Term>
        <Term term="Outright">A bet on the winner of an entire tournament or competition, settled well after it&apos;s placed.</Term>
        <Term term="System / Lucky 15 / 31 / 63">Multiple bet combinations from a fixed number of selections (4, 5, or 6), covering every possible double, treble, etc. — pays out even if not every leg wins.</Term>
      </>
    ),
  },
  {
    id: 'odds', title: 'Odds Formats',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          Odds are stored as decimal internally, but the tracker page lets you switch the display between three
          formats using the selector above the bet list:
        </p>
        <Term term="Decimal">e.g. 2.50 — stake × odds = total return.</Term>
        <Term term="Fractional">e.g. 6/4 — traditional UK/Irish bookmaker format.</Term>
        <Term term="American">e.g. +150 / -200 — positive shows profit per 100 staked, negative shows stake needed to profit 100.</Term>
        <p style={{ marginTop: 10 }}>Your chosen format is remembered on this device for next time.</p>
      </>
    ),
  },
  {
    id: 'legs', title: 'Legs, Builders & Boosts',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          Each selection within a bet is a <strong>leg</strong>. A leg records the selection, market, matchup, odds,
          sport, and result independently — so a 5-leg acca can show exactly which legs won and which lost, even
          though the bet as a whole only has one overall result.
        </p>
        <p style={{ marginBottom: 10 }}>
          A leg can itself be a <strong>bet builder</strong>, bundling several conditions on one event into a single
          priced selection — those sub-conditions are tracked underneath the leg for reference, without affecting
          the maths.
        </p>
        <p>
          <strong>Boosted odds</strong> record both the original (base) price and the enhanced price a bookmaker
          offered, at bet level or per leg, so profit/loss reflects what was actually paid out while the base odds
          stay on record for reference.
        </p>
      </>
    ),
  },
  {
    id: 'results', title: 'Results & Outcomes',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          Every bet and every leg has a result: <strong>pending</strong>, <strong>won</strong>, <strong>lost</strong>,
          or <strong>void</strong> (cancelled/postponed, stake returned). A bet&apos;s overall result is derived from
          its legs — any lost leg loses the whole bet, any still-pending leg keeps it pending, and if every leg is
          void the bet is void.
        </p>
        <p>
          Settled legs can optionally record the actual sporting outcome (final score, sets, finish position, score
          to par, etc.) — sport-specific fields shown in the admin edit form — purely for your own reference.
        </p>
      </>
    ),
  },
  {
    id: 'units-bankroll', title: 'Units & Bankroll',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          To keep real money private on public pages, every profit/loss figure outside the admin panel is shown in
          <strong> units</strong> rather than currency. One unit equals a fixed amount (currently{' '}
          {UNIT_SIZE} of the configured currency) set by whoever runs this instance — so performance is comparable
          over time without exposing actual stakes.
        </p>
        <p style={{ marginBottom: 10 }}>
          The <strong>Bankroll</strong> page tracks a running balance made up of deposits, withdrawals, and manual
          adjustments, merged chronologically with the profit/loss from settled bets. It answers &quot;how much is
          actually in the account&quot;, separate from bet-by-bet performance.
        </p>
        <p>Bankroll entries are managed from the admin panel&apos;s Bankroll tab.</p>
      </>
    ),
  },
  {
    id: 'tags', title: 'Tags & Bookmakers',
    Content: () => (
      <p>
        Bets can optionally record which <strong>bookmaker</strong> they were placed with and any free-text{' '}
        <strong>tags</strong> (comma-separated, e.g. &quot;value&quot;, &quot;in-play&quot;, &quot;same-game&quot;).
        Both feed into the search/filter panel and the Bookmaker breakdown on the Insights page, so patterns by
        bookmaker or by your own tagging scheme are easy to isolate.
      </p>
    ),
  },
  {
    id: 'search', title: 'Search, Filters & Sharing',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          The tracker&apos;s search box matches against titles, notes, bookmakers, and every leg&apos;s selection,
          market, and matchup. The <strong>Filters</strong> panel narrows further by sport, result, bookmaker, tag,
          and odds range, on top of the date-range tabs above.
        </p>
        <p style={{ marginBottom: 10 }}>
          Whatever combination of filters is active is reflected in the page URL, so the <strong>Share</strong>{' '}
          button copies a link that reproduces the exact same filtered view for anyone you send it to. Next to it,
          a small download icon exports the current stats row itself as a shareable image — handy for posting a
          period&apos;s results without linking the site.
        </p>
        <p>Date ranges available: last 7, 30, 60, or 90 days, the last year, or all time.</p>
      </>
    ),
  },
  {
    id: 'presets', title: 'Saved Filter Presets',
    Content: () => (
      <p>
        Beyond one-off share links, a filter combination (date range plus any sport/result/bookmaker/tag/odds
        filters) can be saved as a named preset from the Filters panel — anyone can load a saved preset, but
        only the admin can create or delete one, so the list stays curated.
      </p>
    ),
  },
  {
    id: 'insights', title: 'Insights & Analytics',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          At the top of the page: a goal progress bar when the admin has set one, and an <strong>On This Day</strong>{' '}
          card recalling what happened on the same calendar date in past years (once there&apos;s history to show).
          Both always look at every bet, regardless of the year filter described below.
        </p>
        <p style={{ marginBottom: 10 }}>
          A year filter — defaulting to <strong>All Time</strong> — sits above the cumulative P&amp;L chart and
          narrows the chart, breakdowns, and patterns tabs to a single year. The Calendar tab ignores this filter
          and always opens on the current year, with its own independent year navigation. The share button next to
          the page title exports the chart, the current year&apos;s calendar grid, and the sport breakdown as one image.
        </p>
        <p style={{ marginBottom: 10 }}>Below the chart, three tabs:</p>
        <Term term="Calendar">Month-by-month profit/loss for any tracked year, starting from whichever year your earliest bet falls in.</Term>
        <Term term="Breakdowns">
          Performance sliced by sport, bet type, bookmaker, market, or odds range — bet count, units, ROI, and win
          rate for each. A <strong>Show correlations</strong> toggle cross-tabulates two dimensions at once (sport ×
          bookmaker, sport × tag, or bookmaker × tag) to surface combinations a single-dimension view can hide —
          only combinations with at least 3 bets are shown, to avoid noise from one-off results.
        </Term>
        <Term term="Patterns">
          Streaks (current and longest win/loss runs), drawdown (how far below the peak balance you currently are,
          and the worst it&apos;s been), a staking-pattern check (whether stakes tend to rise after a loss — a
          common warning sign), and breakdowns by day of week and time of day.
        </Term>
        <p style={{ marginTop: 10 }}>
          <strong>ROI</strong> is profit/loss divided by total staked, as a percentage. <strong>Win rate</strong> is
          the share of settled (non-void) bets that won.
        </p>
      </>
    ),
  },
  {
    id: 'goal', title: 'Goal Tracking',
    Content: () => (
      <p>
        From the admin Reports tab, set a target in units and a deadline (e.g. &quot;+50u by December
        31&quot;). Progress is measured from the day the goal was set, not all-time — shown as a progress bar
        on the public Insights page until cleared or replaced.
      </p>
    ),
  },
  {
    id: 'stake-sizing', title: 'Stake Sizing Helper',
    Content: () => (
      <p>
        In the admin Add Bet form, an optional calculator suggests a stake two ways: the{' '}
        <strong>Kelly Criterion</strong> (using the bet&apos;s odds, your own estimated win probability, and a
        full/half/quarter-Kelly fraction to control variance), or a flat percentage of a bankroll figure you
        enter. Either way it&apos;s only as good as the probability estimate or percentage you put in — it fills
        the Stake field for you to review, not a rule to follow blindly.
      </p>
    ),
  },
  {
    id: 'import', title: 'Screenshot & Text Import',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          In the admin Add Bet form, a betslip screenshot can be dropped in directly — an AI model reads it and
          fills in the date, every leg&apos;s selection/market/matchup/odds, sport, settled results, and stake,
          ready for you to review before saving. Drop several screenshots at once and each is read in turn; a
          batch preview lists every bet it found (with a note on any that couldn&apos;t be read) so you can drop
          individual ones before adding the rest together.
        </p>
        <p style={{ marginBottom: 10 }}>
          A screenshot can also be pasted straight from the clipboard (Ctrl/Cmd+V) instead of dragging a file.
        </p>
        <p>
          The <strong>Describe it</strong> mode does the same from a plain-English sentence instead of an image —
          useful when you don&apos;t have a screenshot handy. Neither mode saves anything automatically; you always
          get a preview first. If no Anthropic API key is configured, this section (and Suggest Result / AI
          Summary below) shows as disabled rather than failing after you try it. Each screenshot costs roughly{' '}
          {SCREENSHOT_COST_ESTIMATE} and each text description roughly {TEXT_PARSE_COST_ESTIMATE} in Anthropic API
          usage — see Suggested Settlement and AI Performance Summary below for those costs.
        </p>
      </>
    ),
  },
  {
    id: 'settle', title: 'Suggested Settlement',
    Content: () => (
      <p>
        For a pending bet, <strong>Suggest Result</strong> has the AI search the web for each leg&apos;s actual
        outcome and propose a result with a confidence level and a short note per leg. This is always a suggestion
        for you to review — nothing is settled automatically, and you make the final call before saving. The web
        search involved makes this the most expensive AI feature here, at roughly {SETTLE_SUGGEST_COST_ESTIMATE}
        per bet.
      </p>
    ),
  },
  {
    id: 'ai-summary', title: 'AI Performance Summary',
    Content: () => (
      <p>
        From the admin Reports tab, you can generate a short plain-English summary of performance over a chosen
        period. It&apos;s grounded only in the computed stats for that period and is shown at the top of the
        public Insights page until regenerated. This is the cheapest AI feature, at roughly {AI_SUMMARY_COST_ESTIMATE}{' '}
        per generation.
      </p>
    ),
  },
  {
    id: 'clv', title: 'Closing Line Value',
    Content: () => (
      <p>
        When configured (a free TheOddsAPI key, see the README), a scheduled job captures the market&apos;s
        closing price for your <strong>Match Winner/Match Result</strong> bets in a handful of major leagues,
        matched against your bet&apos;s selection on a best-effort basis. Once there&apos;s data, a &quot;Closing
        Line Value&quot; tile on the Insights → Patterns tab shows whether you&apos;re typically getting better or
        worse odds than the market settled on — a signal independent of whether the bet actually won.
      </p>
    ),
  },
  {
    id: 'notifications', title: 'Push Notifications',
    Content: () => (
      <p>
        When configured (see the README), the same scheduled job checks for <strong>pending</strong> bets whose
        event happened more than 6 hours ago and sends a single browser push notification nudging you to settle
        them, instead of them sitting forgotten. Turn it on from the admin Data tab — it&apos;s per-browser, free,
        and uses no third-party push service.
      </p>
    ),
  },
  {
    id: 'tax', title: 'Tax Report',
    Content: () => (
      <>
        <p style={{ marginBottom: 10 }}>
          A basic year-by-year total of stakes, returns, and profit/loss from settled bets, available in the admin
          Reports tab. It&apos;s a starting point for your own records, not tax advice — rules on betting winnings
          vary by country and you should check what applies to you.
        </p>
        <p>
          The same tab can export that table as a PDF, or export every settled bet in a chosen date range as a
          separate ledger PDF — a plain record independent of the tax-year grouping.
        </p>
      </>
    ),
  },
  {
    id: 'templates', title: 'Bet Templates',
    Content: () => (
      <p>
        If you place similar bets often, save the current form as a named template from the Add Bet screen, then
        load it later to prefill the type, bookmaker, and legs — you only need to adjust odds, stake, and date.
      </p>
    ),
  },
  {
    id: 'trash', title: 'Trash & Recovery',
    Content: () => (
      <p>
        Deleting a bet from the admin Manage tab doesn&apos;t remove it immediately — it moves to the Trash tab,
        where it can be restored or permanently deleted. Anything left untouched is purged automatically after
        30 days.
      </p>
    ),
  },
  {
    id: 'data', title: 'Import & Export',
    Content: () => (
      <p>
        The admin Data tab exports all bets and bankroll entries as CSV or JSON at any time — useful for backups
        or moving data elsewhere. CSV files exported from this app can be re-imported the same way; a JSON array
        of bets works too. Imported bets are added alongside existing ones, never overwriting anything.
      </p>
    ),
  },
  {
    id: 'security', title: 'Admin Security',
    Content: () => (
      <p>
        The admin PIN is checked server-side only and is never sent to the browser as part of the page. A
        successful login sets an HttpOnly session cookie (a hashed token, not the PIN itself), so the PIN can&apos;t
        be read back out of the browser even by someone with access to it.
      </p>
    ),
  },
  {
    id: 'hosting', title: 'Self-Hosting',
    Content: () => (
      <p>
        This project is designed to be self-hosted and customised — site name, currency, unit size, and the admin
        PIN are all set through environment variables. See the project&apos;s README for the full setup guide.
      </p>
    ),
  },
];
