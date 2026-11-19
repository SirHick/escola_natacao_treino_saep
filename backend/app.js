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

// RESPONSÁVEIS
server.get('/responsaveis', (req, res) => {
    const sql = 'SELECT id, nome, email, telefone FROM responsaveis ORDER BY nome';

    connection.query(sql, (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados);
    });
});

server.get('/responsaveis/busca/:termo', (req, res) => {
    const sql = 'SELECT id, nome, email, telefone FROM responsaveis WHERE nome LIKE ? ORDER BY nome';

    connection.query(sql, ['%' + req.params.termo + '%'], (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados);
    });
});

server.get('/responsaveis/:id', (req, res) => {
    const sql = `SELECT id, nome, CAST(AES_DECRYPT(cpf, ?) AS CHAR) AS cpf, email, telefone FROM responsaveis WHERE id = ?`;

    connection.query(sql, [CHAVE, req.params.id], (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados[0]);
    });
});

server.post('/responsaveis', (req, res) => {
    const { nome, cpf, email, telefone } = req.body;
    const sql = 'INSERT INTO responsaveis (nome, cpf, email, telefone) VALUES (?, AES_ENCRYPT(?,?), ?, ?)';

    connection.query(sql, [nome, cpf, CHAVE, email, telefone], (erro, resultado) => {
        if (erro) {
            if (erro.code == 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensagem: 'CPF já cadastrado.' });
            }
            return res.status(500).json({ mensagem: erro.message });
        }
        res.json({ mensagem: 'Responsável cadastrado com sucesso!', id: resultado.insertId });
    });
});

server.put('/responsaveis/:id', (req, res) => {
    const { nome, cpf, email, telefone } = req.body;
    const sql = `UPDATE responsaveis SET nome = ?, cpf = AES_ENCRYPT(?, ?), email = ?, telefone = ? WHERE id = ?`;

    connection.query(sql, [nome, cpf, CHAVE, email, telefone, req.params.id], (erro) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json({ mensagem: 'Responsável atualizado com sucesso.' });
    });
});

server.delete('/responsaveis/:id', (req, res) => {
    connection.query('DELETE FROM responsaveis WHERE id = ?', [req.params.id], (erro) => {
        if (erro) {
            if (erro.code == 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ mensagem: 'Responsável possui filhos cadastrados e não pode ser excluído.' });
            }
            return res.status(500).json({ mensagem: erro.message });
        }
        res.json({ mensagem: 'Responsável removido com sucesso.' });
    });
});

// FILHOS
server.get('/filhos', (req, res) => {
    const sql = `
        SELECT f.id, f.responsavel_id, r.nome AS responsavel_nome,
               f.nome, f.data_nascimento, f.nivel_natacao
        FROM filhos f
        INNER JOIN responsaveis r ON r.id = f.responsavel_id
        ORDER BY f.nome`;

    connection.query(sql, (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados);
    });
});

server.post('/filhos', (req, res) => {
    const { responsavel_id, nome, data_nascimento, nivel_natacao } = req.body;

    if (!responsavel_id) {
        return res.status(400).json({ mensagem: 'O filho deve ser associado a um responsável.' });
    }

    const sql = 'INSERT INTO filhos (responsavel_id, nome, data_nascimento, nivel_natacao) VALUES (?, ?, ?, ?)';

    connection.query(sql, [responsavel_id, nome, data_nascimento, nivel_natacao], (erro, resultado) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json({ mensagem: 'Filho cadastrado com sucesso!', id: resultado.insertId });
    });
});

// AGENDAMENTOS
server.get('/agendamentos', (req, res) => {
    const sql = `
        SELECT a.id, a.filho_id, a.professor, a.data_aula, a.horario,
               f.nome AS filho_nome, f.data_nascimento, f.nivel_natacao,
               r.nome AS responsavel_nome,
               CAST(AES_DECRYPT(r.cpf, ?) AS CHAR) AS responsavel_cpf,
               r.email AS responsavel_email,
               r.telefone AS responsavel_telefone
        FROM agendamentos a
        INNER JOIN filhos f ON f.id = a.filho_id
        INNER JOIN responsaveis r ON r.id = f.responsavel_id
        ORDER BY a.data_aula, a.horario`;

    connection.query(sql, [CHAVE], (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados);
    });
});

server.get('/agendamentos/:id', (req, res) => {
    connection.query('SELECT * FROM agendamentos WHERE id = ?', [req.params.id], (erro, resultados) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json(resultados[0]);
    });
});

server.put('/agendamentos/:id', (req, res) => {
    const { data_aula, horario } = req.body;
    const sql = 'UPDATE agendamentos SET data_aula = ?, horario = ? WHERE id = ?';

    connection.query(sql, [data_aula, horario, req.params.id], (erro) => {
        if (erro) return res.status(500).json({ mensagem: erro.message });
        res.json({ mensagem: 'Agendamento atualizado com sucesso.' });
    });
});

// SERVIDOR
const PORT = 3025;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});