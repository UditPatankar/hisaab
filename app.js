import { getTotal, getBalances, getSettlements, round2 } from "./engine.js";

// ------- DOM Elements
const createSectionEl = document.getElementById("create-group-section");
const createGroupForm = document.getElementById("create-group-form");
const groupNameEl = document.getElementById("group-name-input");
const membersInputEl = document.getElementById("members-input");

const groupSection = document.getElementById("group-section");
const membersListEl = document.getElementById("members-list");
const expenseForm = document.getElementById("expense-form");
const expensePaidByEl = document.getElementById("expense-paid-by");
const expenseAmountEl = document.getElementById("expense-amount");
const expenseDescriptionEl = document.getElementById("expense-description");

const expensesListEl = document.getElementById("expenses-list");
const balancesListEl = document.getElementById("balances-list");
const settlementsListEl = document.getElementById("settlements-list");

// ------- LOCAL STORAGE KEYS
const STORAGE_KEY = "hisaab-group";

// ------- STATE
let group = loadGroup();

renderAll();

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
      renderPaidByOptions();
   }
}

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
      expensesListEl.innerHTML = `<li class="empty">no expenses yet</li>`;
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
      return `<li class="${className}">${balance.name}: ₹${round2(balance.balance)}</li>`;
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
      return `<li>${payer} pays ${payee} ₹${settlement.amount}</li>`;
   }).join("");
}

function renderPaidByOptions() {
   const members = group?.members ?? [];
   const placeholderHtml = `<option value="" disabled selected>Select a member</option>`;
   const optionsHTML = members.map(member => `<option value="${member.id}">${member.name}</option>`).join("");
   expensePaidByEl.innerHTML = placeholderHtml + optionsHTML;
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

function createExpense(paidBy, amount, description) {
   return {
      id: generateId("exp"),
      paidBy,
      amount,
      description,
   }
}

function loadGroup() {
   try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
   }
   catch {
      return null;
   }
}

// ------- EVENT HANDLERS
function handleGroupCreation(e) {
   e.preventDefault(); // a form's default job is: send data to a server + reload — we have no server, JS handles it

   const groupName = groupNameEl.value.trim();
   const memberNames = membersInputEl.value
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");
   
   if (groupName === "" || memberNames.length === 0) return;

   group = createGroup(groupName, memberNames);
   groupNameEl.value = "";
   membersInputEl.value = "";

   localStorage.setItem(STORAGE_KEY, JSON.stringify(group));

   renderAll();
}

function handleAddExpense(e) {
   e.preventDefault(); // a form's default job is: send data to a server + reload — we have no server, JS handles it

   const paidBy = expensePaidByEl.value;
   const amount = Number(expenseAmountEl.value);
   const description = expenseDescriptionEl.value.trim();

   if (group === null || !paidBy || description === "" || !Number.isFinite(amount) || amount <= 0) return;

   group.expenses.push(createExpense(paidBy, amount, description));

   expenseAmountEl.value = "";      
   expenseDescriptionEl.value = ""

   localStorage.setItem(STORAGE_KEY, JSON.stringify(group));

   renderAll();
} 

// ------- EVENT LISTENERS
createGroupForm.addEventListener("submit", handleGroupCreation);
expenseForm.addEventListener("submit", handleAddExpense);

// known limitation: data saved by an older version of this app may not match what the code expects now. handling that = future work.