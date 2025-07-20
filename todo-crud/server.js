// server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Adicione esta linha
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));  // Serve arquivos estáticos

// Rota explícita para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Simulação de banco de dados (em memória)
let todos = [];
let idCounter = 1;

// Rota GET - Ler todos os TODOs
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Rota POST - Criar um novo TODO
app.post('/todos', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  const newTodo = {
    id: idCounter++,
    title,
    completed: false
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Rota PUT - Atualizar um TODO
app.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, completed } = req.body;

  const todo = todos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'TODO não encontrado.' });
  }

  if (title !== undefined) todo.title = title;
  if (completed !== undefined) todo.completed = completed;

  res.json(todo);
});

// Rota DELETE - Remover um TODO
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'TODO não encontrado.' });
  }

  todos.splice(index, 1);
  res.status(204).send();
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});