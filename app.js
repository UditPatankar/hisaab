import { getBalances, getSettlements, round2 } from "./engine.js";

// ─── DOM ─────────────────────────────────────────────────────────
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
const activityListEl = document.getElementById("activity-list");
const toastEl = document.getElementById("toast");

// ─── STORAGE ─────────────────────────────────────────────────────
const STORAGE_KEY = "hisaab-groups";
const MAX_AMOUNT = 10000000; // ₹1 crore — keeps float dust far below one paisa

// ─── STATE (the only stored truth; everything else is derived) ───
let groups = loadGroups();
let currentGroupId = null;

renderAll();

// ─── RENDER ──────────────────────────────────────────────────────
function renderAll() {
   if (currentGroupId === null) {
      groupsSection.hidden = false;
      createSectionEl.hidden = false;
      groupSection.hidden = true;
      renderGroupList();
   } else {
      groupsSection.hidden = true;
      createSectionEl.hidden = true;
      groupSection.hidden = false;

      const activeGroup = getActiveGroup();
      if (activeGroup === null) {   // safety net: id points nowhere → back home
         currentGroupId = null;
         renderAll();
         return;
      }

      groupTitleEl.textContent = activeGroup.name;

      renderMembers(activeGroup);
      renderExpenses(activeGroup);
      renderBalances(activeGroup);
      renderSettlements(activeGroup);
      renderPaidByOptions(activeGroup);
      renderActivity(activeGroup);
   }
}

function renderMembers(group) {
   const members = group?.members ?? [];
   if (members.length === 0) {
      membersListEl.innerHTML = `<li class="empty">no members yet</li>`;
      return;
   }
   membersListEl.innerHTML = members.map(member => `<li>${escapeHtml(member.name)}</li>`).join("");
}

function renderExpenses(group) {
   const expenses = group?.expenses ?? [];
   if (expenses.length === 0) {
      expensesListEl.innerHTML = `<li class="empty">no expenses yet</li>`;
      return;
   }
   expensesListEl.innerHTML = expenses.map(expense => {
      const paidByName = escapeHtml(getMemberName(group, expense.paidBy));
      return `<li>
         ${escapeHtml(expense.description)}: ₹${round2(expense.amount)} (paid by ${paidByName})
         <button class="delete-expense-btn" data-id="${expense.id}">✕</button>
      </li>`;
   }).join("");
}

function renderBalances(group) {
   const balances = getBalances(group);
   if (balances.length === 0) {
      balancesListEl.innerHTML = `<li class="empty">this group has no members</li>`;
      return;
   }
   balancesListEl.innerHTML = balances.map(balance => {
      const tone = balance.balance < 0 ? "balance-negative" : balance.balance > 0 ? "balance-positive" : "";
      return `<li class="${tone}">
         <span>${escapeHtml(balance.name)}</span>
         <span>₹${round2(balance.balance)}</span>
      </li>`;
   }).join("");
}

function renderSettlements(group) {
   const settlements = getSettlements(group);
   if (settlements.length === 0) {
      settlementsListEl.innerHTML = `<li class="empty">all settled up — no payments needed</li>`;
      return;
   }
   settlementsListEl.innerHTML = settlements.map(settlement => {
      const payerName = escapeHtml(getMemberName(group, settlement.from));
      const payeeName = escapeHtml(getMemberName(group, settlement.to));
      return `<li>
         ${payerName} pays ${payeeName} <strong>₹${settlement.amount}</strong>
         <button class="paid-btn" data-from="${settlement.from}" data-to="${settlement.to}" data-amount="${settlement.amount}">✓ paid</button>
      </li>`;
   }).join("");
}

