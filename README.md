# hisaab

**Settle group expenses fairly** — trips, outings, flatmates. hisaab takes every expense of a group and produces the minimum list of payments that settles everyone.

🔗 **Live app:** https://uditpatankar.github.io/hisaab/

## Features

- Multiple groups — create, switch, delete (with a warning showing exactly what gets removed)
- Log expenses (amount, description, who paid) with automatic equal split
- Input validation with inline toast feedback — nothing fails silently
- Delete expenses; optionally wipe the group back to a clean slate
- Clear all expenses at once (with confirmation and clean-slate option)
- Live balances, color coded — who owes, who is owed
- "Settle up" — minimum-transaction payment plan (greedy matching)
- Mark payments as settled — recorded payments become facts, balances shrink
- Undo any recorded payment from the activity feed — balances recalculate
- Activity feed — chronological log of every expense and payment
- Persistent browser storage with automatic migration of older saved data
- Fail-safe loading — corrupted storage falls back to a fresh start
- XSS-safe rendering — user input is escaped before touching the DOM

## Run locally

```bash
git clone https://github.com/UditPatankar/hisaab.git
cd hisaab
npx serve .        # or VS Code Live Server
npm test           # engine tests
```
