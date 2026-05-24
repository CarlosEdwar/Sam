-- Arquivo SQL para criação das tabelas no Turso (SQLite)
-- Este arquivo contempla as necessidades do frontend para gerenciar o Estoque e as Etiquetas, 
-- além do relacionamento com o usuário autenticado via Clerk.

-- 1. Tabela de Usuários (Opcional, dependendo se você espelha os dados do Clerk)
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, -- ID gerado pelo Clerk (ex: user_2...)
        email TEXT UNIQUE,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Tabela de Controle de Estoque
    CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY, -- Pode ser um UUID ou CUID gerado pelo backend
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        category TEXT DEFAULT 'Geral',
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        status TEXT CHECK(status IN ('normal', 'low', 'out')) DEFAULT 'normal',
        user_id TEXT NOT NULL, -- Relacionamento com o dono/usuário (Clerk)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index para otimizar buscas no estoque
    CREATE INDEX IF NOT EXISTS idx_inventory_user_sku ON inventory(user_id, sku);
    CREATE INDEX IF NOT EXISTS idx_inventory_user_name ON inventory(user_id, name);

    -- 3. Tabela de Etiquetas (Importações e Gerenciamento)
    CREATE TABLE IF NOT EXISTS labels (
        id TEXT PRIMARY KEY, -- Pode ser gerado pelo backend ou enviado como 'IMP-...'
        codigo TEXT,
        produto TEXT NOT NULL,
        fornecedor TEXT,
        lote TEXT,
        data_manipulacao TEXT,
        validade_dias INTEGER DEFAULT 0,
        validade_horas INTEGER DEFAULT 0,
        armazenamento TEXT,
        descongelado_dias INTEGER DEFAULT 0,
        sif TEXT,
        rastreabilidade TEXT,
        empresa TEXT,
        observacao TEXT,
        status TEXT DEFAULT 'pendente', -- pendente, impressa, etc
        user_id TEXT NOT NULL, -- Relacionamento com o dono/usuário (Clerk)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index para otimizar buscas de etiquetas
    CREATE INDEX IF NOT EXISTS idx_labels_user_produto ON labels(user_id, produto);
    CREATE INDEX IF NOT EXISTS idx_labels_user_lote ON labels(user_id, lote);
    CREATE INDEX IF NOT EXISTS idx_labels_user_codigo ON labels(user_id, codigo);
