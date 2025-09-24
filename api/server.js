const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// Rota de autenticação (Login)
app.post('/login', async (req, res) => {
  const { senha } = req.body;

  if (!senha) {
    return res.status(400).json({ message: 'Senha é obrigatória.' });
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { senha: senha },
      include: { perfil: true },
    });

    if (usuario) {
      // Retorna o usuário (sem a senha) e o perfil
      const { senha, ...usuarioSemSenha } = usuario;
      res.status(200).json({ user: usuarioSemSenha, message: 'Login bem-sucedido.' });
    } else {
      res.status(401).json({ message: 'ERRO: Senha incorreta.' });
    }
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para listar equipamentos
app.get('/equipamentos', async (req, res) => {
  try {
    const equipamentos = await prisma.equipamento.findMany({
      orderBy: { criadoEm: 'desc' },
    });
    res.status(200).json(equipamentos);
  } catch (error) {
    console.error('Erro ao listar equipamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para cadastrar equipamento
app.post('/equipamentos', async (req, res) => {
  const { nome, imagem, descricao, ativo, perfilId } = req.body;

  if (perfilId !== 2) { // ID 2 para Administrador
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const novoEquipamento = await prisma.equipamento.create({
      data: {
        nome,
        imagem,
        descricao,
        ativo: ativo !== undefined ? ativo : true,
      },
    });
    res.status(201).json(novoEquipamento);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para excluir equipamento
app.delete('/equipamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { perfilId } = req.body;

  if (perfilId !== 2) { // ID 2 para Administrador
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    await prisma.equipamento.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Equipamento excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para listar comentários de um equipamento
app.get('/equipamentos/:equipamentoId/comentarios', async (req, res) => {
  const { equipamentoId } = req.params;

  try {
    const comentarios = await prisma.comentario.findMany({
      where: { equipamentoId: parseInt(equipamentoId) },
      include: { usuario: { include: { perfil: true } } },
      orderBy: { criadoEm: 'desc' },
    });
    res.status(200).json(comentarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para inserir um novo comentário
app.post('/equipamentos/:equipamentoId/comentarios', async (req, res) => {
  const { equipamentoId } = req.params;
  const { texto, usuarioId } = req.body;

  try {
    const novoComentario = await prisma.comentario.create({
      data: {
        texto,
        equipamentoId: parseInt(equipamentoId),
        usuarioId: parseInt(usuarioId),
      },
    });
    res.status(201).json(novoComentario);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

