const todoForm = document.getElementById("todo-form");
const log = document.getElementById("log");
const tableBody = document.getElementById("table-body");
const deleteAllBtn = document.getElementById("delete-all");
const filterSelect = document.getElementById("filter");
let todos = [];
let currentFilter = "all";
let activeSubtaskForm = null;
let activeEditRow = null;

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
      subtasks: (todo.subtasks || []).map((subtask) => ({
        ...subtask,
        dueDate: subtask.dueDate ? new Date(subtask.dueDate) : null,
      })),
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
    subtasks: [],
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
  row.dataset.type = "parent";

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

  const addSubtaskBtn = document.createElement("button");
  addSubtaskBtn.className =
    "bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg";
  addSubtaskBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`;
  addSubtaskBtn.onclick = () => toggleSubtaskForm(todo.id);

  const editBtn = document.createElement("button");
  editBtn.className =
    "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg";
  editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>`;
  editBtn.onclick = () => {
    enterEditMode(row, todo, task, dueDate, actionContainer, false);
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
    removeSubtaskRows(todo.id);
    removeSubtaskForm(todo.id);
    saveTodos();
    checkEmpty();
  };

  actionContainer.append(addSubtaskBtn, editBtn, completeBtn, deleteBtn);
  actions.appendChild(actionContainer);
  row.append(task, dueDate, status, actions);
  tableBody.appendChild(row);

  // Render existing subtasks
  if (todo.subtasks && todo.subtasks.length > 0) {
    todo.subtasks.forEach((subtask) => {
      addSubtaskRow(subtask, todo.id, todo.task);
    });
  }

  checkEmpty();
}

