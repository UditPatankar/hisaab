import { getTotal, getBalances, getSettlements, round2 } from "./engine.js";

/* -------- TESTS (temporary — moves to engine.test.js when we add a test runner) ── */

const goaTrip = {
   id: "G01",
   name: "Goa Trip",
   members: [
      { id: "G01-M01", name: "A" },
      { id: "G01-M02", name: "B" },
      { id: "G01-M03", name: "C" },
      { id: "G01-M04", name: "D" },
   ],
   expenses: [
      { id: "G01-E01", amount: 1400, paidBy: "G01-M02", description: "dinner" },
      { id: "G01-E02", amount: 1000, paidBy: "G01-M03", description: "cab" },
   ],
};

// test case 1: A -600 | B +800 | C +400 | D -600 | sum must be 0
console.log("total:", getTotal(goaTrip)); // expect 2400
console.log("balances:", getBalances(goaTrip));
console.log("balance sum:", getBalances(goaTrip).reduce((sum, m) => sum + m.balance, 0)); // expect 0
console.log("empty group:", getBalances({})); // expect []
const settlements1 = getSettlements(goaTrip);
console.log("settlements 1:", settlements1); // expect 3: A->B 600, D->B 200, D->C 400

// test case 2: the real trip — total 4430, share 1476.67 each (uneven money!)
const oldTrip = {
   id: "G02",
   name: "Old Trip",
   members: [
      { id: "M1", name: "Alex" },
      { id: "M2", name: "David" },
      { id: "M3", name: "Bob" },
   ],
   expenses: [
      { id: "E1", amount: 300,  paidBy: "M1", description: "dinner" },
      { id: "E2", amount: 30,   paidBy: "M2", description: "water" },
      { id: "E3", amount: 500,  paidBy: "M1", description: "fuel" },
      { id: "E4", amount: 600,  paidBy: "M2", description: "clothes" },
      { id: "E5", amount: 3000, paidBy: "M3", description: "club" },
   ],
};
const settlements2 = getSettlements(oldTrip);
console.log("settlements 2:", settlements2); // expect 2: Alex->Bob 676.67, David->Bob 846.66
console.log("money check:", round2(settlements2.reduce((sum, t) => sum + t.amount, 0))); // expect 1523.33 (= what Bob is owed)