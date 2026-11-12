import { getTotal, getBalances, getSettlements, round2 } from "./engine.js";

// ── fixture 1: goa trip — whole numbers
const goaTrip = {
   id: "G01", name: "Goa Trip",
   members: [
      { id: "m1", name: "A" }, { id: "m2", name: "B" },
      { id: "m3", name: "C" }, { id: "m4", name: "D" },
   ],
   expenses: [
      { id: "e1", amount: 1400, paidBy: "m2", description: "dinner" },
      { id: "e2", amount: 1000, paidBy: "m3", description: "cab" },
   ],
};

console.log("total:", getTotal(goaTrip));                                             // 2400
console.log("balances:", getBalances(goaTrip));                                       // -600 / 800 / 400 / -600
console.log("balance sum:", getBalances(goaTrip).reduce((s, m) => s + m.balance, 0)); // 0
console.log("empty group:", getBalances({}));                                         // []
console.log("settlements 1:", getSettlements(goaTrip));                               // 3 payments

// ── fixture 2: uneven money — total 4430, share 1476.67
const oldTrip = {
   id: "G02", name: "Old Trip",
   members: [{ id: "M1", name: "Alex" }, { id: "M2", name: "David" }, { id: "M3", name: "Bob" }],
   expenses: [
      { id: "E1", amount: 300, paidBy: "M1" }, { id: "E2", amount: 30, paidBy: "M2" },
      { id: "E3", amount: 500, paidBy: "M1" }, { id: "E4", amount: 600, paidBy: "M2" },
      { id: "E5", amount: 3000, paidBy: "M3" },
   ],
};
console.log("settlements 2:", getSettlements(oldTrip));                               // 676.67 / 846.66
console.log("money check:", round2(getSettlements(oldTrip).reduce((sum, t) => sum + t.amount, 0))); // 1523.33

// ── fixture 3: a recorded payment shrinks balances
const partiallySettled = {
   ...goaTrip,
   settlements: [{ id: "s1", from: "m1", to: "m2", amount: 600, date: new Date().toISOString() }],
};
console.log("after one payment:", getBalances(partiallySettled).map(m => `${m.name}:${m.balance}`).join(" ")); // A:0 B:200 C:400 D:-600
console.log("suggestions after payment:", getSettlements(partiallySettled).length);   // 2

// ── fixture 4: fully settled — tolerance kills phantom suggestions
const fullySettled = {
   ...goaTrip,
   settlements: [
      { id: "s1", from: "m1", to: "m2", amount: 600, date: new Date().toISOString() },
      { id: "s2", from: "m4", to: "m2", amount: 200, date: new Date().toISOString() },
      { id: "s3", from: "m4", to: "m3", amount: 400, date: new Date().toISOString() },
   ],
};
console.log("fully settled:", getBalances(fullySettled).map(m => `${m.name}:${m.balance}`).join(" ")); // all :0
console.log("fully settled suggestions:", getSettlements(fullySettled).length);       // 0

// ── fixture 5: the 500/3 case — share 166.67, one debtor absorbs the drift paisa
const thirds = {
   id: "G03", name: "Thirds",
   members: [{ id: "a", name: "Alex" }, { id: "d", name: "David" }, { id: "b", name: "Bob" }],
   expenses: [{ id: "e1", amount: 500, paidBy: "a", description: "cab" }],
};
const thirdsPlan = getSettlements(thirds);
console.log("thirds plan:", thirdsPlan);                                              // 166.67 + 166.66
const thirdsPaid = { ...thirds, settlements: thirdsPlan.map(p => ({ ...p, id: "x", date: new Date().toISOString() })) };
console.log("thirds settled:", getBalances(thirdsPaid).map(m => `${m.name}:${m.balance}`).join(" ")); // all :0
console.log("thirds suggestions:", getSettlements(thirdsPaid).length);                // 0