function enterEditMode(
  row,
  itemData,
  taskCell,
  dueDateCell,
  actionContainer,
  isSubtask
) {
  if (activeEditRow && activeEditRow !== row) {
    cancelEdit(activeEditRow);
  }

  activeEditRow = row;
  row.dataset.editMode = "true";

  const originalTask = itemData.task;
  const originalDate = itemData.dueDate;

  taskCell.className = "px-4 py-2 align-middle";
  if (isSubtask) {
    taskCell.className += " pl-12";
  }

  taskCell.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-center gap-2";

  const taskInput = document.createElement("input");
  taskInput.type = "text";
  taskInput.value = itemData.task;
  taskInput.className =
    "flex-1 border-2 border-white rounded-lg p-2 px-4 text-white bg-transparent";

  if (isSubtask) {
    taskInput.className += " ml-8";
  }
  taskCell.innerHTML = "";
  wrapper.appendChild(taskInput);
  taskCell.appendChild(wrapper);

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className =
    "border-2 border-white rounded-lg p-2 px-4 text-white bg-transparent";
  if (itemData.dueDate) {
    const year = itemData.dueDate.getFullYear();
    const month = String(itemData.dueDate.getMonth() + 1).padStart(2, "0");
    const day = String(itemData.dueDate.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
  }
  dueDateCell.innerHTML = "";
  dueDateCell.appendChild(dateInput);

  const saveBtn = document.createElement("button");
  saveBtn.className =
    "bg-green-500 text-white p-2 rounded-lg opacity-50 cursor-not-allowed";
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`;

  const cancelBtn = document.createElement("button");
  cancelBtn.className =
    "bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg";
  cancelBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

  const checkChanges = () => {
    const taskChanged = taskInput.value.trim() !== originalTask;
    const dateChanged =
      dateInput.value !==
      (originalDate
        ? `${originalDate.getFullYear()}-${String(
            originalDate.getMonth() + 1
          ).padStart(2, "0")}-${String(originalDate.getDate()).padStart(
            2,
            "0"
          )}`
        : "");
    const hasValidTask = taskInput.value.trim().length > 0;

    if ((taskChanged || dateChanged) && hasValidTask) {
      saveBtn.disabled = false;
      saveBtn.className =
        "bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg";
    } else {
      saveBtn.disabled = true;
      saveBtn.className =
        "bg-green-500 text-white p-2 rounded-lg opacity-50 cursor-not-allowed";
    }
  };

  taskInput.addEventListener("input", checkChanges);
  dateInput.addEventListener("change", checkChanges);

  saveBtn.onclick = () => {
    if (!saveBtn.disabled) {
      itemData.task = taskInput.value.trim();
      itemData.dueDate = dateInput.value ? new Date(dateInput.value) : null;
      saveTodos();
      exitEditMode(
        row,
        itemData,
        taskCell,
        dueDateCell,
        actionContainer,
        isSubtask
      );
    }
  };

  cancelBtn.onclick = () => {
    exitEditMode(
      row,
      itemData,
      taskCell,
      dueDateCell,
      actionContainer,
      isSubtask
    );
  };

  const handleEnter = (e) => {
    if (e.key === "Enter" && !saveBtn.disabled) {
      saveBtn.click();
    } else if (e.key === "Escape") {
      cancelBtn.click();
    }
  };
  taskInput.addEventListener("keydown", handleEnter);
  dateInput.addEventListener("keydown", handleEnter);

  actionContainer.innerHTML = "";
  actionContainer.append(saveBtn, cancelBtn);

  taskInput.focus();
  taskInput.select();
}

function exitEditMode(
  row,
  itemData,
  taskCell,
  dueDateCell,
  actionContainer,
  isSubtask
) {
  delete row.dataset.editMode;
  activeEditRow = null;

  taskCell.innerHTML = "";
  taskCell.className = "px-4 py-2 truncate max-w-xs align-middle";
  if (isSubtask) {
    taskCell.className += " pl-12";
    taskCell.textContent = "↳ " + itemData.task;
  } else {
    taskCell.textContent = itemData.task;
  }

  dueDateCell.innerHTML = "";
  dueDateCell.className = "px-4 py-2 whitespace-nowrap";
  dueDateCell.textContent = itemData.dueDate
    ? itemData.dueDate.toLocaleDateString()
    : "No due date";

  actionContainer.innerHTML = "";

  if (isSubtask) {
    const editBtn = document.createElement("button");
    editBtn.className =
      "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg";
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
    editBtn.onclick = () => {
      enterEditMode(
        row,
        itemData,
        taskCell,
        dueDateCell,
        actionContainer,
        true
      );
    };

    const statusCell = row.querySelector(".status-cell span");
    const completeBtn = document.createElement("button");
    completeBtn.classList.add("complete-btn");
    updateCompleteBtn(completeBtn, itemData.status);
    completeBtn.onclick = () => {
      itemData.status = itemData.status === "Pending" ? "Completed" : "Pending";
      updateStatusBadge(statusCell, itemData.status);
      updateCompleteBtn(completeBtn, itemData.status);
      saveTodos();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
    deleteBtn.onclick = () => {
      const parentId = parseInt(row.dataset.parentId);
      const parentTodo = todos.find((t) => t.id === parentId);
      if (parentTodo) {
        parentTodo.subtasks = parentTodo.subtasks.filter(
          (st) => st.id !== itemData.id
        );
        saveTodos();
      }
      row.remove();
    };

    actionContainer.append(editBtn, completeBtn, deleteBtn);
  } else {
    const addSubtaskBtn = document.createElement("button");
    addSubtaskBtn.className =
      "bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg";
    addSubtaskBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`;
    addSubtaskBtn.onclick = () => toggleSubtaskForm(itemData.id);

    const editBtn = document.createElement("button");
    editBtn.className =
      "bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg";
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
    editBtn.onclick = () => {
      enterEditMode(
        row,
        itemData,
        taskCell,
        dueDateCell,
        actionContainer,
        false
      );
    };

    const statusCell = row.querySelector(".status-cell span");
    const completeBtn = document.createElement("button");
    completeBtn.classList.add("complete-btn");
    updateCompleteBtn(completeBtn, itemData.status);
    completeBtn.onclick = () => {
      itemData.status = itemData.status === "Pending" ? "Completed" : "Pending";
      updateStatusBadge(statusCell, itemData.status);
      updateCompleteBtn(completeBtn, itemData.status);
      saveTodos();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
    deleteBtn.onclick = () => {
      todos = todos.filter((t) => t.id !== itemData.id);
      row.remove();
      removeSubtaskRows(itemData.id);
      removeSubtaskForm(itemData.id);
      saveTodos();
      checkEmpty();
    };

    actionContainer.append(addSubtaskBtn, editBtn, completeBtn, deleteBtn);
  }
}

function cancelEdit(row) {
  if (!row.dataset.editMode) return;

  const isSubtask = row.dataset.type === "subtask";
  const itemId = parseInt(row.dataset.id);
  let itemData;

  if (isSubtask) {
    const parentId = parseInt(row.dataset.parentId);
    const parentTodo = todos.find((t) => t.id === parentId);
    itemData = parentTodo?.subtasks.find((st) => st.id === itemId);
  } else {
    itemData = todos.find((t) => t.id === itemId);
  }

  if (itemData) {
    const taskCell = row.cells[0];
    const dueDateCell = row.cells[1];
    const actionContainer = row.querySelector(".flex.gap-2");
    exitEditMode(
      row,
      itemData,
      taskCell,
      dueDateCell,
      actionContainer,
      isSubtask
    );
  }
}

function toggleSubtaskForm(parentId) {
  if (activeEditRow) {
    cancelEdit(activeEditRow);
  }

  if (activeSubtaskForm && activeSubtaskForm !== parentId) {
    removeSubtaskForm(activeSubtaskForm);
  }

  const existingForm = tableBody.querySelector(
    `tr[data-subtask-form="${parentId}"]`
  );
  if (existingForm) {
    existingForm.remove();
    activeSubtaskForm = null;
    return;
  }

  const parentTodo = todos.find((t) => t.id === parentId);
  if (!parentTodo) return;

  const parentRow = tableBody.querySelector(
    `tr[data-id="${parentId}"][data-type="parent"]`
  );
  if (!parentRow) return;

  const formRow = document.createElement("tr");
  formRow.classList.add("text-white", "bg-[#6b3ec4]");
  formRow.dataset.subtaskForm = parentId;

  const formCell = document.createElement("td");
  formCell.colSpan = 4;
  formCell.className = "px-4 py-3";

  const form = document.createElement("form");
  form.className = "flex flex-col sm:flex-row gap-3 pl-8";
  form.onsubmit = (e) => {
    e.preventDefault();
    const taskInput = form.querySelector('input[name="subtask"]');
    const dateInput = form.querySelector('input[name="subtask-date"]');

    if (!taskInput.value.trim()) return;

    const subtask = {
      id: Date.now(),
      task: taskInput.value.trim(),
      dueDate: dateInput.value ? new Date(dateInput.value) : null,
      status: "Pending",
    };

    parentTodo.subtasks.push(subtask);
    saveTodos();

    const subtaskRow = createSubtaskRow(subtask, parentId, parentTodo.task);
    formRow.parentNode.insertBefore(subtaskRow, formRow);

    taskInput.value = "";
    dateInput.value = "";
  };

  const truncatedTask =
    parentTodo.task.length > 10
      ? parentTodo.task.substring(0, 10) + "..."
      : parentTodo.task;

  form.innerHTML = `
    <input name="subtask" type="text" placeholder="Add subtask for ${truncatedTask}"
      class="flex-1 border-2 border-white rounded-lg p-2 px-4 text-white bg-transparent placeholder-gray-200" />
    <input name="subtask-date" type="date"
      class="border-2 border-white rounded-lg p-2 px-4 text-white bg-transparent" />
    <button type="submit"
      class="border-2 border-white rounded-lg px-4 py-2 bg-[#fd05a0] text-white font-bold hover:bg-pink-600 transition">
      ＋
    </button>
    <button type="button" onclick="this.closest('tr').remove(); activeSubtaskForm = null;"
      class="border-2 border-white rounded-lg px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 transition">
      Cancel
    </button>
  `;

  formCell.appendChild(form);
  formRow.appendChild(formCell);

  const lastSubtaskRow = getLastSubtaskRow(parentId);
  if (lastSubtaskRow) {
    lastSubtaskRow.parentNode.insertBefore(formRow, lastSubtaskRow.nextSibling);
  } else {
    parentRow.parentNode.insertBefore(formRow, parentRow.nextSibling);
  }

  activeSubtaskForm = parentId;
}

function removeSubtaskForm(parentId) {
  const formRow = tableBody.querySelector(
    `tr[data-subtask-form="${parentId}"]`
  );
  if (formRow) {
    formRow.remove();
    if (activeSubtaskForm === parentId) {
      activeSubtaskForm = null;
    }
  }
}

function getLastSubtaskRow(parentId) {
  const subtaskRows = tableBody.querySelectorAll(
    `tr[data-parent-id="${parentId}"][data-type="subtask"]`
  );
  return subtaskRows.length > 0 ? subtaskRows[subtaskRows.length - 1] : null;
}

function createSubtaskRow(subtask, parentId, parentTask) {
  const row = document.createElement("tr");
  row.classList.add("text-white", "bg-[#6b3ec4]");
  row.dataset.id = subtask.id;
  row.dataset.parentId = parentId;
  row.dataset.type = "subtask";

  const task = document.createElement("td");
  task.className = "px-4 py-2 truncate max-w-xs align-middle pl-12";
  task.textContent = "↳ " + subtask.task;

  const dueDate = document.createElement("td");
  dueDate.className = "px-4 py-2 whitespace-nowrap";
  if (subtask.dueDate) {
    const dateObj =
      subtask.dueDate instanceof Date
        ? subtask.dueDate
        : new Date(subtask.dueDate);
    dueDate.textContent = dateObj.toLocaleDateString();
  } else {
    dueDate.textContent = "No due date";
  }

  const status = document.createElement("td");
  status.className = "px-4 py-2 status-cell";
  const statusBadge = document.createElement("span");
  updateStatusBadge(statusBadge, subtask.status);
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
    enterEditMode(row, subtask, task, dueDate, actionContainer, true);
  };

  const completeBtn = document.createElement("button");
  completeBtn.classList.add("complete-btn");
  updateCompleteBtn(completeBtn, subtask.status);
  completeBtn.onclick = () => {
    subtask.status = subtask.status === "Pending" ? "Completed" : "Pending";
    updateStatusBadge(statusBadge, subtask.status);
    updateCompleteBtn(completeBtn, subtask.status);
    saveTodos();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg";
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
  deleteBtn.onclick = () => {
    const parentTodo = todos.find((t) => t.id === parentId);
    if (parentTodo) {
      parentTodo.subtasks = parentTodo.subtasks.filter(
        (st) => st.id !== subtask.id
      );
      saveTodos();
    }
    row.remove();
  };

  actionContainer.append(editBtn, completeBtn, deleteBtn);
  actions.appendChild(actionContainer);
  row.append(task, dueDate, status, actions);

  return row;
}

function addSubtaskRow(subtask, parentId, parentTask) {
  const row = createSubtaskRow(subtask, parentId, parentTask);

  const parentRow = tableBody.querySelector(
    `tr[data-id="${parentId}"][data-type="parent"]`
  );
  if (!parentRow) return;

  const lastSubtaskRow = getLastSubtaskRow(parentId);
  const formRow = tableBody.querySelector(
    `tr[data-subtask-form="${parentId}"]`
  );

  if (formRow) {
    formRow.parentNode.insertBefore(row, formRow);
  } else if (lastSubtaskRow) {
    lastSubtaskRow.parentNode.insertBefore(row, lastSubtaskRow.nextSibling);
  } else {
    parentRow.parentNode.insertBefore(row, parentRow.nextSibling);
  }
}

function removeSubtaskRows(parentId) {
  const subtaskRows = tableBody.querySelectorAll(
    `tr[data-parent-id="${parentId}"]`
  );
  subtaskRows.forEach((row) => row.remove());
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
  activeSubtaskForm = null;
  activeEditRow = null;

  const filteredTodos =
    currentFilter === "all"
      ? todos
      : todos.filter((t) => t.status === currentFilter);

  if (filteredTodos.length === 0) {
    checkEmpty();
    return;
  }

  filteredTodos.forEach(addTodoRow);

  const totalSubtasks = todos.reduce(
    (sum, todo) => sum + (todo.subtasks?.length || 0),
    0
  );
  log.textContent = `Showing ${filteredTodos.length} of ${todos.length} todos (${totalSubtasks} subtasks)`;
}

function checkEmpty() {
  const totalSubtasks = todos.reduce(
    (sum, todo) => sum + (todo.subtasks?.length || 0),
    0
  );
  log.textContent = `Total todos: ${todos.length} (${totalSubtasks} subtasks)`;

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
  const totalSubtasks = todos.reduce(
    (sum, todo) => sum + (todo.subtasks?.length || 0),
    0
  );
  log.textContent = `Total todos: ${todos.length} (${totalSubtasks} subtasks)`;
}

deleteAllBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  localStorage.removeItem("todos");
  renderAll();
});
