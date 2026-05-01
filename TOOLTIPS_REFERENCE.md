# Quick Reference: Tooltip Locations

## Trading Dashboard (`/trading`)

| Tooltip | Term/Concept | Location | Component |
|---------|-------------|----------|-----------|
| Last market price & volume info | Price Update | Top stat card | Stat component |
| Bid-Ask spread explanation | Spread | Top stat card | Stat component |
| Portfolio equity & breakdown | Portfolio Overview | Top stat card | Stat component |
| Candlestick chart, green/red candles | Price Action | Chart header | Panel |
| Bids definition | Order Book - Bids | Order book section | Grid |
| Asks definition | Order Book - Asks | Order book section | Grid |
| Trade execution & time | Live Tape | Trade feed | Panel |
| Market depth & liquidity levels | Liquidity Overview | Liquidity panel | Panel |
| Buy orders available | Buy-side Liquidity | Liquidity grid | Panel |
| Sell orders available | Sell-side Liquidity | Liquidity grid | Panel |

**Total Tooltips on Trading Page: 11**

---

## Algorithm Dashboard (`/algorithms`)

| Tooltip | Metric | Location | Component |
|---------|--------|----------|-----------|
| Best performing strategy's P&L | PnL Definition | Top stat card | StatCard |
| Worst strategy's P&L | PnL Definition | Top stat card | StatCard |
| Number of active trading bots | Active Algorithms | Top stat card | StatCard |
| Profit/Loss metric | PnL Column Header | Comparison table | Table header |
| Winning trade percentage | Win Rate Column Header | Comparison table | Table header |
| Risk-adjusted returns | Sharpe Column Header | Comparison table | Table header |
| Max peak-to-trough loss | Drawdown Column Header | Comparison table | Table header |
| Trend-following strategies explanation | Momentum Read | Strategy types panel | Info box |
| Mean-reversion & risk metrics | Risk Read | Strategy types panel | Info box |
| Bot trade execution details | Recent Fills | Trade feed header | Panel |

**Total Tooltips on Algorithm Page: 10**

---

## Strategy Detail Dashboard (`/algorithms/[slug]`)

| Tooltip | Metric | Location | Component |
|---------|--------|----------|-----------|
| Total profit/loss | Total PnL | Metrics grid | StatCard |
| Winning trades percentage | Win Rate | Metrics grid | StatCard |
| Risk-adjusted performance | Sharpe Ratio | Metrics grid | StatCard |
| Total trades executed | Total Trades | Metrics grid | StatCard |
| Maximum loss percentage | Drawdown | Metrics grid | StatCard |
| Account cash & equity & trades | Position & PnL | Right panel header | Panel |
| Available dollars to trade | Cash Balance | Account state box | Info box |
| Total account value | Equity | Account state box | Info box |
| Average position size | Avg Trade Size | Account state box | Info box |
| Input data & signals & decisions | Debug Info | Debug section header | Panel |
| Current holdings & quantities | Current Positions | Positions table header | Panel |

**Total Tooltips on Strategy Detail Page: 11**

---

## All Trading Glossary Terms

### Market Concepts (6 terms)
- `symbol` - Stock ticker code
- `bid` - Highest buyer price
- `ask` - Lowest seller price
- `spread` - Bid-ask difference
- `volume` - Total shares traded
- `liquidity` - Ease of buying/selling

### Order Types (2 terms)
- `marketOrder` - Buy/sell immediately
- `limitOrder` - Buy/sell at target price

### Portfolio Metrics (7 terms)
- `portfolio` - Your holdings & cash
- `cash` - Available funds
- `position` - Current holdings
- `pnl` - Profit/loss amount
- `pnlPercent` - Profit/loss percentage
- `winRate` - Winning trades %
- `maxDrawdown` - Worst loss from peak

### Technical Indicators (7 terms)
- `sma` - Simple moving average
- `ema` - Exponential moving average
- `rsi` - Relative strength index
- `macd` - Momentum indicator
- `bollingerBands` - Volatility bands
- `donchian` - Price channels
- `roc` - Rate of change

### Strategy Types (5 terms)
- `meanReversion` - Buy dips, sell peaks
- `trendFollowing` - Ride the trend
- `crossover` - Moving average cross
- `overbought` - Price too high
- `oversold` - Price too low

### Trade Execution (5 terms)
- `trade` - Buy then sell (or vice versa)
- `buySignal` - When to buy
- `sellSignal` - When to sell
- `takeProfit` - Profit exit level
- `stopLoss` - Loss exit level

### Performance Metrics (3 terms)
- `volatility` - Price swings
- `sharpeRatio` - Return per risk unit
- `tradingCost` - Spread & slippage cost

---

## How to Find Tooltips

### By Page
1. **Trading Page** - Look for info icons next to:
   - Top stat cards
   - Section headers (Candles, Order book, Liquidity)
   - Column headers (Bids, Asks)

2. **Algorithm Page** - Look for info icons next to:
   - Top stat cards
   - Table column headers
   - Info boxes (Momentum read, Risk read)
   - Feed section headers

3. **Strategy Detail Page** - Look for info icons next to:
   - Metrics (PnL, Win Rate, Sharpe, etc.)
   - Account boxes (Cash, Equity, Avg Trade Size)
   - Section headers (Debug view, Positions)

### By Concept
1. Search the page (Ctrl+F) for the concept name
2. Look for the info icon next to it
3. Hover over the icon to see the tooltip

---

## Tooltip Design

### Visual Elements
- **Icon**: Small `ℹ️` (info icon) in subtle gray
- **On Hover**: Becomes more opaque
- **Tooltip Box**: Rounded with glass-morphism effect
- **Arrow**: Points back to the icon

### Content Structure
```
═══════════════════
  Title (optional)
═══════════════════
Definition (1-2 sentences)
How to use it (practical example)
═══════════════════
```

### Styling
- Background: Semi-transparent white/gradient
- Text: White on dark
- Shadows: Subtle glow effect
- Animation: 200ms fade in/out
- Max width: Wraps text for readability

---

## Implementation Notes

### Adding New Tooltips
1. Define term in `trading-glossary.ts`
2. Import `Tooltip` or `LabelWithTooltip` from `ui.tsx`
3. Add `<Tooltip content={definition} />` next to the term
4. Update this reference guide

### Editing Existing Tooltips
1. Find term in `trading-glossary.ts`
2. Update `definition` or `howToUse` field
3. All instances automatically update

### Testing
- Hover over each icon to verify content
- Check on mobile (hover becomes tap)
- Verify tooltips don't overflow screen edges
- Test with keyboard navigation (Tab + Enter)

---

## Performance Considerations

- **Bundle Size**: Trading glossary adds ~8KB
- **Load Time**: No impact (synchronous)
- **Memory**: Minimal (lazy tooltips only render on hover)
- **SEO**: No impact (tooltips are interactive only)

---

**Generated: May 2026**
**Last Updated: Tooltips v1.0**
**Status: ✅ Complete & Ready for Production**
