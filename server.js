const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Conectando ao MongoDB (substitua 'mongodb://localhost:27017/seu_banco_de_dados' pelo seu próprio URI do MongoDB)
mongoose.connect('mongodb://localhost:27017/seu_banco_de_dados', { useNewUrlParser: true, useUnifiedTopology: true });

// Definindo um modelo Mongoose para o usuário
const userSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
  telefones: [{ numero: String, ddd: String }],
  data_criacao: String,
  data_atualizacao: String,
  ultimo_login: String,
  token: String,
});

const User = mongoose.model('User', userSchema);

// Middleware para autenticação com JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ mensagem: 'Não autorizado' });

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ mensagem: 'Não autorizado' });

    req.user = user;
    next();
  });
};

// Endpoint para criar um novo usuário (Sign Up)
app.post('/signup', async (req, res) => {
  const { nome, email, senha, telefones } = req.body;

  if (!nome || !email || !senha || !telefones) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ mensagem: 'E-mail já existente.' });
    }

    const id = generateId();
    const dataCriacao = new Date().toISOString();
    const dataAtualizacao = dataCriacao;
    const ultimoLogin = dataCriacao;

    const newUser = new User({
      id,
      nome,
      email,
      senha: bcrypt.hashSync(senha, 10),
      telefones,
      data_criacao: dataCriacao,
      data_atualizacao: dataAtualizacao,
      ultimo_login: ultimoLogin,
      token: generateToken({ id, email }),
    });

    await newUser.save();

    return res.status(201).json(newUser.toObject());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
});

// Endpoint para autenticar o usuário (Sign In)
app.post('/signin', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos.' });
    }

    user.ultimo_login = new Date().toISOString();
    user.token = generateToken({ id: user.id, email: user.email });

    await user.save();

    return res.json(user.toObject());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
});

// Endpoint para buscar informações do usuário
app.get('/user', authenticateToken, (req, res) => {
  return res.json(req.user);
});

// Tratamento de endpoint não encontrado
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Endpoint não encontrado.' });
});

// Função para gerar um ID único
function generateId() {
  return require('crypto').randomBytes(8).toString('hex');
}

// Função para gerar um token JWT
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
