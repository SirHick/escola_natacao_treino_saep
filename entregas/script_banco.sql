DROP DATABASE IF EXISTS saep_db;
CREATE DATABASE saep_db;
USE saep_db;

CREATE TABLE usuarios(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 login VARCHAR(50) NOT NULL UNIQUE,
 senha VARCHAR(64) NOT NULL
);
INSERT INTO usuarios(nome, login, senha) VALUES
('Administrador', 'admin', SHA2('123', 256)),
('Bruna Costa', 'bruna', SHA2('123', 256)),
('Diego Ramos', 'diego', SHA2('123', 256));

CREATE TABLE responsaveis(
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 cpf VARBINARY(255) NOT NULL UNIQUE,
 email VARCHAR(100) NOT NULL,
 telefone VARCHAR(20) NOT NULL
);
INSERT INTO responsaveis(nome, cpf, email, telefone) VALUES
('Helena Souza', AES_ENCRYPT('111.222.333-44', 'chave123'), 'helena@email.com', '(48) 99999-
0001'),
('Igor Martins', AES_ENCRYPT('222.333.444-55', 'chave123'), 'igor@email.com', '(48) 99999-
0002'),
('Joana Lima', AES_ENCRYPT('333.444.555-66', 'chave123'), 'joana@email.com', '(48) 99999-
0003');

CREATE TABLE filhos(
 id INT AUTO_INCREMENT PRIMARY KEY,
 responsavel_id INT NOT NULL,
 nome VARCHAR(100) NOT NULL,
 data_nascimento DATE NOT NULL,
 nivel_natacao ENUM('Iniciante','Intermediário','Avançado') NOT NULL,
 FOREIGN KEY(responsavel_id) REFERENCES responsaveis(id)
);
INSERT INTO filhos(responsavel_id, nome, data_nascimento, nivel_natacao) VALUES
(1, 'Cristian', '2020-01-03', 'Iniciante'),
(3, 'Pamela', '2019-11-04', 'Iniciante'),
(2, 'Lucas', '2016-10-05', 'Intermediário');

CREATE TABLE agendamentos(
 id INT AUTO_INCREMENT PRIMARY KEY,
 filho_id INT NOT NULL,
 professor VARCHAR(100) NOT NULL,
 data_aula DATE NOT NULL,
 horario TIME NOT NULL,
 FOREIGN KEY(filho_id) REFERENCES filhos(id)
);
INSERT INTO agendamentos(filho_id, professor, data_aula, horario) VALUES
(3, 'Prof. Rafael', '2026-11-12', '09:00:00'),
(1, 'Prof. Sabrina', '2026-11-10', '14:00:00'),
(2, 'Prof. Rafael', '2026-11-11', '10:30:00');