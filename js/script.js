const DOM = {
  form: document.getElementById("todo-form"),
  log: document.getElementById("log"),
  tableBody: document.getElementById("table-body"),
  deleteAllBtn: document.getElementById("delete-all"),
  filterSelect: document.getElementById("filter"),
  datePicker: document.getElementById("date"),
  dateLabel: document.getElementById("date-label"),
  todoInput: document.getElementById("todo"),
  dateInput: document.getElementById("date"),
};

let todos = [];
let currentFilter = "all";
let activeSubtaskForm = null;
let activeEditRow = null;

const createEl = (tag, className = "", attrs = {}) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([key, value]) => (el[key] = value));
  return el;
};

const createButton = (className, innerHTML, onClick) => {
  const btn = createEl("button", className);
  btn.innerHTML = innerHTML;
  btn.onclick = onClick;
  return btn;
};

const ICONS = {
  add: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`,
};

const saveTodos = () => {
  localStorage.setItem("todos", JSON.stringify(todos));
  updateLog();
};

const loadTodos = () => {
  const saved = localStorage.getItem("todos");
  if (saved) {
    todos = JSON.parse(saved).map((todo) => ({
      ...todo,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      subtasks: (todo.subtasks || []).map((st) => ({
        ...st,
        dueDate: st.dueDate ? new Date(st.dueDate) : null,
      })),
    }));
  }
};

const updateLog = () => {
  const totalSubtasks = todos.reduce(
    (sum, t) => sum + (t.subtasks?.length || 0),
    0
  );
  const filtered =
    currentFilter === "all"
      ? todos
      : todos.filter((t) => t.status === currentFilter);
  const filteredSubtasks = filtered.reduce(
    (sum, t) => sum + (t.subtasks?.length || 0),
    0
  );

  if (currentFilter === "all") {
    DOM.log.textContent = `Total: ${todos.length} task${
      todos.length !== 1 ? "s" : ""
    } (${totalSubtasks} subtask${totalSubtasks !== 1 ? "s" : ""})`;
  } else {
    DOM.log.textContent = `Showing ${
      filtered.length
    } ${currentFilter.toLowerCase()} task${
      filtered.length !== 1 ? "s" : ""
    } of ${todos.length} total (${filteredSubtasks} subtask${
      filteredSubtasks !== 1 ? "s" : ""
    })`;
  }
};

const updateStatusBadge = (el, status) => {
  el.textContent = status;
  el.className = `px-3 py-2 rounded-xl text-white font-normal text-sm ${
    status === "Pending" ? "bg-yellow-500" : "bg-green-500"
  }`;
};

const updateCompleteBtn = (btn, status) => {
  btn.className =
    (status === "Completed"
      ? "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
      : "bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg") +
    " complete-btn";
  btn.innerHTML = status === "Completed" ? ICONS.close : ICONS.check;
};

const createActionButtons = (item, row, isSubtask = false) => {
  const container = createEl("div", "flex gap-2");

  const buttons = isSubtask
    ? [
        createButton(
          "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg",
          ICONS.edit,
          () => {
            const cells = { task: row.cells[0], date: row.cells[1] };
            enterEditMode(row, item, cells, container, true);
          }
        ),
        createButton("complete-btn", "", () => toggleComplete(item, row)),
        createButton(
          "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg",
          ICONS.delete,
          () => deleteSubtask(item, row)
        ),
      ]
    : [
        createButton(
          "bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg",
          ICONS.add,
          () => toggleSubtaskForm(item.id)
        ),
        createButton(
          "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg",
          ICONS.edit,
          () => {
            const cells = { task: row.cells[0], date: row.cells[1] };
            enterEditMode(row, item, cells, container, false);
          }
        ),
        createButton("complete-btn", "", () => toggleComplete(item, row)),
        createButton(
          "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg",
          ICONS.delete,
          () => deleteTodo(item, row)
        ),
      ];

  buttons.forEach((btn) => container.appendChild(btn));
  updateCompleteBtn(buttons[isSubtask ? 1 : 2], item.status);
  return container;
};

const toggleComplete = (item, row) => {
  item.status = item.status === "Pending" ? "Completed" : "Pending";
  const badge = row.querySelector(".status-cell span");
  const btn = row.querySelector(".complete-btn");
  updateStatusBadge(badge, item.status);
  updateCompleteBtn(btn, item.status);
  saveTodos();
};

const deleteTodo = (todo, row) => {
  if (!confirm(`Are you sure you want to delete the task "${todo.task}"?`))
    return;
  todos = todos.filter((t) => t.id !== todo.id);
  row.remove();
  DOM.tableBody
    .querySelectorAll(`tr[data-parent-id="${todo.id}"]`)
    .forEach((r) => r.remove());
  removeSubtaskForm(todo.id);
  saveTodos();
  checkEmpty();
};

const deleteSubtask = (subtask, row) => {
  if (
    !confirm(`Are you sure you want to delete the subtask "${subtask.task}"?`)
  )
    return;
  const parentId = parseInt(row.dataset.parentId);
  const parent = todos.find((t) => t.id === parentId);
  if (parent) {
    parent.subtasks = parent.subtasks.filter((st) => st.id !== subtask.id);
    saveTodos();
  }
  row.remove();
};

const enterEditMode = (row, item, cells, actionContainer, isSubtask) => {
  if (activeEditRow && activeEditRow !== row) cancelEdit(activeEditRow);

  activeEditRow = row;
  row.dataset.editMode = "true";

  const original = { task: item.task, date: item.dueDate };

  cells.task.className = `px-4 py-2 align-middle${isSubtask ? " pl-12" : ""}`;
  const taskInput = createEl(
    "input",
    `flex-1 border border-white rounded-lg p-2 px-4 text-white bg-transparent${
      isSubtask ? " ml-8" : ""
    }`,
    {
      type: "text",
      value: item.task,
    }
  );
  cells.task.innerHTML = "";
  cells.task.appendChild(taskInput);

  const dateWrapper = createEl("div", "relative");
  const dateInput = createEl(
    "input",
    "w-full border border-white rounded-lg p-2 px-4 text-white bg-transparent peer",
    {
      type: "date",
      value: item.dueDate ? item.dueDate.toISOString().split("T")[0] : "",
    }
  );

  const dateLabel = createEl(
    "label",
    "block md:hidden absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-all"
  );
  dateLabel.textContent = "mm/dd/yyyy";
  if (dateInput.value) dateLabel.classList.add("hidden");

  const calendarIcon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  calendarIcon.setAttribute(
    "class",
    "w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white"
  );
  calendarIcon.setAttribute("fill", "none");
  calendarIcon.setAttribute("viewBox", "0 0 24 24");
  calendarIcon.setAttribute("stroke", "currentColor");
  calendarIcon.innerHTML =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />';

  dateWrapper.append(dateInput, dateLabel, calendarIcon);
  cells.date.innerHTML = "";
  cells.date.appendChild(dateWrapper);

  dateInput.addEventListener("input", () =>
    dateLabel.classList.toggle("hidden", !!dateInput.value)
  );

  const saveBtn = createButton(
    "bg-green-500 text-white p-2 rounded-lg opacity-50 cursor-not-allowed",
    ICONS.check,
    () => {
      if (!saveBtn.disabled) {
        item.task = taskInput.value.trim();
        item.dueDate = dateInput.value ? new Date(dateInput.value) : null;
        saveTodos();
        exitEditMode(row, item, cells, actionContainer, isSubtask);
      }
    }
  );
  saveBtn.disabled = true;

  const cancelBtn = createButton(
    "bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg",
    ICONS.close,
    () => exitEditMode(row, item, cells, actionContainer, isSubtask)
  );

  const checkChanges = () => {
    const changed =
      taskInput.value.trim() !== original.task ||
      dateInput.value !== (original.date?.toISOString().split("T")[0] || "");
    const valid = taskInput.value.trim().length > 0;
    saveBtn.disabled = !(changed && valid);
    saveBtn.className = saveBtn.disabled
      ? "bg-green-500 text-white p-2 rounded-lg opacity-50 cursor-not-allowed"
      : "bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg";
  };

  taskInput.addEventListener("input", checkChanges);
  dateInput.addEventListener("change", checkChanges);

  [taskInput, dateInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !saveBtn.disabled) saveBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    });
  });

  actionContainer.innerHTML = "";
  actionContainer.append(saveBtn, cancelBtn);
  taskInput.focus();
  taskInput.select();
};

const exitEditMode = (row, item, cells, actionContainer, isSubtask) => {
  delete row.dataset.editMode;
  activeEditRow = null;

  cells.task.className = `px-4 py-2 truncate max-w-xs align-middle${
    isSubtask ? " pl-12" : ""
  }`;
  cells.task.textContent = isSubtask ? "↳ " + item.task : item.task;

  cells.date.className = "px-4 py-2 whitespace-nowrap";
  cells.date.textContent = item.dueDate
    ? item.dueDate.toLocaleDateString()
    : "No due date";

  actionContainer.innerHTML = "";
  actionContainer.appendChild(createActionButtons(item, row, isSubtask));
};

const cancelEdit = (row) => {
  if (!row.dataset.editMode) return;
  const isSubtask = row.dataset.type === "subtask";
  const itemId = parseInt(row.dataset.id);
  let item;

  if (isSubtask) {
    const parentId = parseInt(row.dataset.parentId);
    const parent = todos.find((t) => t.id === parentId);
    item = parent?.subtasks.find((st) => st.id === itemId);
  } else {
    item = todos.find((t) => t.id === itemId);
  }

  if (item) {
    const cells = { task: row.cells[0], date: row.cells[1] };
    const actionContainer = row.querySelector(".flex.gap-2");
    exitEditMode(row, item, cells, actionContainer, isSubtask);
  }
};

const createRow = (item, parentId = null) => {
  const isSubtask = parentId !== null;
  const row = createEl(
    "tr",
    isSubtask ? "text-white bg-[#6b3ec4]" : "text-white"
  );
  row.dataset.id = item.id;
  row.dataset.type = isSubtask ? "subtask" : "parent";
  if (isSubtask) row.dataset.parentId = parentId;

  const taskCell = createEl(
    "td",
    `px-4 py-2 truncate max-w-xs align-middle${isSubtask ? " pl-12" : ""}`
  );
  taskCell.textContent = isSubtask ? "↳ " + item.task : item.task;

  const dateCell = createEl("td", "px-4 py-2 whitespace-nowrap");
  dateCell.textContent = item.dueDate
    ? item.dueDate.toLocaleDateString()
    : "No due date";

  const statusCell = createEl("td", "px-4 py-2 status-cell");
  const badge = createEl("span");
  updateStatusBadge(badge, item.status);
  statusCell.appendChild(badge);

  const actionsCell = createEl("td", "px-4 py-2");
  actionsCell.appendChild(createActionButtons(item, row, isSubtask));

  row.append(taskCell, dateCell, statusCell, actionsCell);
  return row;
};

const addTodoRow = (todo) => {
  const row = createRow(todo);
  DOM.tableBody.appendChild(row);
  if (todo.subtasks?.length) {
    todo.subtasks.forEach((st) =>
      DOM.tableBody.appendChild(createRow(st, todo.id))
    );
  }
};

const toggleSubtaskForm = (parentId) => {
  if (activeEditRow) cancelEdit(activeEditRow);
  if (activeSubtaskForm && activeSubtaskForm !== parentId)
    removeSubtaskForm(activeSubtaskForm);

  const existing = DOM.tableBody.querySelector(
    `tr[data-subtask-form="${parentId}"]`
  );
  if (existing) {
    existing.remove();
    activeSubtaskForm = null;
    return;
  }

  const parent = todos.find((t) => t.id === parentId);
  if (!parent) return;

  if (!parent.subtasks) parent.subtasks = [];

  const formRow = createEl("tr", "text-white bg-[#6b3ec4]");
  formRow.dataset.subtaskForm = parentId;

  const truncated =
    parent.task.length > 10
      ? parent.task.substring(0, 10) + "..."
      : parent.task;

  formRow.innerHTML = `<td colspan="4" class="px-4 py-3">
    <form class="flex flex-col sm:flex-row gap-3 pl-8">
      <input name="subtask" type="text" placeholder="Add subtask for ${truncated}"
        class="flex-1 border border-white rounded-lg p-2 px-4 text-white bg-transparent placeholder-gray-200" required/>
      <div class="relative flex-1">
        <input name="subtask-date" type="date" class="w-full border border-white rounded-lg p-2 px-4 text-white peer" />
        <label class="block md:hidden absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-all">mm/dd/yyyy</label>
        <svg class="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
      </div>
      <button type="submit" class="border border-white rounded-lg px-4 py-2 bg-[#f72585] text-white font-bold hover:bg-pink-600 transition">＋</button>
      <button type="button" class="border border-white rounded-lg px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 transition">Cancel</button>
    </form>
  </td>`;

  const form = formRow.querySelector("form");
  const taskInput = form.querySelector('input[name="subtask"]');
  const dateInput = form.querySelector('input[name="subtask-date"]');
  const label = form.querySelector("label");

  dateInput.addEventListener("input", () =>
    label.classList.toggle("hidden", !!dateInput.value)
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    if (!taskInput.value.trim()) return;

    const subtask = {
      id: Date.now(),
      task: taskInput.value.trim(),
      dueDate: dateInput.value ? new Date(dateInput.value) : null,
      status: "Pending",
    };

    parent.subtasks.push(subtask);
    saveTodos();

    formRow.parentNode.insertBefore(createRow(subtask, parentId), formRow);
    taskInput.value = "";
    dateInput.value = "";
    label.classList.remove("hidden");
  };

  form.querySelector('button[type="button"]').onclick = () => {
    formRow.remove();
    activeSubtaskForm = null;
  };

  const parentRow = DOM.tableBody.querySelector(
    `tr[data-id="${parentId}"][data-type="parent"]`
  );
  const lastSubtask = [
    ...DOM.tableBody.querySelectorAll(`tr[data-parent-id="${parentId}"]`),
  ].pop();
  const insertAfter = lastSubtask || parentRow;
  insertAfter.parentNode.insertBefore(formRow, insertAfter.nextSibling);

  activeSubtaskForm = parentId;
};

const removeSubtaskForm = (parentId) => {
  const form = DOM.tableBody.querySelector(
    `tr[data-subtask-form="${parentId}"]`
  );
  if (form) {
    form.remove();
    if (activeSubtaskForm === parentId) activeSubtaskForm = null;
  }
};

const renderAll = () => {
  DOM.tableBody.innerHTML = "";
  activeSubtaskForm = null;
  activeEditRow = null;

  const filtered =
    currentFilter === "all"
      ? todos
      : todos.filter((t) => t.status === currentFilter);
  filtered.forEach(addTodoRow);
  checkEmpty();
  updateLog();
};

const checkEmpty = () => {
  const placeholder = DOM.tableBody.querySelector(
    "tr[data-placeholder='true']"
  );
  if (placeholder) placeholder.remove();

  const filtered =
    currentFilter === "all"
      ? todos
      : todos.filter((t) => t.status === currentFilter);

  if (!filtered.length) {
    const messages = {
      all: "No tasks",
      Pending: "No pending tasks",
      Completed: "No completed tasks",
    };
    DOM.tableBody.innerHTML = `<tr data-placeholder="true"><td colspan="4" class="px-4 py-4 text-white text-center italic">${messages[currentFilter]}</td></tr>`;
  }
};

DOM.filterSelect.addEventListener("change", () => {
  currentFilter = DOM.filterSelect.value;
  renderAll();
});

DOM.datePicker.addEventListener("input", () =>
  DOM.dateLabel.classList.toggle("hidden", !!DOM.datePicker.value)
);

DOM.form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!DOM.todoInput.value.trim()) return;

  const todo = {
    id: Date.now(),
    task: DOM.todoInput.value.trim(),
    dueDate: DOM.dateInput.value ? new Date(DOM.dateInput.value) : null,
    status: "Pending",
    subtasks: [],
  };

  todos.push(todo);
  saveTodos();

  if (currentFilter === "all" || todo.status === currentFilter) {
    const placeholder = DOM.tableBody.querySelector(
      "tr[data-placeholder='true']"
    );
    if (placeholder) placeholder.remove();
    addTodoRow(todo);
  }

  DOM.todoInput.value = "";
  DOM.dateInput.value = "";
  DOM.dateLabel.classList.remove("hidden");
});

DOM.deleteAllBtn.addEventListener("click", () => {
  if (!confirm("Are you sure you want to delete all tasks?")) return;
  todos = [];
  localStorage.removeItem("todos");
  saveTodos();
  renderAll();
});

window.addEventListener("DOMContentLoaded", () => {
  loadTodos();
  renderAll();
});
