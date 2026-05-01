# Trading Tooltips - Visual Guide for Beginners

## What Are Tooltips?

Tooltips are **helpful information boxes that appear when you hover your mouse over the ℹ️ (info) icon**.

When you see this icon: **ℹ️**

Hover over it to learn what that trading term means!

---

## Where to Find Tooltips

### 1️⃣ Trading Dashboard (`/trading`)

#### Top Section - Quick Stats
```
┌─────────────────────────────────────┐
│ Last close ℹ️                       │
│ $150.25                             │
│ AAPL • 2.5M vol                     │
└─────────────────────────────────────┘

👉 Hover over ℹ️ to learn:
   - What price means
   - How it impacts your trades
   - Why volume matters
```

#### Order Book Section
```
┌──────────────────────────────────┐
│ Order book ℹ️                    │
│                                  │
│ Bids ℹ️          │    Asks ℹ️    │
│ $150.10 • 5k    │   $150.50 • 3k │
│ $150.05 • 2k    │   $150.75 • 7k │
└──────────────────────────────────┘

👉 Hover to learn:
   - Bids: What buyers are willing to pay
   - Asks: What sellers want
   - The difference = your trading cost
```

#### Liquidity Panel
```
┌──────────────────────────────────┐
│ Liquidity ℹ️                     │
│                                  │
│ Buy-side ℹ️  │  Sell-side ℹ️    │
│ 15 levels   │  12 levels         │
└──────────────────────────────────┘

👉 Hover to learn:
   - How many buyers/sellers exist
   - How easy it is to trade
```

---

### 2️⃣ Algorithm Dashboard (`/algorithms`)

#### Top Metrics
```
┌─────────────────────────────────────┐
│ Top performer ℹ️                   │
│ +$5,234.50                          │
│ SMA Crossover Strategy              │
│                                     │
│ Win Rate ℹ️    Sharpe ℹ️  Drawdown ℹ️│
│ 62%            1.8       -8%        │
└─────────────────────────────────────┘

👉 Hover to learn:
   - PnL: How much money the bot made/lost
   - Win Rate: What % of trades were profitable
   - Sharpe: Was it worth the risk taken?
   - Drawdown: What was the worst loss?
```

#### Comparison Table
```
┌────────┬──────┬────────┬──────────┬────────┐
│ Algorithm       │ PnL ℹ️ │ Win Rate │ Sharpe │
├────────┬──────┼────────┼──────────┼────────┤
│ SMA    │ +$5k │ 62%    │ 1.8      │ -8%    │
│ RSI    │ -$1k │ 58%    │ -0.5     │ -15%   │
│ MACD   │ +$2k │ 71%    │ 2.1      │ -5%    │
└────────┴──────┴────────┴──────────┴────────┘

👉 Hover over column headers for explanations
```

#### Strategy Types Info
```
┌──────────────────────────────────┐
│ 📈 Momentum Read ℹ️               │
│ Trend-following strategies in    │
│ SMA, EMA, MACD, Donchian...      │
│                                  │
│ 📉 Risk Read ℹ️                  │
│ Mean-reversion strategies in     │
│ RSI, Bollinger, mean-reversion...│
└──────────────────────────────────┘

👉 Hover to learn the strategy type differences
```

---

### 3️⃣ Strategy Detail Dashboard (`/algorithms/[name]`)

#### Performance Metrics
```
┌──────────┬──────────┬──────────┬────────────┐
│ Total PnL │ Win Rate │ Sharpe   │ Drawdown   │
│ ℹ️        │ ℹ️       │ ℹ️       │ ℹ️         │
├──────────┼──────────┼──────────┼────────────┤
│ +$4,231  │ 65%      │ 1.95     │ -7.2%      │
└──────────┴──────────┴──────────┴────────────┘

👉 Each metric has a tooltip explaining:
   - What it measures
   - How to interpret it
   - Why it matters
```

#### Account State
```
┌─────────────────────────────┐
│ Position and PnL ℹ️         │
│                             │
│ Cash Balance ℹ️             │
│ $23,450.00                  │
│                             │
│ Equity ℹ️                   │
│ $45,800.00                  │
│                             │
│ Avg Trade Size ℹ️           │
│ $2,340.00                   │
└─────────────────────────────┘

👉 Hover to understand:
   - Available money to trade
   - Total account value
   - Average position size
```

#### Current Positions
```
┌──────────┬─────┬─────────┐
│ Symbol   │ Qty │ Value   │ ← Current positions ℹ️
├──────────┼─────┼─────────┤
│ AAPL     │ 100 │ $15,00  │
│ MSFT     │ 50  │ $9,000  │
│ TSLA     │ 20  │ $5,200  │
└──────────┴─────┴─────────┘

👉 Hover to learn:
   - What a position means
   - How quantity affects profit/loss
```

---

## What Each Tooltip Teaches You

