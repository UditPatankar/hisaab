/**
 * hisaab — settlement engine
 * Pure business logic: FACTS in → DERIVED values out. No DOM, no logging, no side effects.
 *
 * Group shape (contract):
 * {
 *   id, name,
 *   members:     [{ id, name }],
 *   expenses:    [{ id, amount, paidBy, description, date }],  // paidBy = member id
 *   settlements: [{ id, from, to, amount, date }],             // payments that actually happened
 * }
 */

// money is rounded to paise at every boundary; anything within one paisa of zero is settled
const round2 = (x) => Math.round(x * 100) / 100;

// sum of every expense in the group
function getTotal(group) {
   const expenses = group?.expenses ?? [];
   return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Effective balance per member:
 * (expenses paid − fair share) + settlements paid out − settlements received.
 * negative → owes | positive → is owed | 0 → settled up
 */
function getBalances(group) {
   const members = group?.members ?? [];
   if (members.length === 0) return [];

   const expenses = group?.expenses ?? [];
   const settlements = group?.settlements ?? [];
   const fairShare = round2(getTotal(group) / members.length);

   return members.map(member => {
      const totalPaid = expenses.reduce(
         (total, expense) => (expense.paidBy === member.id ? total + expense.amount : total),
         0
      );

      const { paidOut, received } = settlements.reduce((acc, s) => {
         if (s.from === member.id) acc.paidOut += s.amount;
         if (s.to === member.id) acc.received += s.amount;
         return acc;
      }, { paidOut: 0, received: 0 });

      // tolerance lives at the source: a balance within one paisa of zero IS zero.
      // kills ₹-0.01 pills and phantom "pays ₹0" suggestions everywhere, permanently.
      const raw = (totalPaid - fairShare) + paidOut - received;
      return { ...member, balance: Math.abs(raw) <= 0.01 ? 0 : round2(raw) };
   });
}

/**
 * Minimum-transaction settlement plan (greedy matching).
 * Each payment wipes out at least one side completely.
 * from/to are member IDs — identity, never display names.
 */
function getSettlements(group) {
   const balances = getBalances(group);
   const debtors = balances.filter(member => member.balance < 0);
   const creditors = balances.filter(member => member.balance > 0);

   const plan = [];
   let d = 0;
   let c = 0;

   while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = round2(Math.min(Math.abs(debtor.balance), Math.abs(creditor.balance)));

      plan.push({ from: debtor.id, to: creditor.id, amount });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) <= 0.01) { debtor.balance = 0; d++; }
      if (Math.abs(creditor.balance) <= 0.01) { creditor.balance = 0; c++; }
   }

   return plan;
}

export { getTotal, getBalances, getSettlements, round2 };