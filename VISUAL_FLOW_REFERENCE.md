# Visual Protocol Flow - Layout Reference

## What You'll See When Running the Market Simulator

```
┌──────────────────────────────────────────────────────────────┐
│                    MARKET SIMULATOR PAGE                      │
└──────────────────────────────────────────────────────────────┘

┌────────────────┐              ┌───────────────────────────────┐
│  Price Charts  │              │  Crash Controls               │
│                │              │  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  📊 mDOT       │              │  │20%│ │40%│ │60%│ │80%│     │
│  📊 mWBTC      │              │  └───┘ └───┘ └───┘ └───┘     │
│  📊 mYLD       │              │                               │
│  📊 mRWA       │              │  [🔥 CRASH MARKET]            │
│                │              │                               │
└────────────────┘              └───────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│         🎬 LIVE PROTOCOL VISUALIZATION (NEW!)                 │
│         Watch how SECP automatically protects your position   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│              ⚡ MARKET CRASH ⚡                                │
│                Token Prices Drop                              │
│                   ↓    ↓    ↓                                 │
│        ┌──────┐  ┌──────┐  ┌──────┐                          │
│        │ 💰   │  │ 🏦   │  │ 🛡️  │                          │
│        │YIELD │  │COLL. │  │HEDGE │                          │
│        │VAULT │  │$51→  │  │POS.  │                          │
│        │      │  │$38   │  │      │                          │
│        └──┬───┘  └──────┘  └──┬───┘                          │
│           │                    │                              │
│           │  ⚠️ HEALTH FACTOR: 114 → 68                       │
│           │     Below 100 = Liquidation Risk!                 │
│           │                    │                              │
│           │         ↓          │                              │
│           │   ┌────────────┐   │                              │
│           │   │ Vault Mode │   │                              │
│           │   │  Switches  │   │                              │
│           │   └─────┬──────┘   │                              │
│           │         ↓          │                              │
│           │  ╔═══════════════════════╗                        │
│           └─→║ 🛡️ ANTI-LIQUIDATION  ║←─┘                      │
│              ║       ACTIVE         ║                         │
│              ║  Protocol Protection ║                         │
│ 💸 Yield →  ║                      ║  ← 🔄 Rebalance         │
│   Redirected ║ ✓ Vault Frozen      ║                         │
│              ║ ✓ Yield → Repayment ║                         │
│              ║ ✓ No Penalty        ║                         │
│              ╚═══════════════════════╝                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STEP 1  │ MockOracle          │ STEP ● EXECUTING            │
│  ────────┼─────────────────────┼─────────────────────────    │
│  ⚡      │ Token Prices Drop   │                             │
│          │ Technical: MockOracle.simulateCrash()...          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STEP 2  │ CollateralManager   │ STEP ✓ SECURED              │
│  ────────┼─────────────────────┼─────────────────────────    │
│  📊     │ Collateral Loses    │                             │
│          │ Value               │                             │
│          │ Technical: CollateralManager.getTotalCollateral...│
└──────────────────────────────────────────────────────────────┘

... (more steps) ...

```

## Dashboard View After Crash

```
┌──────────────────────────────────────────────────────────────┐
│                        DASHBOARD                              │
│  Your live position on Moonbase Alpha                         │
│                                   🔴 Simulated Crash (pulse)  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📉 RECENT MARKET CRASH          -40% SIMULATED    [X]       │
│  Just now • Protocol protection activated                     │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │ Collateral Impact   │  │ Health Factor       │            │
│  │ $38.0000            │  │ 68                  │            │
│  │ -$13.00 (25.5%)     │  │ -46 from 114        │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                               │
│  🛡️ Anti-Liquidation Active                                  │
│  Your vault has been automatically protected...               │
│                                                               │
│  [VIEW MARKET SIMULATOR →]                                    │
└──────────────────────────────────────────────────────────────┘

┌───────────────┬───────────────┬───────────────┬──────────────┐
│ COLLATERAL    │ CURRENT DEBT  │ AVAILABLE TO  │ HEALTH       │
│ VALUE         │               │ BORROW        │ FACTOR       │
│               │               │               │              │
│ $38.0000      │ $32.0000      │ $0.2500       │ 68           │
│ Simulated     │ Active USDC   │ Max $32.25    │ Simulated    │
│ (Post-Crash)  │ loan          │               │ (Post-Crash) │
└───────────────┴───────────────┴───────────────┴──────────────┘

... (rest of dashboard shows updated values) ...
```

## Animation Sequence

When you click "CRASH MARKET", you'll see:

1. **0.0s** - Market crash box appears at top (red)
2. **0.3s** - Red arrows shoot down to collateral vaults
3. **0.5s** - Vault boxes appear and values start dropping
4. **1.0s** - Health factor warning box appears (yellow/orange, pulsing)
5. **1.5s** - Blue arrow flows from health to protection system
6. **2.0s** - Anti-liquidation box appears (blue, glowing border)
7. **2.5s** - Green/yellow arrows flow from vaults to protection
   - "💸 Yield Redirected" label animates
   - "🔄 Rebalancing" label animates
8. **3.0s+** - All flows pulse continuously until reset

## Color Coding

- 🔴 **Red (#ef4444)**: Market crash, critical warnings
- 🟡 **Yellow/Orange (#f59e0b)**: Warnings, value drops
- 🔵 **Blue/Indigo (#6366f1)**: Protocol protection, anti-liquidation
- 🟢 **Green (#22c55e)**: Safety mechanisms, successful protection
- ⚪ **White/Light**: General info, descriptions

## Key Visual Elements

### Arrows Show:
- **Thick colored arrows (width: 4-6px)** = Data/value flow
- **Dashed animated lines** = Active processes
- **Pulsing opacity** = Ongoing activities
- **Arrowheads** = Direction of movement

### Boxes Represent:
- **Rounded rectangles** = System components
- **Border thickness** = Importance (2-4px)
- **Shadow effects** = Depth and hierarchy
- **Animations** = State changes

### Text Indicates:
- **Bold uppercase** = Component names
- **Regular text** = Descriptions
- **Mono font** = Technical details
- **Color hints** = Status

## Mobile Responsiveness

The SVG scales automatically:
- Desktop: Full 1200x600px view
- Tablet: Scaled to fit
- Mobile: Horizontal scroll enabled

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

Requires JavaScript enabled for animations.

---

## Quick Test Checklist

1. ✅ Dashboard badge shows "Live" when no crash
2. ✅ Dashboard badge shows "Simulated Crash" (pulsing) after crash
3. ✅ Market crash creates visual flow diagram
4. ✅ All 5 steps animate in sequence
5. ✅ Arrows flow showing yield → repayment
6. ✅ Dashboard values update to reflect crash
7. ✅ Crash result card shows losses
8. ✅ Can dismiss crash result to return to live view
9. ✅ "Simulated (Post-Crash)" labels appear on affected metrics
10. ✅ Colors pulse and animate appropriately

---

This visual flow makes it crystal clear to judges how SECP protects users during market crashes! 🎯
