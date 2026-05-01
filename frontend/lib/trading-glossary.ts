export type GlossaryEntry = {
  term: string;
  definition: string;
  howToUse: string;
  importance: 'critical' | 'important' | 'helpful';
};

export const tradingGlossary: Record<string, GlossaryEntry> = {
  symbol: {
    term: 'Symbol (Ticker)',
    definition: 'A unique code representing a tradable asset (e.g., AAPL for Apple Inc.).',
    howToUse:
      'Use symbols to select which stock or asset you want to trade. Each symbol represents a different company or security. Most trading platforms let you search by symbol to find and trade assets.',
    importance: 'critical',
  },
  bid: {
    term: 'Bid Price',
    definition: 'The highest price a buyer is willing to pay for an asset right now.',
    howToUse:
      'When you want to sell, you sell at the bid price. The bid is usually lower than the ask price. Watching the bid helps you understand current buyer interest.',
    importance: 'critical',
  },
  ask: {
    term: 'Ask Price',
    definition: 'The lowest price a seller is willing to accept for an asset right now.',
    howToUse:
      'When you want to buy, you buy at the ask price. The ask is usually higher than the bid price. The difference between bid and ask is called the spread.',
    importance: 'critical',
  },
  spread: {
    term: 'Bid-Ask Spread',
    definition: 'The difference between the bid and ask price. Represents the cost of immediate trading.',
    howToUse:
      'Smaller spreads are better for trading (lower costs). Larger spreads mean you lose more money instantly when buying or selling. Compare spreads across different times to find best trading windows.',
    importance: 'important',
  },
  volume: {
    term: 'Trading Volume',
    definition: 'The total number of shares bought and sold in a given time period (e.g., per minute or day).',
    howToUse:
      'Higher volume means more liquidity - easier to buy/sell large quantities. Low volume can mean difficulty executing trades at desired prices. Use volume to assess market health and liquidity.',
    importance: 'important',
  },
  liquidity: {
    term: 'Liquidity',
    definition: 'How easily you can buy or sell an asset without significantly affecting its price.',
    howToUse:
      'Trade assets with high liquidity (like AAPL) for easier entries and exits. Avoid low liquidity assets if you need to trade quickly. Check volume and spread to gauge liquidity.',
    importance: 'important',
  },
  marketOrder: {
    term: 'Market Order',
    definition: 'An order to buy or sell immediately at the current market price.',
    howToUse:
      'Use market orders when you need to execute immediately and are willing to accept current prices. Perfect for time-sensitive trades. Expect fills at the bid (for sells) or ask (for buys).',
    importance: 'critical',
  },
  limitOrder: {
    term: 'Limit Order',
    definition: 'An order to buy or sell only if the price reaches a specific level you set.',
    howToUse:
      'Set a limit order at your target price to avoid overpaying (buy limit) or underselling (sell limit). May not execute if price never reaches your limit, but protects you from bad fills.',
    importance: 'important',
  },
  portfolio: {
    term: 'Portfolio',
    definition: 'Your collection of all positions (holdings) and cash across all symbols.',
    howToUse:
      'Monitor your portfolio to track total gains/losses, current positions, and available cash. Use it to manage risk and ensure you have enough buying power for new trades.',
    importance: 'critical',
  },
  cash: {
    term: 'Cash / Buying Power',
    definition: 'The available funds you have to make new trades.',
    howToUse:
      'Check your cash balance before placing trades. Buy orders deduct cash; sells add cash. If cash is low, sell positions to free up capital for new opportunities.',
    importance: 'critical',
  },
  position: {
    term: 'Position',
    definition: 'A holding of shares in a specific symbol (e.g., "100 AAPL shares").',
    howToUse:
      'The size of your position determines your exposure to that asset. Larger positions = larger gains/losses. Sell positions to reduce risk or lock in profits.',
    importance: 'critical',
  },
  pnl: {
    term: 'P&L (Profit & Loss)',
    definition: 'The total gain or loss on a position or entire portfolio, calculated as current value minus entry cost.',
    howToUse:
      'Use P&L to track performance of individual trades and overall strategy. Positive P&L means profit; negative means loss. Use it to evaluate strategy effectiveness.',
    importance: 'critical',
  },
  pnlPercent: {
    term: 'P&L %',
    definition: 'Profit and loss expressed as a percentage of the initial investment.',
    howToUse:
      'Easier than dollar P&L for comparing performance across different sized positions. A +10% P&L is +10% on whatever you invested. Compare P&L% across strategies to find your best performers.',
    importance: 'important',
  },
  winRate: {
    term: 'Win Rate',
    definition: 'The percentage of trades that resulted in a profit versus total trades taken.',
    howToUse:
      'A 60% win rate means 6 out of 10 trades are profitable. High win rate is good but not everything - losing trades might lose more than winning trades win. Combine with average win/loss sizes.',
    importance: 'important',
  },
  maxDrawdown: {
    term: 'Max Drawdown',
    definition: 'The largest peak-to-trough decline in portfolio value during a period.',
    howToUse:
      'Shows the worst-case scenario loss you experienced. A -20% max drawdown means your portfolio lost 20% from its peak at some point. Lower is better. Use to size positions appropriately.',
    importance: 'important',
  },
  sma: {
    term: 'SMA (Simple Moving Average)',
    definition: 'The average closing price over a set number of recent periods (e.g., 50 days).',
    howToUse:
      'Use SMA to identify trends: price above SMA = uptrend, price below SMA = downtrend. SMA(50) filters short-term noise; SMA(200) identifies long-term trends. Slower than EMA but simpler.',
    importance: 'helpful',
  },
  ema: {
    term: 'EMA (Exponential Moving Average)',
    definition: 'A moving average that gives more weight to recent prices than older prices.',
    howToUse:
      'EMA reacts faster to price changes than SMA. Use EMA(12) and EMA(26) crossovers to identify momentum changes early. Faster at catching trends but can give false signals in choppy markets.',
    importance: 'helpful',
  },
  rsi: {
    term: 'RSI (Relative Strength Index)',
    definition: 'An oscillator (0-100) measuring momentum. Values above 70 suggest overbought; below 30 suggest oversold.',
    howToUse:
      'Buy when RSI exits oversold (crosses above 30). Sell when RSI exits overbought (crosses below 70). RSI helps time mean reversion trades - catches exhausted moves likely to reverse.',
    importance: 'helpful',
  },
  macd: {
    term: 'MACD (Moving Average Convergence Divergence)',
    definition: 'A momentum indicator combining two EMAs to show trend direction and strength.',
    howToUse:
      'Buy when MACD crosses above its signal line. Sell when MACD crosses below. Rising MACD confirms uptrends; falling MACD confirms downtrends. Great for trend confirmation.',
    importance: 'helpful',
  },
  bollingerBands: {
    term: 'Bollinger Bands',
    definition: 'Upper and lower bands (±2 standard deviations) around a moving average, showing volatility extremes.',
    howToUse:
      'Price outside bands is extreme and likely to revert. Buy below lower band (oversold). Sell above upper band (overbought). Narrow bands mean low volatility; wide bands mean high volatility.',
    importance: 'helpful',
  },
  donchian: {
    term: 'Donchian Channels',
    definition: 'Channels based on the highest high and lowest low over a lookback period (e.g., 20 bars).',
    howToUse:
      'Buy when price breaks above the upper channel (breakout). Sell when price breaks below the lower channel. Used in trend-following strategies to catch momentum moves.',
    importance: 'helpful',
  },
  roc: {
    term: 'ROC (Rate of Change)',
    definition: 'The percentage change in price relative to a lookback period (e.g., 12 periods ago).',
    howToUse:
      'Rising ROC confirms accelerating uptrends; falling ROC confirms accelerating downtrends. Use ROC threshold crosses to time entries and exits. Higher values = stronger momentum.',
    importance: 'helpful',
  },
  meanReversion: {
    term: 'Mean Reversion',
    definition: 'The theory that prices tend to return to their average after extreme moves.',
    howToUse:
      'Buy when price falls significantly below average. Sell when price rises significantly above average. Expect it to revert toward middle. Works well in range-bound markets.',
    importance: 'helpful',
  },
  trendFollowing: {
    term: 'Trend Following',
    definition: 'A strategy that rides existing trends (up or down) rather than betting on reversals.',
    howToUse:
      'Buy when uptrend is confirmed. Sell when uptrend weakens. Hold through the trend direction. Requires patience but can capture large moves. Works well in trending markets.',
    importance: 'helpful',
  },
  crossover: {
    term: 'Crossover Signal',
    definition: 'When one indicator/price crosses another, often signaling a shift in momentum or trend.',
    howToUse:
      'Fast MA crossing above slow MA = buy signal. Fast MA crossing below slow MA = sell signal. Crossovers help automate trade timing. Look for confirming signals to reduce false positives.',
    importance: 'helpful',
  },
  overbought: {
    term: 'Overbought',
    definition: 'When price has risen so much that it may be due for a pullback or reversal soon.',
    howToUse:
      'Overbought often indicates a good selling opportunity (sell signal). However, overbought can persist in strong uptrends. Combine with other signals to avoid early exits.',
    importance: 'helpful',
  },
  oversold: {
    term: 'Oversold',
    definition: 'When price has fallen so much that it may be due for a bounce or reversal up.',
    howToUse:
      'Oversold often indicates a good buying opportunity (buy signal). However, oversold can persist in strong downtrends. Confirm with other signals before buying.',
    importance: 'helpful',
  },
  trade: {
    term: 'Trade',
    definition: 'A complete transaction: buying an asset and later selling it (or vice versa).',
    howToUse:
      'Each trade generates a P&L. Track every trade to analyze performance. Learn from winning trades (what worked?) and losing trades (what failed?) to improve your strategy.',
    importance: 'critical',
  },
  buySignal: {
    term: 'Buy Signal',
    definition: 'A condition where the strategy determines you should purchase an asset.',
    howToUse:
      'When a buy signal triggers (e.g., SMA crossover), place a market order to enter the trade. Check you have enough cash. Each buy signal should align with your trading rules.',
    importance: 'critical',
  },
  sellSignal: {
    term: 'Sell Signal',
    definition: 'A condition where the strategy determines you should sell/exit a position.',
    howToUse:
      'When a sell signal triggers, immediately sell your position to lock in profit or cut losses. Only sell if you have positions to sell. Use profit targets and stop losses to automate.',
    importance: 'critical',
  },
  takeProfit: {
    term: 'Take Profit / Target',
    definition: 'A price level where you plan to exit a winning trade to lock in profits.',
    howToUse:
      'Set take profit at a level that makes sense: Long on AAPL at $150, set take profit at $155 (+$5). When price hits $155, exit and realize the profit.',
    importance: 'important',
  },
  stopLoss: {
    term: 'Stop Loss',
    definition: 'A price level where you exit a losing trade to limit maximum damage.',
    howToUse:
      'Protect yourself: Buy AAPL at $150, set stop loss at $145 (-$5). If price drops to $145, auto-exit. Prevents small losses from becoming huge losses. Always use stops.',
    importance: 'important',
  },
  volatility: {
    term: 'Volatility',
    definition: 'How much price fluctuates. High volatility = big price swings; low volatility = small swings.',
    howToUse:
      'High volatility creates larger opportunities but also larger risks. Adjust position size based on volatility. Use wider stops in high volatility, tighter in low volatility.',
    importance: 'important',
  },
  sharpeRatio: {
    term: 'Sharpe Ratio',
    definition: 'A metric comparing your returns to how risky they were (return per unit of risk taken).',
    howToUse:
      'Higher Sharpe ratio is better - means you earned more return for the risk you took. Use to compare two strategies: one with 50% return/20% drawdown vs. 30% return/10% drawdown. Second has better risk-adjusted returns.',
    importance: 'important',
  },
  tradingCost: {
    term: 'Trading Cost / Slippage',
    definition: 'The loss you incur from bid-ask spreads and execution impact when entering/exiting trades.',
    howToUse:
      'Minimize costs by trading liquid assets with tight spreads. Use limit orders instead of market orders when possible. In high-frequency trading, costs can make or break profitability.',
    importance: 'important',
  },
};

