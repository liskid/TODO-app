const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'seu_segredo_super_secreto';

// Configuração do CORS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware de log para depuração
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Configuração do banco de dados
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    
    // Cria as tabelas se não existirem
    db.serialize(() => {
      // Cria a tabela de usuários primeiro
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) console.error('Erro ao criar tabela users:', err);
        });

      // Depois a tabela de tarefas
      db.run(`
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          user_id INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) console.error('Erro ao criar tabela todos:', err);
        });
    });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Registro de usuário
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  
  try {
    // Verifica se usuário já existe
    const userExists = await new Promise((resolve) => {
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        resolve(!!row);
      });
    });
    
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }
    
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insere novo usuário
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erro ao registrar usuário' });
        }
        
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Login de usuário
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  
  try {
    // Busca usuário
    const user = await new Promise((resolve) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        resolve(row);
      });
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    
    // Verifica senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    
    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Todas as rotas abaixo exigem autenticação
app.use(authenticateToken);

// GET /todos - Retorna tarefas do usuário autenticado
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar TODOs' });
    } else {
      const todos = rows.map(row => ({
        id: row.id,
        title: row.title,
        completed: Boolean(row.completed)
      }));
      res.json(todos);
    }
  });
});

// POST /todos - Cria nova tarefa para o usuário autenticado
app.post('/todos', (req, res) => {
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  db.run(
    'INSERT INTO todos (title, completed, user_id) VALUES (?, ?, ?)',
    [title, 0, req.user.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao inserir TODO' });
      }
      
      // Retorna o novo TODO inserido
      db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erro ao buscar novo TODO' });
        }
        res.status(201).json({
          id: row.id,
          title: row.title,
          completed: Boolean(row.completed)
        });
      });
    }
  );
});

// PUT /todos/:id - Atualiza tarefa
app.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, completed } = req.body;

  // Verifica se o TODO pertence ao usuário
  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar TODO' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'TODO não encontrado.' });
    }

    // Prepara valores para atualização
    const updateTitle = title !== undefined ? title : row.title;
    const updateCompleted = completed !== undefined ? (completed ? 1 : 0) : row.completed;

    db.run(
      'UPDATE todos SET title = ?, completed = ? WHERE id = ? AND user_id = ?',
      [updateTitle, updateCompleted, id, req.user.id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erro ao atualizar TODO' });
        }
        
        // Retorna o TODO atualizado
        db.get('SELECT * FROM todos WHERE id = ?', [id], (err, updatedRow) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao buscar TODO atualizado' });
          }
          res.json({
            id: updatedRow.id,
            title: updatedRow.title,
            completed: Boolean(updatedRow.completed)
          });
        });
      }
    );
  });
});

// DELETE /todos/:id - Remove tarefa
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.run(
    'DELETE FROM todos WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao excluir TODO' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'TODO não encontrado.' });
      }
      
      res.status(204).send();
    }
  );
});

// Fechar conexão ao encerrar o servidor
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});