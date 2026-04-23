export type StrategyContent = {
  slug: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate';
  concept: string;
  technical_logic: string;
  works_when: string;
  fails_when: string;
  real_world_usage: string;
  visual_diagram: string;
  walkthrough: string;
};

export const strategyContent: StrategyContent[] = [
  {
    slug: 'sma-crossover',
    name: 'SMA Crossover',
    description: 'Simple trend following with fast and slow moving averages.',
    difficulty: 'Beginner',
    concept: 'Compare short-term average price to long-term average price. If short-term rises above long-term, trend may be turning up; if it falls below, trend may be weakening.',
    technical_logic: 'Signal buy when SMA(10) crosses above SMA(50). Signal sell when SMA(10) crosses below SMA(50), with inventory checks before selling.',
    works_when: 'Clear trending markets with sustained directional movement.',
    fails_when: 'Sideways or noisy markets where averages cross repeatedly without follow-through.',
    real_world_usage: 'Used by discretionary and systematic traders as a baseline trend filter and regime detector.',
    visual_diagram: 'Price -> Rolling Window(10, 50) -> SMA10/SMA50 -> Crossover Detector -> Buy/Sell Signal',
    walkthrough: 'At t-1, SMA10 <= SMA50. At t, SMA10 > SMA50. The bot submits a market buy. It exits when the opposite crossover appears.',
  },
  {
    slug: 'rsi',
    name: 'RSI Mean Reversion',
    description: 'Buys recoveries from oversold levels and sells from overbought pullbacks.',
    difficulty: 'Beginner',
    concept: 'RSI measures speed and magnitude of recent moves. Very low RSI suggests stretched downside; very high RSI suggests stretched upside.',
    technical_logic: 'Compute RSI(14). Buy when RSI crosses up through 30. Sell when RSI crosses down through 70 if inventory is available.',
    works_when: 'Range-bound markets where prices oscillate and mean-revert after extremes.',
    fails_when: 'Strong one-directional trends where overbought/oversold can persist.',
    real_world_usage: 'Common in momentum exhaustion checks and mean-reversion overlays.',
    visual_diagram: 'Close Prices -> Gains/Losses(14) -> RSI -> Threshold Cross (30/70) -> Buy/Sell Signal',
    walkthrough: 'RSI was 28 and moves to 32. That upward threshold cross triggers a buy. Later RSI falls from 73 to 68, triggering a sell.',
  },
  {
    slug: 'ema-crossover',
    name: 'EMA Crossover',
    description: 'Faster trend-following variant using exponential weighting.',
    difficulty: 'Beginner',
    concept: 'EMA reacts faster than SMA by giving more weight to recent prices, so it can adapt to trend changes earlier.',
    technical_logic: 'Signal buy when EMA(12) crosses above EMA(26). Signal sell when EMA(12) crosses below EMA(26), with inventory check.',
    works_when: 'Markets with medium-term trends and moderate momentum shifts.',
    fails_when: 'Highly choppy sessions where fast EMA can overreact and whipsaw.',
    real_world_usage: 'Frequently used in retail and institutional signal stacks, often combined with volatility filters.',
    visual_diagram: 'Close Prices -> EMA12/EMA26 -> Crossover Detector -> Buy/Sell Signal',
    walkthrough: 'EMA12 sits below EMA26 during pullback. New momentum pushes EMA12 above EMA26. Bot buys and keeps position until bearish cross.',
  },
  {
    slug: 'bollinger-reversion',
    name: 'Bollinger Mean Reversion',
    description: 'Uses Bollinger Bands to detect short-term price extremes.',
    difficulty: 'Beginner',
    concept: 'When price moves far from its moving average (outside volatility bands), it may revert back toward the middle band.',
    technical_logic: 'Compute Bollinger Bands with SMA(20) and ±2 standard deviations. Buy below lower band. Sell above upper band if inventory exists.',
    works_when: 'Calmer regimes with recurring pullbacks and rebounds around a stable mean.',
    fails_when: 'Breakout regimes where price rides the band instead of reverting.',
    real_world_usage: 'Popular for short-horizon mean reversion and volatility-aware entry timing.',
    visual_diagram: 'Close Prices -> SMA20 + StdDev -> Upper/Lower Bands -> Band Breach -> Buy/Sell Signal',
    walkthrough: 'Price drops under lower band after sharp move. Bot buys expecting snapback. On rebound above upper band, bot takes profit by selling.',
  },
  {
    slug: 'macd-trend',
    name: 'MACD Trend',
    description: 'Uses MACD and signal-line crossovers to follow momentum shifts.',
    difficulty: 'Beginner',
    concept: 'MACD compares short and long EMAs to estimate momentum direction and strength. A rising MACD above signal often confirms bullish momentum.',
    technical_logic: 'Compute MACD(12,26,9). Buy when MACD crosses above signal line. Sell when MACD crosses below signal line and inventory is available.',
    works_when: 'Trends with smooth acceleration and clear momentum swings.',
    fails_when: 'Flat sessions with rapid mean reversion and weak direction.',
    real_world_usage: 'A common starter momentum model used in discretionary charting and simple automated systems.',
    visual_diagram: 'Close Prices -> EMA12 & EMA26 -> MACD Line -> Signal EMA9 -> Cross Detector -> Buy/Sell Signal',
    walkthrough: 'MACD was below signal and then crosses above after a bounce. Bot enters long. When MACD later crosses back down, bot exits.',
  },
  {
    slug: 'donchian-breakout',
    name: 'Donchian Breakout',
    description: 'Breakout strategy using the highest high and lowest low channels.',
    difficulty: 'Beginner',
    concept: 'Price breaking above a recent high can indicate trend continuation; breaking below a recent low can indicate downside pressure.',
    technical_logic: 'Build Donchian channels over 20 bars. Buy when close breaks above prior upper channel. Sell when close breaks below prior lower channel if inventory exists.',
    works_when: 'Strong directional markets and trend expansion phases.',
    fails_when: 'Range-bound markets with false breakouts and quick reversals.',
    real_world_usage: 'Widely known from trend-following systems inspired by Turtle trading.',
    visual_diagram: 'High/Low Series -> Rolling Max/Min (20) -> Channel Break Detector -> Buy/Sell Signal',
    walkthrough: 'Price closes above the last 20-bar high, triggering a buy breakout. On later downside break below the 20-bar low, bot exits.',
  },
  {
    slug: 'roc-momentum',
    name: 'ROC Momentum',
    description: 'Trades momentum acceleration using rate-of-change threshold crosses.',
    difficulty: 'Beginner',
    concept: 'Rate of Change (ROC) measures percentage move versus a lookback period, helping detect accelerating or fading momentum.',
    technical_logic: 'Compute ROC(12). Buy when ROC crosses above +0.5. Sell when ROC crosses below -0.5 if inventory is available.',
    works_when: 'Markets with persistent bursts of momentum after regime shifts.',
    fails_when: 'Whipsaw periods where short-term momentum flips frequently.',
    real_world_usage: 'Used as a simple momentum filter and confirmation tool for directional entries.',
    visual_diagram: 'Close Prices -> ROC(12) -> Threshold Cross (+0.5/-0.5) -> Buy/Sell Signal',
    walkthrough: 'ROC rises from 0.2 to 0.8, crossing +0.5 and triggering buy. Later ROC falls below -0.5 and bot exits the position.',
  },
  {
    slug: 'pairs-trading',
    name: 'Pairs Trading (Planned)',
    description: 'Market-neutral mean reversion between related assets.',
    difficulty: 'Intermediate',
    concept: 'Track two correlated assets and trade spread divergence instead of outright direction.',
    technical_logic: 'Estimate spread = AssetA - beta*AssetB, convert to z-score, and open hedged trades when z-score is extreme.',
    works_when: 'Stable correlation and repeatable spread behavior.',
    fails_when: 'Structural breaks where pair relationship changes permanently.',
    real_world_usage: 'Classic statistical arbitrage technique in neutral books.',
    visual_diagram: 'AssetA/AssetB -> Spread -> Z-score -> Extreme Detector -> Long/Short Paired Position',
    walkthrough: 'Spread z-score spikes to +2.5. System shorts rich leg and buys cheap leg. Position closes as z-score returns near zero.',
  },
];

export function getStrategyContent(slug: string): StrategyContent | undefined {
  return strategyContent.find((item) => item.slug === slug);
}
