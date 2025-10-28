-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 01/10/2025 às 05:11
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `smart_point`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `admins`
--

INSERT INTO `admins` (`id`, `nome`, `cpf`, `email`, `senha_hash`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Administrador Padrão', '00000000000', 'admin@rfid.local', '$2b$12$KIXQ0e9zkd0hSsvO0d8hDOiBLW1y3DytvjzSZ7hGWjzP6nF1j4iGa', 1, '2025-09-30 23:10:40', '2025-09-30 23:10:40');

-- --------------------------------------------------------

--
-- Estrutura para tabela `colaboradores`
--

CREATE TABLE `colaboradores` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `colaboradores`
--

INSERT INTO `colaboradores` (`id`, `nome`, `cpf`, `email`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'João Silva', '11111111111', 'joao@empresa.com', 1, '2025-09-30 23:10:40', '2025-09-30 23:10:40'),
(2, 'Maria Oliveira', '22222222222', 'maria@empresa.com', 1, '2025-09-30 23:10:40', '2025-09-30 23:10:40'),
(3, 'Carlos Souza', '33333333333', 'carlos@empresa.com', 1, '2025-09-30 23:10:40', '2025-09-30 23:10:40');

-- --------------------------------------------------------

--
-- Estrutura para tabela `dispositivos`
--

CREATE TABLE `dispositivos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `identificador` varchar(100) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `dispositivos`
--

INSERT INTO `dispositivos` (`id`, `nome`, `identificador`, `descricao`, `criado_em`) VALUES
(1, 'Entrada Principal', 'esp32_entrada1', 'Leitor RFID na entrada principal da empresa', '2025-09-30 23:10:40');

-- --------------------------------------------------------

--
-- Estrutura para tabela `leituras`
--

CREATE TABLE `leituras` (
  `id` bigint(20) NOT NULL,
  `tag_uid` varchar(64) NOT NULL,
  `colaborador_id` int(11) DEFAULT NULL,
  `dispositivo_id` int(11) DEFAULT NULL,
  `autorizado` tinyint(1) DEFAULT 0,
  `hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `ip` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `leituras`
--

INSERT INTO `leituras` (`id`, `tag_uid`, `colaborador_id`, `dispositivo_id`, `autorizado`, `hora`, `raw_payload`, `ip`) VALUES
(1, '04A3B1C2D3', 1, 1, 1, '2025-09-30 23:10:40', NULL, '192.168.0.10'),
(2, '08765F9B23', 2, 1, 1, '2025-09-30 23:10:40', NULL, '192.168.0.11'),
(3, '9999999999', NULL, 1, 0, '2025-09-30 23:10:40', NULL, '192.168.0.12');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `uid` varchar(64) NOT NULL,
  `descricao` varchar(100) DEFAULT NULL,
  `colaborador_id` int(11) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tags`
--

INSERT INTO `tags` (`id`, `uid`, `descricao`, `colaborador_id`, `ativo`, `criado_em`) VALUES
(1, '04A3B1C2D3', 'Cartão João', 1, 1, '2025-09-30 23:10:40'),
(2, '08765F9B23', 'Cartão Maria', 2, 1, '2025-09-30 23:10:40'),
(3, '0A1B2C3D4E', 'Cartão Carlos', 3, 1, '2025-09-30 23:10:40');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `colaboradores`
--
ALTER TABLE `colaboradores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices de tabela `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificador` (`identificador`);

--
-- Índices de tabela `leituras`
--
ALTER TABLE `leituras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `colaborador_id` (`colaborador_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`),
  ADD KEY `tag_uid` (`tag_uid`),
  ADD KEY `hora` (`hora`);

--
-- Índices de tabela `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uid` (`uid`),
  ADD KEY `colaborador_id` (`colaborador_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `colaboradores`
--
ALTER TABLE `colaboradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `dispositivos`
--
ALTER TABLE `dispositivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `leituras`
--
ALTER TABLE `leituras`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `leituras`
--
ALTER TABLE `leituras`
  ADD CONSTRAINT `leituras_ibfk_1` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leituras_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `tags`
--
ALTER TABLE `tags`
  ADD CONSTRAINT `tags_ibfk_1` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

