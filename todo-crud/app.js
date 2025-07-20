const API_URL = '/todos'; // IMPORTANTE: caminho relativo!

// Elementos DOM
const todosContainer = document.getElementById('todos-container');
const newTodoInput = document.getElementById('new-todo');

// Carregar TODOs ao iniciar
document.addEventListener('DOMContentLoaded', loadTodos);

// Carregar tarefas do servidor
async function loadTodos() {
  try {
    const response = await fetch(API_URL);
    const todos = await response.json();
    renderTodos(todos);
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
  }
}

// Renderizar lista de tarefas
function renderTodos(todos) {
  todosContainer.innerHTML = '';
  
  todos.forEach(todo => {
    const todoElement = document.createElement('div');
    todoElement.className = 'todo';
    todoElement.dataset.id = todo.id;

    todoElement.innerHTML = `
      <input 
        type="checkbox" 
        ${todo.completed ? 'checked' : ''}
        onchange="toggleComplete(${todo.id})"
      >
      <span class="${todo.completed ? 'completed' : ''}">${todo.title}</span>
      <button onclick="editTodo(${todo.id})">✏️</button>
      <button onclick="deleteTodo(${todo.id})">🗑️</button>
    `;
    
    todosContainer.appendChild(todoElement);
  });
}

// Adicionar nova tarefa
async function addTodo() {
  const title = newTodoInput.value.trim();
  if (!title) return;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (response.ok) {
      newTodoInput.value = '';
      loadTodos();
    }
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error);
  }
}

// Alternar status de conclusão
async function toggleComplete(id) {
  const todoElement = document.querySelector(`.todo[data-id="${id}"]`);
  const completed = todoElement.querySelector('input[type="checkbox"]').checked;
  
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    
    loadTodos();
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
  }
}

// Editar tarefa
async function editTodo(id) {
  const newTitle = prompt('Editar tarefa:');
  if (!newTitle) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
    
    loadTodos();
  } catch (error) {
    console.error("Erro ao editar tarefa:", error);
  }
}

// Excluir tarefa
async function deleteTodo(id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadTodos();
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
  }
}