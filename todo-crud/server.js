// Importa o framework Express para criar o servidor web
const express = require('express');

// Importa o módulo CORS para permitir requisições entre domínios diferentes
const cors = require('cors');

// Importa o módulo Path para trabalhar com caminhos de arquivos
const path = require('path');

// Cria uma instância do Express
const app = express();

// Define a porta onde o servidor irá rodar
const PORT = 3000;

// Habilita o CORS para todas as rotas
app.use(cors());

// Configura o Express para parsear requisições com corpo JSON
app.use(express.json());

// Serve arquivos estáticos (HTML, CSS, JS) do diretório atual
app.use(express.static(path.join(__dirname)));

// Rota GET para a página inicial - envia o arquivo HTML
app.get('/', (req, res) => {
  // Envia o arquivo index.html como resposta
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Banco de dados em memória (array para armazenar as tarefas)
let todos = [];

// Contador para gerar IDs únicos
let idCounter = 1;

// Rota GET /todos - Retorna todas as tarefas
app.get('/todos', (req, res) => {
  // Envia o array de todos como JSON
  res.json(todos);
});

// Rota POST /todos - Cria uma nova tarefa
app.post('/todos', (req, res) => {
  // Extrai o título do corpo da requisição
  const { title } = req.body;
  
  // Valida se o título foi fornecido
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  // Cria um novo objeto de tarefa
  const newTodo = {
    id: idCounter++, // Atribui um ID único
    title,          // Título da tarefa
    completed: false // Status inicial não concluído
  };

  // Adiciona a nova tarefa ao array
  todos.push(newTodo);
  
  // Retorna a nova tarefa com status 201 (Created)
  res.status(201).json(newTodo);
});

// Rota PUT /todos/:id - Atualiza uma tarefa existente
app.put('/todos/:id', (req, res) => {
  // Converte o ID da URL para número
  const id = parseInt(req.params.id);
  
  // Extrai título e status do corpo da requisição
  const { title, completed } = req.body;

  // Encontra a tarefa pelo ID
  const todo = todos.find(t => t.id === id);
  
  // Se não encontrar, retorna erro 404
  if (!todo) {
    return res.status(404).json({ error: 'TODO não encontrado.' });
  }

  // Atualiza o título se foi fornecido
  if (title !== undefined) todo.title = title;
  
  // Atualiza o status se foi fornecido
  if (completed !== undefined) todo.completed = completed;

  // Retorna a tarefa atualizada
  res.json(todo);
});

// Rota DELETE /todos/:id - Remove uma tarefa
app.delete('/todos/:id', (req, res) => {
  // Converte o ID da URL para número
  const id = parseInt(req.params.id);
  
  // Encontra o índice da tarefa no array
  const index = todos.findIndex(t => t.id === id);

  // Se não encontrar, retorna erro 404
  if (index === -1) {
    return res.status(404).json({ error: 'TODO não encontrado.' });
  }

  // Remove a tarefa do array
  todos.splice(index, 1);
  
  // Retorna status 204 (No Content) indicando sucesso sem conteúdo
  res.status(204).send();
});

// Inicia o servidor na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});