export function getTradingGlossary(term: string): GlossaryEntry | undefined {
  return tradingGlossary[term];
}

const glossaryAliases: Record<string, string> = {
  'moving-average': 'sma',
  'trend': 'trendFollowing',
  'mean-reversion': 'meanReversion',
  'bollinger-bands': 'bollingerBands',
  'donchian-channel': 'donchian',
  'signal-line': 'macd',
  'exponential': 'ema',
};

const fallbackDefinitions: Record<string, string> = {
  bullish: 'a market bias expecting prices to rise.',
  bearish: 'a market bias expecting prices to fall.',
  momentum: 'the speed and strength of recent price moves.',
  extremes: 'price moves far away from a recent average.',
  'standard-deviation': 'a measure of how spread out prices are.',
  breakout: 'a move beyond a recent range or resistance.',
  resistance: 'a price area where sellers often appear.',
  support: 'a price area where buyers often appear.',
  acceleration: 'an increase in the rate of price change.',
  'pairs-trading': 'trading two related assets to capture relative mispricing.',
  correlation: 'how closely two assets move together.',
  'market-neutral': 'positioning to reduce exposure to overall market direction.',
  'z-score': 'a standardized distance from a mean, measured in standard deviations.',
};

export function getDefinition(term: string): string {
  const key = glossaryAliases[term] ?? term;
  const entry = tradingGlossary[key];
  if (entry) return entry.definition;
  return fallbackDefinitions[term] ?? `definition for "${term.replace(/-/g, ' ')}" will be added soon.`;
}

export const tradingTermCategories = {
  markets: ['symbol', 'bid', 'ask', 'spread', 'volume', 'liquidity'],
  orders: ['marketOrder', 'limitOrder'],
  portfolio: ['portfolio', 'cash', 'position', 'pnl', 'pnlPercent', 'winRate', 'maxDrawdown'],
  indicators: ['sma', 'ema', 'rsi', 'macd', 'bollingerBands', 'donchian', 'roc'],
  strategies: ['meanReversion', 'trendFollowing', 'crossover', 'overbought', 'oversold'],
  execution: ['trade', 'buySignal', 'sellSignal', 'takeProfit', 'stopLoss'],
  performance: ['volatility', 'sharpeRatio', 'tradingCost'],
};
