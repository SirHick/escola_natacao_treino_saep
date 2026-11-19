const express = require('express');
const cors = require('cors');
const connection = require('./db');
const server = express();

server.use(cors());
server.use(express.json());

const CHAVE = 'chave123'; // a mesma usada no AES_ENCRYPT do script SQL

// LOGIN
server.post('/login', (req, res) => {
const { login, senha } = req.body;
const sql = 'SELECT id, login FROM usuarios WHERE login = ? AND senha = SHA2(?,256)';

connection.query(sql, [login, senha], (erro, resultados) => {
if (erro) return res.status(500).json({ sucesso: false, mensagem: erro.message });
if (resultados.length == 0) {
return res.json({ sucesso: false, mensagem: 'Login ou senha inválidos.' });
}
res.json({ sucesso: true, usuario: resultados[0] });

 });
});

server.get('/clientes', (req, res) => {
    const sql = 'SELECT id, nome, email, telefone FROM clientes ORDER BY nome';

    connection.query(sql, (erro, resultado) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
    });
});

server.get('/clientes/busca/:termo', (req, res) => {
    const sql = 'SELECT id, nome, email, telefone FROM clientes WHERE nome LIKE ? ORDER BY nome';
    
    connection.query(sql, ['%' + req.params.termo + '%'], (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados);
 });
});

server.get('/clientes/:id', (req, res) => {
 const sql = `SELECT id, nome, CAST(AES_DECRYPT(cpf, ?) AS CHAR) AS cpf, email, telefone FROM clientes WHERE id = ?`;

 connection.query(sql, [CHAVE, req.params.id], (erro, resultados) => {
    if (erro) return res.status(500).json({ mensagem: erro.message });
    res.json(resultados[0]);
 });
});

server.post('/clientes', (req, res) => {
    const { nome, cpf, email, telefone } = req.body;

    const sql = 'INSERT INTO clientes (nome, cpf, email, telefone) VALUES (?, AES_ENCRYPT(?,?), ?, ?)';
 
    connection.query(sql, [nome, cpf, CHAVE, email, telefone], (erro, resultado) => {
        if (erro) {
            if (erro.code == 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensagem: 'CPF já cadastrado.' });
            }
            return res.status(500).json({ mensagem: erro.message });
        }
        res.json({ mensagem: 'Cliente cadastrado com sucesso!', id: resultado.insertId });
    });
});

server.put('/clientes/:id', (req, res) => {
const { nome, cpf, email, telefone } = req.body;

const sql = `UPDATE clientes SET nome = ?, cpf = AES_ENCRYPT(?, ?), email = ?, telefone = ? WHERE id = ?`;

    connection.query(sql, [nome, cpf, CHAVE, email, telefone, req.params.id], (erro) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json({ mensagem: 'Cliente atualizado com sucesso.' });
    });
});


// SERVIDOR
const PORT = 3025;
server.listen(PORT, () => {
 console.log(`Servidor rodando na porta: ${PORT}`);
});