function renderPaidByOptions(group) {
   const members = group?.members ?? [];
   const placeholder = `<option value="" disabled selected>Who paid?</option>`;
   const options = members.map(member => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join("");
   expensePaidByEl.innerHTML = placeholder + options;
}

function renderActivity(group) {
   const events = [
      ...(group?.expenses ?? []).map(expense => ({
         id: null, // expenses are undone via the expenses list, not here
         date: expense.date,
         text: `💸 ${escapeHtml(expense.description)} · ₹${round2(expense.amount)} paid by ${escapeHtml(getMemberName(group, expense.paidBy))}`,
      })),
      ...(group?.settlements ?? []).map(settlement => ({
         id: settlement.id,
         date: settlement.date,
         text: `🤝 ${escapeHtml(getMemberName(group, settlement.from))} paid ${escapeHtml(getMemberName(group, settlement.to))} ₹${settlement.amount}`,
      })),
   ];

   if (events.length === 0) {
      activityListEl.innerHTML = `<li class="empty">nothing has happened yet</li>`;
      return;
   }

   // newest first; expenses saved before dates existed sink to the bottom
   events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
   });

   activityListEl.innerHTML = events.map(event => {
      const when = event.date ? new Date(event.date).toLocaleString() : "date unknown";
      const undoBtn = event.id
         ? `<button class="undo-settlement-btn" data-id="${event.id}">✕</button>`
         : "";
      return `<li>${event.text}${undoBtn}<span class="feed-time">${when}</span></li>`;
   }).join("");
}

function renderGroupList() {
   if (groups.length === 0) {
      groupListEl.innerHTML = `<li class="empty">no groups yet — create one below</li>`;
      return;
   }
   groupListEl.innerHTML = groups.map(group => {
      return `<li data-id="${group.id}">
         ${escapeHtml(group.name)}
         <span class="row-meta">${group.members.length} members · ${group.expenses.length} expenses</span>
         <button class="delete-group-btn" data-id="${group.id}">✕</button>
      </li>`;
   }).join("");
}

// ─── FACTORIES ───────────────────────────────────────────────────
const generateId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

function getMemberName(group, memberId) {
   return group?.members?.find(member => member.id === memberId)?.name ?? "unknown";
}

function escapeHtml(text) {
   return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
}

function createMember(name) {
   return { id: generateId("mbr"), name };
}

function createGroup(groupName, memberNames) {
   return {
      id: generateId("grp"),
      name: groupName,
      members: memberNames.map(createMember),
      expenses: [],
      settlements: [],
   };
}

function createExpense(paidBy, amount, description) {
   return {
      id: generateId("exp"),
      paidBy,
      amount,
      description,
      date: new Date().toISOString(),
   };
}

function createSettlement(from, to, amount) {
   return {
      id: generateId("stl"),
      from,
      to,
      amount,
      date: new Date().toISOString(),
   };
}

function loadGroups() {
   try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // migration: groups saved by older versions may lack newer fields
      return parsed.map(group => ({
         ...group,
         settlements: group.settlements ?? [],
         expenses: (group.expenses ?? []).map(expense => ({ ...expense, date: expense.date ?? null })),
      }));
   } catch {
      return []; // corrupted storage → fresh start instead of a dead app
   }
}

function getActiveGroup() {
   return groups.find(group => group.id === currentGroupId) ?? null;
}

