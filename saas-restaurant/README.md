# Sam Frontend - Guia para o Backend

Este diretório contém o frontend da aplicação **Sam**, desenvolvido com **Next.js 16+** (App Router) e **Tailwind CSS**.

## 🛠️ Tecnologias Principais
# 🏷️ Sam - Sistema de Gestão e Impressão de Etiquetas

Sam é uma aplicação moderna de alto desempenho desenvolvida para facilitar a importação, gestão e impressão térmica de etiquetas de produtos. Com foco em produtividade e estética premium, o sistema oferece uma experiência fluida para operações logísticas e de produção.

## 🚀 Funcionalidades Implementadas

### 1. Gestão de Etiquetas & Importação Inteligente
- **Importação de Excel**: Suporte a arquivos `.xlsx` e `.xls` com mapeamento robusto de colunas.
- **Reconhecimento Inteligente**: Algoritmo que identifica colunas mesmo com erros de digitação (ex: "Poduto") ou variações de espaços e maiúsculas.
- **Filtros e Busca**: Sistema de busca instantânea por Produto, Lote, Fornecedor ou Empresa.
- **Interface Otimizada**: Listagem com paginação e scroll vertical com cabeçalhos fixos (sticky), garantindo alta performance com milhares de registros.

### 2. Terminal de Impressão
- **Conectividade USB**: Integração nativa com impressoras via **WebUSB API**, permitindo reconhecimento direto do hardware no navegador.
- **Preview Técnico Premium**: Visualização em tempo real que simula uma etiqueta térmica real, com foco total no **Nome do Produto** e **Data de Validade**.
- **Campos Completos**: Suporte a S.I.F, Lote, Fornecedor e Código de Barras dinâmico.

### 3. Controle de Estoque (Novo)
- **Importação de Estoque Inteligente**: O cliente pode importar arquivos Excel (`.xlsx`, `.xls`, `.csv`). O frontend processa os dados com `SheetJS`, localiza nomes de colunas variantes (como "qtd", "quantidade", "saldo") e normaliza tudo em tempo de execução para os estados React, poupando validações excessivas do backend.
- **Gestão Simplificada**: Interface limpa para adicionar e monitorar o inventário, com badges visuais reativos a baixos níveis de estoque. A API precisará apenas persistir o array validado de `EstoqueItem`.

### 3. Segurança e UI/UX
- **Autenticação**: Integrada via **Supabase**, com telas de Login e Sign-up personalizadas e seguras.
- **Design System**: Estética premium baseada em tons de Azul Vibrante (`#0066FF`) e Dark Navy (`#0F172A`).
- **Responsividade**: Layout otimizado para diferentes resoluções, com correções de overflow e scroll horizontal.

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS / Vanilla CSS
- **Autenticação**: [Supabase](https://supabase.com/)
- **Processamento de Dados**: [SheetJS (XLSX)](https://sheetjs.com/)
- **Icons**: Lucide React

## 📂 Estrutura do Projeto

- `/src/app/dashboard/etiquetas`: Gestão e listagem de etiquetas importadas.
- `/src/app/dashboard/estoque`: Gestão do inventário de produtos e suprimentos com importação autônoma de Excel.
- `/src/app/dashboard/print`: Terminal de conexão USB e preview de impressão.
- `/src/app/login`: Interface de autenticação customizada.

## 🚧 Próximos Passos
- Integração com API backend para persistência de lotes importados.
- Histórico de impressões realizadas.
- Configurações de modelos de etiquetas (tamanhos customizados).

---
*Desenvolvido com foco em excelência e performance por Antigravity.*
