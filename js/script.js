const todoForm = document.getElementById("todo-form");
const log = document.getElementById("log");
const tableBody = document.getElementById("table-body");
const deleteAllBtn = document.getElementById("delete-all");
const filterSelect = document.getElementById("filter");

let todos = [];
let currentFilter = "all";

filterSelect.addEventListener("change", () => {
  currentFilter = filterSelect.value;
  renderAll();
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTodos = localStorage.getItem("todos");
  if (savedTodos) {
    todos = JSON.parse(savedTodos).map((todo) => ({
      ...todo,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
    }));
  }
  renderAll();
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const todoInput = document.getElementById("todo");
  const dateInput = document.getElementById("date");

  if (!todoInput.value.trim()) return;

  const todoObj = {
    id: Date.now(),
    task: todoInput.value.trim(),
    dueDate: dateInput.value ? new Date(dateInput.value) : null,
    status: "Pending",
  };

  todos.push(todoObj);
  saveTodos();
  addTodoRow(todoObj);

  todoInput.value = "";
  dateInput.value = "";
});

function addTodoRow(todo) {
  const row = document.createElement("tr");
  row.classList.add("text-white");
  row.dataset.id = todo.id;

  const task = document.createElement("td");
  task.className = "px-4 py-2 truncate max-w-xs align-middle";
  task.textContent = todo.task;

  const dueDate = document.createElement("td");
  dueDate.className = "px-4 py-2 whitespace-nowrap";
  dueDate.textContent = todo.dueDate
    ? todo.dueDate.toLocaleDateString()
    : "No due date";

  const status = document.createElement("td");
  status.className = "px-4 py-2 status-cell";
  const statusBadge = document.createElement("span");
  updateStatusBadge(statusBadge, todo.status);
  status.appendChild(statusBadge);

  const actions = document.createElement("td");
  actions.className = "px-4 py-2";
  const actionContainer = document.createElement("div");
  actionContainer.className = "flex gap-2";

  const editBtn = document.createElement("button");
  editBtn.className =
    "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg";
  editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>`;
  editBtn.onclick = () => {
    const newTask = prompt("Edit task:", todo.task);
    if (newTask) {
      todo.task = newTask;
      task.textContent = newTask;
      saveTodos();
    }
  };

  const completeBtn = document.createElement("button");
  completeBtn.classList.add("complete-btn");
  updateCompleteBtn(completeBtn, todo.status);
  completeBtn.onclick = () => {
    todo.status = todo.status === "Pending" ? "Completed" : "Pending";
    updateStatusBadge(statusBadge, todo.status);
    updateCompleteBtn(completeBtn, todo.status);
    saveTodos();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg";
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
  deleteBtn.onclick = () => {
    todos = todos.filter((t) => t.id !== todo.id);
    row.remove();
    saveTodos();
    checkEmpty();
  };

  actionContainer.append(editBtn, completeBtn, deleteBtn);
  actions.appendChild(actionContainer);

  row.append(task, dueDate, status, actions);
  tableBody.appendChild(row);

  checkEmpty();
}

function updateStatusBadge(el, status) {
  el.textContent = status;
  el.className =
    "px-3 py-2 rounded-xl text-white font-normal text-sm " +
    (status === "Pending" ? "bg-yellow-500" : "bg-green-500");
}

function updateCompleteBtn(btn, status) {
  if (status === "Completed") {
    btn.className = "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      stroke-width="2" stroke="currentColor" class="w-4 h-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>`;
  } else {
    btn.className = "bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>`;
  }
}

function renderAll() {
  tableBody.innerHTML = "";
  const filteredTodos =
    currentFilter === "all"
      ? todos
      : todos.filter((t) => t.status === currentFilter);

  if (filteredTodos.length === 0) {
    checkEmpty();
    return;
  }

  filteredTodos.forEach(addTodoRow);
  log.textContent = `Showing ${filteredTodos.length} of ${todos.length} todos`;
}

function checkEmpty() {
  log.textContent = `Total todos: ${todos.length}`;

  const placeholder = tableBody.querySelector("tr[data-placeholder='true']");

  if (todos.length === 0) {
    if (!placeholder) {
      const tr = document.createElement("tr");
      tr.dataset.placeholder = "true";
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "px-4 py-4 text-white text-center italic";
      td.textContent = "No task";
      tr.appendChild(td);
      tableBody.innerHTML = "";
      tableBody.appendChild(tr);
    }
  } else {
    if (placeholder) placeholder.remove();
  }
}

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
  log.textContent = `Total todos: ${todos.length}`;
}

deleteAllBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  renderAll();
});
