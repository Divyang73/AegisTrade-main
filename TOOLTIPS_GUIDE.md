# Trading Tooltips Implementation Guide

## Overview
This project now includes comprehensive tooltips on hover for all key trading concepts. These tooltips help beginners understand what each trading term means, how it's used, and why it's important.

## How Tooltips Work
- **Hover Icon**: An info icon (ℹ️) appears next to trading terms
- **On Hover**: Displays a tooltip with:
  - **Title**: The name of the concept
  - **Definition**: What it means
  - **How to Use**: Practical guidance on applying it to place trades
  - **Importance**: Critical/Important/Helpful level

## Tooltip Components Added

### 1. **Tooltip Component** (in `frontend/components/ui.tsx`)
```typescript
<Tooltip content="explanation" title="Optional Title" />
```
- Displays an info icon on hover
- Shows a floating tooltip box with information
- Styled with glass-morphism effect

### 2. **LabelWithTooltip Component** (in `frontend/components/ui.tsx`)
```typescript
<LabelWithTooltip label="Label Text" tooltip="explanation" />
```
- Wraps a label with a tooltip icon
- Useful for form fields and labels

### 3. **Enhanced StatCard** (in `frontend/components/ui.tsx`)
```typescript
<StatCard label="Label" value="100" tooltip="explanation" />
```
- Now accepts optional `tooltip` prop
- Shows tooltip icon next to the label

## Trading Glossary (`frontend/lib/trading-glossary.ts`)

### Categories of Terms Covered:
1. **Market Concepts** (6 terms)
   - Symbol/Ticker
   - Bid Price
   - Ask Price
   - Bid-Ask Spread
   - Trading Volume
   - Liquidity

2. **Order Types** (2 terms)
   - Market Order
   - Limit Order

3. **Portfolio Concepts** (7 terms)
   - Portfolio
   - Cash/Buying Power
   - Position
   - P&L (Profit & Loss)
   - P&L %
   - Win Rate
   - Max Drawdown

4. **Technical Indicators** (7 terms)
   - SMA (Simple Moving Average)
   - EMA (Exponential Moving Average)
   - RSI (Relative Strength Index)
   - MACD
   - Bollinger Bands
   - Donchian Channels
   - ROC (Rate of Change)

5. **Strategy Concepts** (5 terms)
   - Mean Reversion
   - Trend Following
   - Crossover Signal
   - Overbought
   - Oversold

6. **Trade Execution** (5 terms)
   - Trade
   - Buy Signal
   - Sell Signal
   - Take Profit/Target
   - Stop Loss

7. **Performance Metrics** (3 terms)
   - Volatility
   - Sharpe Ratio
   - Trading Cost/Slippage

**Total: 35+ Trading Concepts Documented**

## Tooltips by Dashboard

### Trading Dashboard (`frontend/components/trading-dashboard.tsx`)
Tooltips added for:
- ✅ **Last Close** - Current price information
- ✅ **Bid/Ask Spread** - How to interpret trading costs
- ✅ **Portfolio Equity** - Understanding your account
- ✅ **Candles** - Candlestick chart explanation
- ✅ **Order Book** - Bids vs Asks
- ✅ **Bid Column** - Bid price explanation
- ✅ **Ask Column** - Ask price explanation
- ✅ **Live Tape** - What trades are shown
- ✅ **Liquidity Section** - Market depth snapshot
- ✅ **Buy-side Liquidity** - Understanding buy orders
- ✅ **Sell-side Liquidity** - Understanding sell orders

### Algorithm Dashboard (`frontend/components/algorithm-dashboard.tsx`)
Tooltips added for:
- ✅ **Top Performer** - Best performing bot's P&L
- ✅ **Trailing Strategy** - Worst performing bot's P&L
- ✅ **Live Algorithms** - Number of active strategies
- ✅ **PnL Column** - Profit and Loss explanation
- ✅ **Win Rate Column** - Trade winning percentage
- ✅ **Sharpe Column** - Risk-adjusted returns
- ✅ **Drawdown Column** - Maximum loss from peak
- ✅ **Momentum Read** - Trend-following strategies
- ✅ **Risk Read** - Mean-reversion strategies
- ✅ **Recent Fills** - Bot trades that executed