### 🎯 Market Concepts
**When you see these, hover to learn:**
- What is a **Symbol**? (Stock ticker)
- What is a **Bid**? (Buyer's price)
- What is an **Ask**? (Seller's price)
- What is a **Spread**? (The gap = your cost)
- What is **Volume**? (How busy the market is)
- What is **Liquidity**? (How easy to buy/sell)

### 📊 Performance Metrics
**When you see these, hover to learn:**
- **P&L**: Money made or lost
- **Win Rate**: % of winning trades
- **Sharpe Ratio**: Good returns for the risk?
- **Drawdown**: Worst loss from the peak
- **Average Trade Size**: How big are positions?

### 📈 Technical Indicators
**When you see these, hover to learn:**
- **SMA/EMA**: Moving averages (trend detection)
- **RSI**: Overbought/oversold levels
- **MACD**: Momentum indicator
- **Bollinger Bands**: Volatility levels
- **Donchian Channels**: Price breakouts
- **ROC**: Rate of change

### 🎲 Strategy Types
**When you see these, hover to learn:**
- **Trend Following**: Riding existing trends up/down
- **Mean Reversion**: Buying dips, selling peaks
- **Crossover Signals**: When averages cross
- **Overbought**: Price likely to drop soon
- **Oversold**: Price likely to rise soon

---

## Typical User Journey

### Step 1: First Time on Dashboard
```
You see the trading dashboard and notice questions:
"What does Bid/Ask spread mean?"
"Why does liquidity matter?"
"What's in this order book?"
```

### Step 2: Find the Info Icons
```
You look for ℹ️ icons near these labels
You see them next to:
✅ "Last close"
✅ "Bid / Ask spread"
✅ "Portfolio equity"
✅ "Order book"
✅ "Liquidity"
```

### Step 3: Hover and Learn
```
Move your mouse over: ℹ️

A box appears with:
📌 Title: What the term is
📝 Definition: What it means
💡 How to Use: When & why to use it
```

### Step 4: Start Trading Smarter
```
Now you understand:
✅ Why bid/ask spread matters
✅ What to look for in liquidity
✅ How to read order books
✅ What your P&L really means
```

---

## Tips for Learning

### 🎓 Best Practices
1. **Hover over concepts as you learn them**
   - Don't skip the tooltips!
   - Each one teaches something important

2. **Read the "How to Use" section**
   - It tells you why this matters for trading
   - Look for practical examples

3. **Reference when confused**
   - Not sure what a metric means?
   - Hover over it instantly!
   - No need to search elsewhere

4. **Learn the terminology**
   - Each tooltip uses real trading language
   - Understanding these helps in real trading

5. **Check importance rating**
   - **Critical**: Must understand before trading
   - **Important**: Helpful to know
   - **Helpful**: Nice to understand

---

## Common Questions Answered by Tooltips

**Q: Should I buy at the Ask or the Bid?**
→ Hover over "Bid" and "Ask" columns to learn

**Q: What does "P&L" mean?**
→ Hover over the "PnL" stat card or column header

**Q: Why does win rate not tell the whole story?**
→ Hover over "Win Rate" to learn about trade size impact

**Q: Is a 2.0 Sharpe ratio good?**
→ Hover over "Sharpe Ratio" for context

**Q: What's the best spread to trade with?**
→ Hover over "Bid / Ask spread" for guidelines

**Q: How much can I lose with max drawdown?**
→ Hover over "Drawdown" to understand risk

---

## Mobile & Tablet Navigation

### On Touch Devices
```
Instead of "hover", use these actions:

📱 Tablet/Mobile:
1. Tap the ℹ️ icon once
2. Tooltip appears on screen
3. Tap elsewhere to close
4. Or tooltip auto-closes after 8 seconds

🖱️ Desktop:
1. Move mouse over ℹ️ icon
2. Tooltip appears instantly
3. Move away to hide
```

---

## Keyboard Navigation

### For Accessibility
```
1. Press Tab to move through elements
2. Press Tab until you reach a ℹ️ icon
3. Press Enter to show tooltip
4. The tooltip reads for screen readers
5. Press Escape to close
```

---

## Next Steps After Learning Tooltips

1. **Understand your trading metrics** by reading tooltips
2. **Visit /learn page** for detailed strategy tutorials
3. **Try paper trading** to apply your knowledge
4. **Review your trades** and understand the metrics
5. **Read strategy pages** linked from algorithm dashboard

---

## Summary

### Why Tooltips Help Beginners
✅ **Fast Learning** - Learn as you go, no waiting
✅ **Contextual Help** - Right info at the right place
✅ **No Guessing** - Every term is explained
✅ **Interactive** - Engage with the app and learn
✅ **Consistent** - Same terms explained everywhere

### Remember
🎯 **Hover over ℹ️ icons to understand trading!**

Every concept is explained in beginner-friendly language. Don't be shy about hovering - it's designed to help you learn!

---

**Happy Learning! 📈**

*For more detailed explanations, visit the Learn section or hover over each metric as you trade.*