// ─── TOAST (inline feedback — nothing fails silently) ────────────
let toastTimer = null;
function showToast(message) {
   toastEl.textContent = message;
   toastEl.classList.add("show");
   clearTimeout(toastTimer);
   toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

// ─── HANDLERS ────────────────────────────────────────────────────
function handleGroupCreation(e) {
   e.preventDefault(); // forms natively submit to a server and reload; we have no server

   const groupName = groupNameEl.value.trim();
   const memberNames = membersInputEl.value
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");

   if (groupName === "") return showToast("Give the group a name");
   if (memberNames.length === 0) return showToast("Add at least one member (comma separated)");

   const newGroup = createGroup(groupName, memberNames);
   groups.push(newGroup);
   currentGroupId = newGroup.id; // open it immediately — the user created it to use it

   groupNameEl.value = "";
   membersInputEl.value = "";

   saveGroups();
   renderAll();
   showToast(`Group "${groupName}" created`);
}

function handleAddExpense(e) {
   e.preventDefault();

   const paidBy = expensePaidByEl.value;
   const amount = Number(expenseAmountEl.value);
   const description = expenseDescriptionEl.value.trim();
   const activeGroup = getActiveGroup();

   if (activeGroup === null) return;
   if (!paidBy) return showToast("Select who paid");
   if (description === "") return showToast("Enter what the expense was for");
   if (!Number.isFinite(amount) || amount <= 0) return showToast("Enter an amount greater than 0");
   if (round2(amount) !== amount) return showToast("Amount can have max 2 decimal places");
   if (amount > MAX_AMOUNT) return showToast("Amount too large (max ₹1,00,00,000)");

   activeGroup.expenses.push(createExpense(paidBy, amount, description));

   expenseAmountEl.value = "";
   expenseDescriptionEl.value = "";

   saveGroups();
   renderAll();
}

function handleGroupListClick(e) {
   const deleteBtn = e.target.closest(".delete-group-btn");
   if (deleteBtn) {
      const targetId = deleteBtn.dataset.id;
      const targetGroup = groups.find(group => group.id === targetId);
      if (!targetGroup) return;

      const summary = `${targetGroup.expenses.length} expenses and ${targetGroup.settlements.length} recorded payments`;
      if (!confirm(`Delete "${targetGroup.name}"? This permanently removes ${summary}.`)) return;

      groups = groups.filter(group => group.id !== targetId);
      if (currentGroupId === targetId) currentGroupId = null;

      saveGroups();
      renderAll();
      showToast(`Deleted "${targetGroup.name}"`);
      return;
   }

   // otherwise: opening a group
   const clickedLi = e.target.closest("li");
   if (!clickedLi || !clickedLi.dataset.id) return;

   currentGroupId = clickedLi.dataset.id;
   renderAll();
}

function handleBackButton() {
   currentGroupId = null;
   renderAll();
}

function handleDeleteExpense(e) {
   const clickedBtn = e.target.closest(".delete-expense-btn");
   if (!clickedBtn || !expensesListEl.contains(clickedBtn)) return;

   const activeGroup = getActiveGroup();
   if (activeGroup === null) return;

   if (!confirm("Delete this expense?")) return;

   // recorded payments are independent facts (real money that already moved).
   // deleting the expense doesn't un-pay them — offer a clean slate when wanted.
   if (activeGroup.settlements.length > 0) {
      const wipePayments = confirm(
         "Also remove ALL recorded payments in this group?\n\n" +
         "OK = fresh start — every balance returns to ₹0\n" +
         "Cancel = keep them — balances show who the money really belongs to now"
      );
      if (wipePayments) activeGroup.settlements = [];
   }

   const targetId = clickedBtn.dataset.id;
   activeGroup.expenses = activeGroup.expenses.filter(expense => expense.id !== targetId);

   saveGroups();
   renderAll();
   showToast("Expense deleted");
}

function handleSettlement(e) {
   const clickedBtn = e.target.closest(".paid-btn");
   if (!clickedBtn) return;

   const activeGroup = getActiveGroup();
   if (activeGroup === null) return;

   const { from, to, amount } = clickedBtn.dataset;
   activeGroup.settlements.push(createSettlement(from, to, Number(amount)));

   saveGroups();
   renderAll();
   showToast(`Recorded: ${getMemberName(activeGroup, from)} paid ${getMemberName(activeGroup, to)} ₹${Number(amount)}`);
}

function handleUndoSettlement(e) {
   const clickedBtn = e.target.closest(".undo-settlement-btn");
   if (!clickedBtn || !activityListEl.contains(clickedBtn)) return;

   const activeGroup = getActiveGroup();
   if (activeGroup === null) return;

   if (!confirm("Remove this recorded payment? Balances will be recalculated.")) return;

   const targetId = clickedBtn.dataset.id;
   activeGroup.settlements = activeGroup.settlements.filter(settlement => settlement.id !== targetId);

   saveGroups();
   renderAll();
   showToast("Payment removed — balances recalculated");
}

function saveGroups() {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

// ─── LISTENERS ───────────────────────────────────────────────────
createGroupForm.addEventListener("submit", handleGroupCreation);
expenseForm.addEventListener("submit", handleAddExpense);
groupListEl.addEventListener("click", handleGroupListClick);
backButton.addEventListener("click", handleBackButton);
expensesListEl.addEventListener("click", handleDeleteExpense);
settlementsListEl.addEventListener("click", handleSettlement);
activityListEl.addEventListener("click", handleUndoSettlement);