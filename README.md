# 💸 hisaab

**Settle group expenses fairly** — trips, outings, flatmates. No more "main tujhe baad mein de dunga."

🔗 **Live app:** https://uditpatankar.github.io/hisaab/

---

## The problem

After every group trip comes the painful part: who owes whom, and how much? Spreadsheets get messy, mental math causes fights. hisaab takes every expense of a group and produces the **minimum list of payments** that settles everyone.

## Features

- ✅ Create groups (name + members), keep as many groups as you want
- ✅ Log expenses: amount, description, who paid
- ✅ Auto equal-split among all members
- ✅ Live balances — who owes / who is owed (color coded)
- ✅ "Settle up" list: minimum-transaction payment plan (greedy matching)
- ✅ Data persists in the browser (localStorage) — survives refresh & restart
- ✅ Works on the go: everything runs client-side, no account needed

## Run it locally

```bash
git clone https://github.com/UditPatankar/hisaab.git
cd hisaab
npx serve .        # or open index.html with VS Code Live Server
```
