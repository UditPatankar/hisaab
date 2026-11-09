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

/* 
   Settlements = the minimum list of payments that brings every balance to 0.
   Greedy matching: biggest outstanding amounts settle first,
   whoever reaches 0 leaves the line, next one steps up.

   from/to are member IDS, not names — ids are identity, names are display
   (two members can share a name, ids cannot collide).

   @param {object} group
   @returns {Array<{from, to, amount}>} transactions
      from: debtor's member id
      to: creditor's member id
      amount: min(|debtor's balance|, |creditor's balance|), rounded to paise
*/
function getSettlements(group) {
   const balances = getBalances(group);
   const debtors = balances.filter((member) => member.balance < 0);
   const creditors = balances.filter((member) => member.balance > 0);

   const settlements = [];
   let d = 0;
   let c = 0;

   while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];

      const amount = round2(Math.min(Math.abs(debtor.balance), Math.abs(creditor.balance)));

      settlements.push({ from: debtor.id, to: creditor.id, amount });

      debtor.balance += amount;
      creditor.balance -= amount;

      // settled = within 1 paisa of zero (Math.abs is the point: a debt of -400
      // must NOT read as settled just because -400 <= 0.01)
      if (Math.abs(debtor.balance) <= 0.01) { debtor.balance = 0; d++; }
      if (Math.abs(creditor.balance) <= 0.01) { creditor.balance = 0; c++; }
   }

   return settlements;
}

/*
   KNOWN LIMITATION (v1): anything within 1 paisa of zero counts as settled,
   so tiny rounding remainders are absorbed instead of paid back.
   Paying back the last paisa exactly = v2.
*/

export { getTotal, getBalances, getSettlements, round2 };