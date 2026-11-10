import { getTotal, getBalances, getSettlements, round2 } from "./engine.js";

// ------- DOM Elements
const createSectionEl = document.getElementById("create-group-section");
const createGroupForm = document.getElementById("create-group-form");
const groupNameEl = document.getElementById("group-name-input");
const membersInputEl = document.getElementById("members-input");

const groupSection = document.getElementById("group-section");
const membersListEl = document.getElementById("members-list");
const expensePaidByEl = document.getElementById("expense-paid-by");
const expenseAmountEl = document.getElementById("expense-amount");
const expenseDescriptionEl = document.getElementById("expense-description");

const expensesListEl = document.getElementById("expenses-list");
const balancesListEl = document.getElementById("balances-list");
const settlementsListEl = document.getElementById("settlements-list");

// ------- STATE
let group = null;

// ------- RENDER FUNCTIONS
function renderAll() {
   if (group === null) {
      createSectionEl.hidden = false;
      groupSection.hidden = true;
   }
   else {
      createSectionEl.hidden = true;
      groupSection.hidden = false;
      renderMembers();
      renderExpenses();
      renderBalances();
      renderSettlements();
   }
}
renderAll();

function renderMembers() {
   const members = group?.members ?? [];
   if (members.length === 0) {
      membersListEl.innerHTML = `<li class="empty">no members yet</li>`;
      return;
   }

   membersListEl.innerHTML = members.map(member => {
      return `<li>${member.name}</li>`;
   }).join("");
}

function renderExpenses() {
   const expenses = group?.expenses ?? [];
   if (expenses.length === 0) {
      expensesListEl.innerHTML = `<li class="empty">no expenses yet</li>`
      return;
   }
   const members = group?.members ?? [];
   
   expensesListEl.innerHTML = expenses.map(expense => {
      const memberName = members.find(member => member.id === expense.paidBy).name;
      return `<li>${expense.description}: ₹${expense.amount} (paid by ${memberName})</li>`;
   }).join("");
}

function renderBalances() {
   const balances = getBalances(group);

   if (balances.length === 0) {
      balancesListEl.innerHTML = `<li class="empty">this group has no members</li>`;
      return;
   }

   balancesListEl.innerHTML = balances.map(balance => {
      const className = balance.balance < 0 
         ? "balance-negative" 
         : balance.balance > 0 
            ?  "balance-positive" 
            : "";
      return `<li class="${className}">${balance.name}: ₹${balance.balance}</li>`;
   }).join("");
}

function renderSettlements() {
   const settlements = getSettlements(group);

   if (settlements.length === 0) {
      settlementsListEl.innerHTML = `<li class="empty">all settled up — no actions needed</li>`;
      return; 
   }

   const members = group?.members ?? [];

   settlementsListEl.innerHTML = settlements.map(settlement => {
      const payer = members.find(member => member.id === settlement.from).name;
      const payee = members.find(member => member.id === settlement.to).name;
      return `<li>${payer} pays ${payee} ₹${settlement.amount}</li>`
   }).join("");
}

// -------- UTILITY FUNCTIONS
const generateId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

function createMember(name) {
   return {
      id: generateId('mbr'),
      name,
   };
}

function createGroup(groupName, memberNames) {
   return {
      id: generateId('grp'),
      name: groupName,
      members: memberNames.map((name) => createMember(name)),
      expenses: [],
   };
}

// ------- EVENT HANDLERS
function handleGroupCreation(e) {
   e.preventDefault();  

   const groupName = groupNameEl.value.trim();
   const memberNames = membersInputEl.value
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");
   
   if (groupName === "" || memberNames.length === 0) return;

   group = createGroup(groupName, memberNames);
   groupNameEl.value = 0;
   membersInputEl.value = 0;
   renderAll();
}

// ------- EVENT LISTENERS
createGroupForm.addEventListener("submit", handleGroupCreation);