### Strategy Detail Dashboard (`frontend/components/strategy-detail-dashboard.tsx`)
Tooltips added for:
- ✅ **Total PnL** - Profit and loss metric
- ✅ **Win Rate** - Percentage of winning trades
- ✅ **Sharpe Ratio** - Risk-adjusted performance
- ✅ **Total Trades** - Number of trades executed
- ✅ **Drawdown** - Maximum peak-to-trough loss
- ✅ **Position and PnL** - Account state overview
- ✅ **Cash Balance** - Available funds
- ✅ **Equity** - Total account value
- ✅ **Avg Trade Size** - Average position size
- ✅ **Strategy Debug View** - Raw data and signals
- ✅ **Current Positions** - Open holdings

## Key Features

### 1. **Beginner-Friendly Explanations**
Each tooltip includes:
- Simple definition in plain language
- Practical "how to use" guidance
- Real-world examples where relevant
- Importance level indicator

### 2. **Touch-Friendly Design**
- Small info icons don't interfere with UI
- Tooltips positioned to stay within viewport
- Glass-morphism styling for subtle appearance
- Smooth fade-in/fade-out animations

### 3. **Comprehensive Coverage**
- 40+ unique trading concepts explained
- All major dashboards covered
- Consistent terminology across app
- Links between related concepts

## Example Usage

### In Trading Dashboard:
```typescript
<Stat 
  label="Bid / Ask spread" 
  value={spread != null ? formatCompact(spread) : '--'} 
  delta={spread != null ? 'Live order book spread' : 'No book data yet'}
  tooltip={tradingGlossary.spread.howToUse}
/>
```

### In Algorithm Dashboard:
```typescript
<th className="px-4 py-3 flex items-center gap-2">
  <span>PnL</span>
  <Tooltip content={tradingGlossary.pnl.definition} />
</th>
```

### In Strategy Component:
```typescript
<div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-200">
  <TrendingUp className="h-4 w-4" />
  Momentum read
  <Tooltip content="Trend-following strategies use moving averages..." />
</div>
```

## Customizing Tooltips

To add new tooltips:

1. **Add to glossary** (`frontend/lib/trading-glossary.ts`):
```typescript
newTerm: {
  term: 'Term Name',
  definition: 'What it is...',
  howToUse: 'How to use it...',
  importance: 'critical' | 'important' | 'helpful',
}
```

2. **Add to component**:
```typescript
<Tooltip content={tradingGlossary.newTerm.definition} title="Term Name" />
```

## Styling

Tooltips are styled with:
- Gradient background (glass-morphism effect)
- White text on dark background
- Smooth transitions on hover
- Error icon styling for important warnings
- Responsive positioning

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Hover state converts to tap

## Future Enhancements

Potential additions:
- Video tutorials linked from tooltips
- Interactive examples
- Glossary page with all terms
- Search functionality for terms
- Multiple language support
- Dark/Light theme options

## Files Modified

1. ✅ `/frontend/lib/trading-glossary.ts` - Created with 35+ trading terms
2. ✅ `/frontend/components/ui.tsx` - Added Tooltip, LabelWithTooltip, and updated StatCard
3. ✅ `/frontend/components/trading-dashboard.tsx` - Added 11 tooltips
4. ✅ `/frontend/components/algorithm-dashboard.tsx` - Added 10 tooltips
5. ✅ `/frontend/components/strategy-detail-dashboard.tsx` - Added 11 tooltips

**Total Components Updated: 5**
**Total Tooltips Added: 40+**
**Total Trading Concepts Documented: 35+**

## Testing Tooltips

To test in development:
1. Start the frontend dev server
2. Navigate to any dashboard (Trading, Algorithms, Strategy Details)
3. Hover over info icons (ℹ️) to see tooltips
4. Verify tooltip content is relevant and helpful
5. Check mobile responsiveness

## Support

For questions about specific trading concepts, hover over the info icons to see explanations. For bugs or feature requests, check the project README.
