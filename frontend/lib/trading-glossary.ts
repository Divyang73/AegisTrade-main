/**
 * Trading and Finance Glossary
 * Definitions for common terms used in the algorithm trading simulator
 */

export const tradingGlossary: Record<string, string> = {
  // Performance Metrics
  pnl: 'Profit and Loss - The total gain or loss from all trades, calculated as (final portfolio value - initial investment)',
  'win-rate': 'Win Rate - The percentage of trades that were profitable (winning trades / total trades)',
  sharpe: 'Sharpe Ratio - Measures risk-adjusted returns. Higher is better. Formula: (return - risk_free_rate) / volatility. Typical range: 0-3',
  sortino: 'Sortino Ratio - Like Sharpe Ratio but only penalizes downside volatility, ignoring upside swings',
  drawdown: 'Drawdown - The largest peak-to-trough decline in portfolio value. Shows worst-case loss scenario',
  'max-drawdown': 'Maximum Drawdown - The worst peak-to-trough decline experienced during the entire period',
  'avg-trade': 'Average Trade - Mean profit/loss per trade. Helps evaluate consistency of the strategy',
  'win-loss-ratio': 'Win/Loss Ratio - Average profit on winners divided by average loss on losers. Higher is better',
  
  // Order Types & Mechanics
  'limit-order': 'Limit Order - Buy/sell at a specific price or better. May not execute if price target not reached',
  'market-order': 'Market Order - Buy/sell immediately at the best current price. Executes fast but price is not guaranteed',
  'order-book': 'Order Book - Live list of all buy orders (bids) and sell orders (asks) waiting to be filled',
  bid: 'Bid - The highest price a buyer is willing to pay for an asset',
  ask: 'Ask - The lowest price a seller is willing to accept for an asset',
  spread: 'Bid-Ask Spread - The difference between bid and ask prices. Wider spreads = less liquidity',
  'fill-price': 'Fill Price - The actual price at which your order was executed',
  slippage: 'Slippage - The difference between expected execution price and actual price. Higher in volatile markets',
  
  // Technical Analysis
  sma: 'Simple Moving Average (SMA) - Average closing price over N periods. Lags price but smooth and reliable',
  ema: 'Exponential Moving Average (EMA) - Moving average that gives more weight to recent prices. Reacts faster than SMA',
  'moving-average': 'Moving Average - Rolling average of prices over a lookback window. Smooths out noise to show trend',
  crossover: 'Crossover - When one indicator line crosses another. Often signals trend changes',
  rsi: 'Relative Strength Index (RSI) - Momentum oscillator measuring speed of price changes. Range: 0-100. Overbought >70, Oversold <30',
  macd: 'MACD (Moving Average Convergence/Divergence) - Trend-following momentum indicator using two EMAs and a signal line',
  'signal-line': 'Signal Line - Typically a 9-period EMA of MACD. Crossovers with MACD generate trading signals',
  'bollinger-bands': 'Bollinger Bands - Upper and lower bands based on moving average ±2 standard deviations. Shows volatility levels',
  'standard-deviation': 'Standard Deviation (σ) - Measures how much prices deviate from the average. Higher = more volatility',
  'donchian-channel': 'Donchian Channel - Highest high and lowest low over N periods. Used for breakout trading',
  roc: 'Rate of Change (ROC) - Percentage change in price over a lookback period. Positive = uptrend, Negative = downtrend',
  
  // Trend & Market Concepts
  trend: 'Trend - The general direction of price movement. Can be uptrend, downtrend, or sideways (ranging)',
  bullish: 'Bullish - Expecting or indicating upward price movement. Bull markets go up',
  bearish: 'Bearish - Expecting or indicating downward price movement. Bear markets go down',
  momentum: 'Momentum - The strength and speed of price movement. High momentum = fast moves in one direction',
  volatility: 'Volatility - Degree of price fluctuation. Low = stable, High = rapid large swings',
  breakout: 'Breakout - Price breaks above resistance or below support. Often signals trend acceleration',
  resistance: 'Resistance - Price level where selling pressure increases, preventing further upside',
  support: 'Support - Price level where buying pressure increases, preventing further downside',
  
  // Statistics & Risk
  'z-score': 'Z-Score - Measures how many standard deviations a value is from the mean. ±2 = extreme, ±3 = very extreme',
  correlation: 'Correlation - Relationship between two assets. +1 = move together, 0 = unrelated, -1 = move opposite',
  beta: 'Beta - Sensitivity to market movements. Beta > 1 = more volatile than market, Beta < 1 = less volatile',
  'risk-reward': 'Risk/Reward - Ratio of potential profit to potential loss. Higher ratios are better',
  'position-size': 'Position Size - Number of shares/contracts held. Affects risk exposure and capital allocation',
  diversification: 'Diversification - Spreading capital across different assets to reduce risk',
  
  // Portfolio & Execution
  portfolio: 'Portfolio - Collection of all positions and cash held by a trader/algorithm',
  position: 'Position - Ownership stake in an asset. Long = own it, Short = owe it',
  'cash-balance': 'Cash Balance - Available capital not deployed in positions. Used to fund new trades',
  'equity-curve': 'Equity Curve - Chart showing total portfolio value over time. Shows strategy profitability visually',
  'holding-period': 'Holding Period - How long a position is held from entry to exit. Day trades = < 1 day, Swing = days/weeks',
  leverage: 'Leverage - Using borrowed money to increase position size. Amplifies gains and losses',
  
  // Strategy Characteristics
  'trend-following': 'Trend Following - Buy winners and sell losers, riding the trend. Works in trending markets, fails in ranging',
  'mean-reversion': 'Mean Reversion - Buy losers and sell winners, betting on reversion to average. Works in ranging markets, fails in trends',
  scalping: 'Scalping - Very short time-frame trading capitalizing on small price movements many times per day',
  'swing-trading': 'Swing Trading - Medium-term trading (days to weeks) capitalizing on swings in price',
  'pairs-trading': 'Pairs Trading - Hold long position in one asset and short position in related asset. Market-neutral strategy',
  'algorithmic-trading': 'Algorithmic Trading - Using automated rules/code to make trade decisions instead of manual trading',
  backtest: 'Backtest - Testing a strategy on historical data to evaluate past performance. Not guarantee of future results',
  
  // Market Hours & Timing
  'intraday': 'Intraday - Trading within a single trading day, exiting before market close',
  'inter-day': 'Inter-day - Holding positions across multiple trading days or longer',
  'market-hours': 'Market Hours - When an exchange is open for trading. US stocks 9:30-16:00 ET',
  'after-hours': 'After-hours - Trading that occurs outside regular market hours. Usually lower liquidity',
  
  // Data & Simulation
  'historical-data': 'Historical Data - Past price and volume information used to backtest strategies',
  simulation: 'Simulation - Running strategy logic on historical data to see what would have happened',
  snapshot: 'Snapshot - A point-in-time view of market data. In simulator, ticks occur at regular intervals',
  tick: 'Tick - A single price update for a symbol. Multiple ticks per second in real trading',
  bar: 'Bar - Price data aggregated over a period (minute bar, hourly bar, daily bar shows OHLCV)',
  ohlcv: 'OHLCV - Open, High, Low, Close, Volume. Standard market data format',
  volume: 'Volume - Number of shares/contracts traded in a period. Higher = more activity and liquidity',
  
  // Algorithms in This Simulator
  'sma-crossover': 'SMA Crossover - Buys when fast SMA crosses above slow SMA, sells on opposite cross. Beginner-friendly trend follower',
  'rsi-strategy': 'RSI Strategy - Buys when RSI crosses above 30 (oversold), sells when it crosses below 70 (overbought). Mean reversion',
  'ema-crossover': 'EMA Crossover - Like SMA Crossover but uses faster-reacting EMAs. Better for trending markets',
  'bollinger-strategy': 'Bollinger Strategy - Buys below lower band (oversold), sells above upper band (overbought). Mean reversion on volatility',
  'macd-strategy': 'MACD Strategy - Buys when MACD crosses above signal line, sells on opposite cross. Momentum-based trend following',
  'donchian-strategy': 'Donchian Strategy - Buys on breakout above 20-bar high, sells on break below 20-bar low. Breakout strategy',
  'roc-strategy': 'ROC Strategy - Buys when momentum spikes above +0.5%, sells when it drops below -0.5%. Momentum acceleration',
  'pairs-strategy': 'Pairs Strategy - Trades correlated assets on spread divergence. Market-neutral hedged positions',
  
  // Market Maker Specific
  'market-maker': 'Market Maker - Provides liquidity by posting buy/sell quotes. Profits from bid-ask spread',
  'adaptive-spread': 'Adaptive Spread - Spread that changes based on market conditions (like volatility). Wider in volatile markets',
  'rolling-volatility': 'Rolling Volatility - Volatility measured over a recent window (e.g., last 20 bars). More responsive to current conditions',
  inventory: 'Inventory - Shares held by market maker. Used to fulfill customer orders',
  liquidity: 'Liquidity - How easily an asset can be bought/sold without moving price significantly',
};

export function getDefinition(term: string): string {
  return tradingGlossary[term.toLowerCase().replace(/\s+/g, '-')] || 'Term not found in glossary';
}
