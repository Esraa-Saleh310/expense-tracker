

const API_URL = "http://localhost:3000/api/expenses";

const CATEGORY_BADGES = {
  Food: "bg-success",
  Transport: "bg-primary",
  Bills: "bg-warning text-dark",
  Entertainment: "bg-info text-dark",
  Other: "bg-secondary",
};

let allExpenses = [];

const alertBox = document.getElementById("alertBox");
const modalAlertBox = document.getElementById("modalAlertBox");
const spinner = document.getElementById("spinner");
const tableBody = document.getElementById("expenseTable");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("searchInput");

const addForm = document.getElementById("addForm");
const addBtn = document.getElementById("addBtn");

const editForm = document.getElementById("editForm");
const saveBtn = document.getElementById("saveBtn");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));


async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error("Cannot reach the server. Make sure the backend is running on port 3000.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : "Something went wrong (status " + response.status + ").";
    throw new Error(message);
  }
  return data;
}

async function getExpenses() {
  return request(API_URL);
}

async function addExpense(data) {
  return request(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function updateExpense(id, data) {
  return request(API_URL + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function deleteExpense(id) {
  return request(API_URL + "/" + id, { method: "DELETE" });
}

function toInputDate(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{2}-\d{2}-\d{4}/.test(text)) {
    const [day, month, year] = text.slice(0, 10).split("-");
    return year + "-" + month + "-" + day;
  }
  return text.slice(0, 10);
}


function formatDate(value) {
  const iso = toInputDate(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return day + "-" + month + "-" + year;
}

function formatAmount(value) {
  return Number(value).toFixed(2);
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function showAlert(container, message, type = "danger") {
  container.innerHTML = "";
  const alert = document.createElement("div");
  alert.className = "alert alert-" + type + " alert-dismissible fade show";
  alert.setAttribute("role", "alert");
  alert.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-close";
  closeBtn.setAttribute("data-bs-dismiss", "alert");
  closeBtn.setAttribute("aria-label", "Close");
  alert.appendChild(closeBtn);

  container.appendChild(alert);
}

function setSpinner(visible) {
  spinner.classList.toggle("d-none", !visible);
}

function setBusy(button, busy, busyText) {
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyText;
  } else {
    button.textContent = button.dataset.label;
  }
  button.disabled = busy;
}


function readAndValidate(ids) {
  const titleInput = document.getElementById(ids.title);
  const amountInput = document.getElementById(ids.amount);
  const categoryInput = document.getElementById(ids.category);
  const dateInput = document.getElementById(ids.date);

  const title = titleInput.value.trim();
  const amountText = amountInput.value.trim();
  const amount = Number(amountText);
  const category = categoryInput.value;
  const date = dateInput.value;

  const titleOk = title !== "";
  const amountOk = amountText !== "" && Number.isFinite(amount) && amount > 0;
  const categoryOk = category !== "";
  const dateOk = date !== "";

  titleInput.classList.toggle("is-invalid", !titleOk);
  amountInput.classList.toggle("is-invalid", !amountOk);
  categoryInput.classList.toggle("is-invalid", !categoryOk);
  dateInput.classList.toggle("is-invalid", !dateOk);

  if (!(titleOk && amountOk && categoryOk && dateOk)) return null;
  return { title, amount, category, date };
}

function clearValidation(form) {
  form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}



function renderSummary(list) {
  const total = list.reduce((sum, e) => sum + Number(e.amount), 0);
  document.getElementById("totalAmount").textContent = formatAmount(total);
  document.getElementById("expenseCount").textContent = list.length;

  if (list.length === 0) {
    document.getElementById("highestAmount").textContent = "0.00";
    document.getElementById("highestTitle").textContent = "-";
    return;
  }
  const highest = list.reduce((max, e) => (Number(e.amount) > Number(max.amount) ? e : max));
  document.getElementById("highestAmount").textContent = formatAmount(highest.amount);
  document.getElementById("highestTitle").textContent = highest.title;
}


function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderTable(list) {
  tableBody.innerHTML = "";

  if (list.length === 0) {
    const row = document.createElement("tr");
    const cell = makeElement("td", "text-center text-muted py-4", "No expenses found.");
    cell.colSpan = 5;
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  list.forEach((expense) => {
    const row = document.createElement("tr");

    row.appendChild(makeElement("td", "expense-title", expense.title));
    row.appendChild(makeElement("td", "text-end amount-cell", formatAmount(expense.amount)));

    const categoryCell = document.createElement("td");
    const badgeClass = CATEGORY_BADGES[expense.category] || "bg-secondary";
    categoryCell.appendChild(makeElement("span", "badge " + badgeClass, expense.category));
    row.appendChild(categoryCell);

    row.appendChild(makeElement("td", "text-nowrap", formatDate(expense.date)));

   
    const actions = makeElement("td", "text-end text-nowrap");
    const editBtn = makeElement("button", "btn btn-sm btn-outline-primary me-2", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => openEditModal(expense.id));
    const deleteBtn = makeElement("button", "btn btn-sm btn-outline-danger", "Delete");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => handleDelete(expense, deleteBtn));
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);

    tableBody.appendChild(row);
  });
}


function applyFilter() {
  const selected = filterSelect.value;
  const search = searchInput.value.trim().toLowerCase();

  const filtered = allExpenses.filter((e) => {
    const categoryMatch = selected === "All" || e.category === selected;
    const titleMatch = e.title.toLowerCase().includes(search);
    return categoryMatch && titleMatch;
  });
  renderTable(filtered);
}


async function refresh() {
  setSpinner(true);
  try {
    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
    alertBox.innerHTML = "";
    return true;
  } catch (err) {
    showAlert(alertBox, err.message);
    return false;
  } finally {
    setSpinner(false);
  }
}



addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = readAndValidate({ title: "title", amount: "amount", category: "category", date: "date" });
  if (!data) return;

  setBusy(addBtn, true, "Adding...");
  try {
    await addExpense(data);
    addForm.reset();
    document.getElementById("date").value = todayString();
    clearValidation(addForm);
    await refresh();
  } catch (err) {
    showAlert(alertBox, err.message); 
  } finally {
    setBusy(addBtn, false);
  }
});



function openEditModal(id) {
  const expense = allExpenses.find((e) => e.id === id);
  if (!expense) return;

  clearValidation(editForm);
  modalAlertBox.innerHTML = "";
  document.getElementById("editId").value = expense.id;
  document.getElementById("editTitle").value = expense.title;
  document.getElementById("editAmount").value = expense.amount;
  document.getElementById("editCategory").value = expense.category;
  document.getElementById("editDate").value = toInputDate(expense.date);
  editModal.show();
}

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = readAndValidate({
    title: "editTitle",
    amount: "editAmount",
    category: "editCategory",
    date: "editDate",
  });
  if (!data) return;

  const id = document.getElementById("editId").value;
  setBusy(saveBtn, true, "Saving...");
  try {
    await updateExpense(id, data);
    editModal.hide();
    await refresh();
  } catch (err) {
    showAlert(modalAlertBox, err.message);
  } finally {
    setBusy(saveBtn, false);
  }
});



async function handleDelete(expense, button) {
  if (!confirm('Delete "' + expense.title + '"?')) return;

  button.disabled = true;
  try {
    await deleteExpense(expense.id);
    await refresh();
  } catch (err) {
    showAlert(alertBox, err.message);
    button.disabled = false;
  }
}



filterSelect.addEventListener("change", applyFilter);
searchInput.addEventListener("input", applyFilter);
document.getElementById("date").value = todayString();
refresh();
