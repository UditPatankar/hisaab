import { getTotal, getBalances, getSettlements, round2 } from "./engine.js";

// ------- DOM Elements
const groupsSection = document.getElementById("groups-section");
const groupListEl = document.getElementById("groups-list");

const createSectionEl = document.getElementById("create-group-section");
const createGroupForm = document.getElementById("create-group-form");
const groupNameEl = document.getElementById("group-name-input");
const membersInputEl = document.getElementById("members-input");

const groupSection = document.getElementById("group-section");
const groupTitleEl = document.getElementById("group-title");
const backButton = document.getElementById("back-to-groups");
const membersListEl = document.getElementById("members-list");
const expenseForm = document.getElementById("expense-form");
const expensePaidByEl = document.getElementById("expense-paid-by");
const expenseAmountEl = document.getElementById("expense-amount");
const expenseDescriptionEl = document.getElementById("expense-description");

const expensesListEl = document.getElementById("expenses-list");
const balancesListEl = document.getElementById("balances-list");
const settlementsListEl = document.getElementById("settlements-list");

// ------- LOCAL STORAGE KEYS
const STORAGE_KEY = "hisaab-groups";

// ------- STATE
let groups = loadGroups();
let currentGroupId = null;
let currentGroup = null;

renderAll();

// ------- RENDER FUNCTIONS
function renderAll() {
   // home screen
   if (currentGroupId === null) {
      groupsSection.hidden = false;
      createSectionEl.hidden = false;
      groupSection.hidden = true;
      renderGroupList();
   }
   // dashboard
   else {
      groupsSection.hidden = true;
      createSectionEl.hidden = true;
      groupSection.hidden = false;

      currentGroup = getGroup(currentGroupId);
      groupTitleEl.textContent = currentGroup.name;   // user-typed text → textContent, never HTML

      renderMembers();
      renderExpenses();
      renderBalances();
      renderSettlements();
      renderPaidByOptions();
   }
}

function renderMembers() {
   const members = currentGroup?.members ?? [];
   if (members.length === 0) {
      membersListEl.innerHTML = `<li class="empty">no members yet</li>`;
      return;
   }

   membersListEl.innerHTML = members.map(member => {
      return `<li>${member.name}</li>`;
   }).join("");
}

function renderExpenses() {
   const expenses = currentGroup?.expenses ?? [];
   if (expenses.length === 0) {
      expensesListEl.innerHTML = `<li class="empty">no expenses yet</li>`;
      return;
   }
   const members = currentGroup?.members ?? [];

   expensesListEl.innerHTML = expenses.map(expense => {
      const memberName = members.find(member => member.id === expense.paidBy).name;
      return `<li>${expense.description}: ₹${expense.amount} (paid by ${memberName})</li>`;
   }).join("");
}

function renderBalances() {
   const balances = getBalances(currentGroup);

   if (balances.length === 0) {
      balancesListEl.innerHTML = `<li class="empty">this group has no members</li>`;
      return;
   }

   balancesListEl.innerHTML = balances.map(balance => {
      const className = balance.balance < 0
         ? "balance-negative"
         : balance.balance > 0
            ? "balance-positive"
            : "";
      return `<li class="${className}">${balance.name}: ₹${round2(balance.balance)}</li>`;
   }).join("");
}

function renderSettlements() {
   const settlements = getSettlements(currentGroup);

   if (settlements.length === 0) {
      settlementsListEl.innerHTML = `<li class="empty">all settled up — no actions needed</li>`;
      return;
   }

   const members = currentGroup?.members ?? [];

   settlementsListEl.innerHTML = settlements.map(settlement => {
      const payer = members.find(member => member.id === settlement.from).name;
      const payee = members.find(member => member.id === settlement.to).name;
      return `<li>${payer} pays ${payee} ₹${settlement.amount}</li>`;
   }).join("");
}

function renderPaidByOptions() {
   const members = currentGroup?.members ?? [];
   const placeholderHtml = `<option value="" disabled selected>Select a member</option>`;
   const optionsHTML = members.map(member => `<option value="${member.id}">${member.name}</option>`).join("");
   expensePaidByEl.innerHTML = placeholderHtml + optionsHTML;
}

function renderGroupList() {
   if (groups.length === 0) {
      groupListEl.innerHTML = `<li class="empty">no groups yet — create one below</li>`;
      return;
   }

   groupListEl.innerHTML = groups.map(group => {
      return `<li data-id="${group.id}">${group.name} · ${group.members.length} members · ${group.expenses.length} expenses</li>`;
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

function createExpense(paidBy, amount, description) {
   return {
      id: generateId("exp"),
      paidBy,
      amount,
      description,
   };
}

function loadGroups() {
   try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
   }
   catch {
      return [];
   }
}

function getGroup(groupId) {
   return groups.find(group => group.id === groupId);
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

   const newGroup = createGroup(groupName, memberNames);
   groups.push(newGroup);
   currentGroupId = newGroup.id;   // open the new group right away — user made it to use it, not to look at the home list

   groupNameEl.value = "";
   membersInputEl.value = "";

   localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));

   renderAll();
}

function handleAddExpense(e) {
   e.preventDefault(); // a form's default job is: send data to a server + reload — we have no server, JS handles it

   const paidBy = expensePaidByEl.value;
   const amount = Number(expenseAmountEl.value);
   const description = expenseDescriptionEl.value.trim();

   if (currentGroup === null || !paidBy || description === "" || !Number.isFinite(amount) || amount <= 0) return;

   currentGroup.expenses.push(createExpense(paidBy, amount, description));

   expenseAmountEl.value = "";
   expenseDescriptionEl.value = "";

   localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));

   renderAll();
}

function handleDisplayGroup(e) {
   const clickedLi = e.target.closest("li");
   if (!clickedLi || !groupListEl.contains(clickedLi)) return;
   if (!clickedLi.dataset.id) return;   // empty-message li has no id → not a group → ignore

   currentGroupId = clickedLi.dataset.id;
   renderAll();
}

function handleBackButton() {
   currentGroupId = null;
   currentGroup = null;
   renderAll();
}

// ------- EVENT LISTENERS
createGroupForm.addEventListener("submit", handleGroupCreation);
expenseForm.addEventListener("submit", handleAddExpense);
groupListEl.addEventListener("click", handleDisplayGroup);
backButton.addEventListener("click", handleBackButton);

// known limitation: data saved by an older version of this app may not match what the code expects now. handling that = future work.