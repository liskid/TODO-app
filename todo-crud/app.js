// Elementos DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const todosContainer = document.getElementById('todos-container');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerForm = document.getElementById('register-form');
const newTodoInput = document.getElementById('new-todo');

// Estado da aplicação
let currentUser = null;

// Funções de UI
function showRegister() {
  registerForm.classList.remove('hidden');
}

function showLogin() {
  registerForm.classList.add('hidden');
}

function showApp() {
  authContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  loadTodos();
}

function showAuth() {
  authContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

// Verificar token ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Tentar validar token
    fetch('/todos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        currentUser = parseJwt(token);
        showApp();
      } else {
        localStorage.removeItem('token');
        showAuth();
      }
    })
    .catch(() => {
      localStorage.removeItem('token');
      showAuth();
    });
  } else {
    showAuth();
  }
});

// Funções de autenticação
async function login() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  
  if (!username || !password) {
    alert('Preencha usuário e senha');
    return;
  }
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      currentUser = parseJwt(data.token);
      showApp();
    } else {
      alert(data.error || 'Erro no login');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro no servidor');
  }
}

async function register() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value.trim();
  
  if (!username || !password) {
    alert('Preencha usuário e senha');
    return;
  }
  
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Registro bem-sucedido! Faça login.');
      showLogin();
      registerUsername.value = '';
      registerPassword.value = '';
    } else {
      alert(data.error || 'Erro no registro');
    }
  } catch (error) {
    console.error('Erro ao registrar:', error);
    alert('Erro no servidor');
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  todosContainer.innerHTML = '';
  newTodoInput.value = '';
  loginUsername.value = '';
  loginPassword.value = '';
  showAuth();
}

// Funções de manipulação de TODOs
async function loadTodos() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/todos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }
      throw new Error('Erro ao carregar tarefas');
    }
    
    const todos = await response.json();
    renderTodos(todos);
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    alert('Erro ao carregar tarefas');
  }
}

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
        onchange="toggleComplete(${todo.id}, this.checked)"
      >
      <span class="${todo.completed ? 'completed' : ''}">${todo.title}</span>
      <button onclick="editTodo(${todo.id})">✏️</button>
      <button onclick="deleteTodo(${todo.id})">🗑️</button>
    `;
    
    todosContainer.appendChild(todoElement);
  });
}

async function addTodo() {
  const title = newTodoInput.value.trim();
  if (!title) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/todos', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title })
    });

    if (response.ok) {
      newTodoInput.value = '';
      loadTodos();
    } else if (response.status === 401) {
      logout();
    } else {
      const data = await response.json();
      alert(data.error || 'Erro ao adicionar tarefa');
    }
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error);
    alert('Erro no servidor');
  }
}

async function toggleComplete(id, completed) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/todos/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ completed })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }
      throw new Error('Erro ao atualizar tarefa');
    }
    
    loadTodos();
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    alert('Erro ao atualizar tarefa');
  }
}

async function editTodo(id) {
  const newTitle = prompt('Editar tarefa:');
  if (!newTitle) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/todos/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle })
    });
    
    if (response.ok) {
      loadTodos();
    } else if (response.status === 401) {
      logout();
    } else {
      const data = await response.json();
      alert(data.error || 'Erro ao editar tarefa');
    }
  } catch (error) {
    console.error("Erro ao editar tarefa:", error);
    alert('Erro no servidor');
  }
}

async function deleteTodo(id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/todos/${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok || response.status === 204) {
      loadTodos();
    } else if (response.status === 401) {
      logout();
    } else {
      const data = await response.json();
      alert(data.error || 'Erro ao excluir tarefa');
    }
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    alert('Erro no servidor');
  }
}

// Função utilitária para decodificar tokens JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}