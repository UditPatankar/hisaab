/* 
   hisaab - settlement engine
   ------------------------------
   Pure business logic for group expenses.
   FACTS go in (the group object) -> DERIVED values come out.
   No console.log or DOM in this file's functions - printing/displaying is the caller's job.

   Expected group shape (the file's contract):
   {
      id, name,
      members: [{id, name}],
      expenses: [{id, amount, paidBy, description}], // paidBy = a member id
   }
*/

// money helper: rounds to 2 decimals (paise) — all engine math stays paise-clean
const round2 = (x) => Math.round(x * 100) / 100;

/* ----------- RULES (pure functions) ------------------------------------- */

/* 
   Total of all expenses in the group.
   @param {object} group
   @returns {number} total
*/
function getTotal(group) {
   const expenses = group?.expenses ?? [];
   return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/* 
   Each member's balance = (what they paid) - (their fair share)
   negative -> owes | positive -> is owed | 0 -> settled up

   @param {object} group
   @returns {Array<{id, name, balance}>} array of each member's balance
*/
function getBalances(group) {
   const members = group?.members ?? [];
   if (members.length === 0) return []; // no members -> no fair share -> nothing to compute

   const expenses = group?.expenses ?? [];
   const fairShare = round2(getTotal(group) / members.length);

   return members.map(member => {
      const totalPaid = expenses.reduce(
         (total, expense) => (expense.paidBy === member.id ? total + expense.amount : total),
         0
      );
      return { ...member, balance: totalPaid - fairShare };
   });
}

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

// test case: A -600 | B +800 | C +400 | D -600 | sum must be 0
console.log("total:", getTotal(goaTrip)); // expect 2400
console.log("balances:", getBalances(goaTrip));
console.log("balance sum:", getBalances(goaTrip).reduce((sum, m) => sum + m.balance, 0)); // expect 0
console.log("empty group:", getBalances({})); // expect []