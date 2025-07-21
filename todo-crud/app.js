// URL base da API - caminho relativo pois está no mesmo domínio
const API_URL = '/todos';

// Referências aos elementos DOM
const todosContainer = document.getElementById('todos-container');
const newTodoInput = document.getElementById('new-todo');

// Quando o documento estiver carregado, carrega as tarefas
document.addEventListener('DOMContentLoaded', loadTodos);

// Função assíncrona para carregar tarefas do servidor
async function loadTodos() {
  try {
    // Faz requisição GET para a API
    const response = await fetch(API_URL);
    
    // Converte a resposta para JSON
    const todos = await response.json();
    
    // Renderiza as tarefas na tela
    renderTodos(todos);
  } catch (error) {
    // Log de erro no console
    console.error("Erro ao carregar tarefas:", error);
  }
}

// Função para renderizar a lista de tarefas
function renderTodos(todos) {
  // Limpa o container
  todosContainer.innerHTML = '';
  
  // Para cada tarefa, cria um elemento HTML
  todos.forEach(todo => {
    // Cria um div para a tarefa
    const todoElement = document.createElement('div');
    // Adiciona classe CSS
    todoElement.className = 'todo';
    // Armazena o ID como atributo de dados
    todoElement.dataset.id = todo.id;

    // Preenche o HTML interno do elemento
    todoElement.innerHTML = `
      <!-- Checkbox para marcar como completado -->
      <input 
        type="checkbox" 
        ${todo.completed ? 'checked' : ''} // Pré-marca se completado
        onchange="toggleComplete(${todo.id})" // Chama função ao mudar
      >
      <!-- Texto da tarefa com classe condicional -->
      <span class="${todo.completed ? 'completed' : ''}">${todo.title}</span>
      <!-- Botão para editar -->
      <button onclick="editTodo(${todo.id})">✏️</button>
      <!-- Botão para excluir -->
      <button onclick="deleteTodo(${todo.id})">🗑️</button>
    `;
    
    // Adiciona o elemento ao container
    todosContainer.appendChild(todoElement);
  });
}

// Função para adicionar nova tarefa
async function addTodo() {
  // Obtém e limpa o valor do input
  const title = newTodoInput.value.trim();
  
  // Valida se tem conteúdo
  if (!title) return;

  try {
    // Faz requisição POST para criar nova tarefa
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' // Define tipo de conteúdo
      },
      body: JSON.stringify({ title }) // Envia o título como JSON
    });

    // Se a resposta for OK (status 200-299)
    if (response.ok) {
      // Limpa o campo de input
      newTodoInput.value = '';
      // Recarrega a lista de tarefas
      loadTodos();
    }
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error);
  }
}

// Função para alternar status de conclusão
async function toggleComplete(id) {
  // Encontra o elemento da tarefa pelo ID
  const todoElement = document.querySelector(`.todo[data-id="${id}"]`);
  
  // Obtém o estado do checkbox (true/false)
  const completed = todoElement.querySelector('input[type="checkbox"]').checked;
  
  try {
    // Faz requisição PUT para atualizar o status
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ completed }) // Envia novo status
    });
    
    // Recarrega a lista
    loadTodos();
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
  }
}

// Função para editar uma tarefa
async function editTodo(id) {
  // Pede novo título ao usuário
  const newTitle = prompt('Editar tarefa:');
  
  // Se cancelar ou string vazia, retorna
  if (!newTitle) return;

  try {
    // Faz requisição PUT para atualizar o título
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ title: newTitle }) // Envia novo título
    });
    
    // Recarrega a lista
    loadTodos();
  } catch (error) {
    console.error("Erro ao editar tarefa:", error);
  }
}

// Função para excluir uma tarefa
async function deleteTodo(id) {
  // Confirma com o usuário antes de excluir
  if (!confirm('Tem certeza que deseja excluir?')) return;
  
  try {
    // Faz requisição DELETE
    await fetch(`${API_URL}/${id}`, { 
      method: 'DELETE' 
    });
    
    // Recarrega a lista
    loadTodos();
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
  }
}