# Guia de Migração para Supabase

## Resumo das Alterações

Este projeto foi migrado do Clerk + Laravel para **Supabase Auth + Next.js Server Actions**.

### ✅ O que já foi feito:

1. **Middleware atualizado** (`src/middleware.ts`)
   - Removeu dependência do Clerk
   - Implementado com `@supabase/ssr`
   - Protege rotas `/dashboard`
   - Redireciona usuários logados away de páginas de login

2. **Página de Login** (`src/app/login/[[...login]]/page.tsx`)
   - Formulário customizado com email/senha
   - Integração com `auth-service.ts`
   - Design consistente com o projeto

3. **Serviços de Autenticação** (`src/lib/services/auth-service.ts`)
   - `login()`: Autentica usuário com email/senha
   - `logout()`: Encerra sessão
   - `getCurrentUser()`: Retorna usuário e perfil

4. **Serviços de Negócio**
   - `estoque-service.ts`: CRUD de produtos com isolamento por restaurante
   - `escala-service.ts`: Geração automática de escalas
   - Todos usam Server Actions (`'use server'`)

5. **Configuração do Supabase**
   - `src/lib/supabase/client.ts`: Cliente browser
   - `src/lib/supabase/server.ts`: Cliente server (cookies)

---

## 📋 Próximos Passos (Obrigatórios)

### 1. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute o arquivo `supabase-schema.sql`
3. Copie as credenciais:
   - `Settings` > `API` > `Project URL`
   - `Settings` > `API` > `anon public key`

### 2. Criar arquivo `.env.local`

```bash
cd saas-restaurant
cp .env.local.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-anon
```

### 3. Instalar dependências (se necessário)

```bash
npm install @supabase/supabase-js @supabase/ssr date-fns zod
```

### 4. Criar primeiro usuário

1. Vá para **Authentication** > **Users** no Supabase
2. Clique em **Add user** > **Create new user**
3. Preencha email e senha
4. Após criar, vá na tabela `profiles` e adicione uma entrada:
   ```sql
   INSERT INTO profiles (id, name, role, restaurant_id)
   VALUES ('UUID-DO-USUARIO-CRIADO', 'Admin', 'admin', 'uuid-do-restaurante');
   ```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000/login` e faça login.

---

## 🔒 Row Level Security (RLS)

Todas as tabelas possuem RLS ativado. As políticas garantem que:
- Cada restaurante vê apenas seus próprios dados
- Usuários só acessam dados do seu `restaurant_id`
- Admins podem ver todos os perfis do seu restaurante

---

## 🧪 Testes Recomendados

1. **Teste de isolamento**: Crie 2 usuários com `restaurant_id` diferentes e verifique que um não vê dados do outro
2. **Teste de autenticação**: Tente acessar `/dashboard` sem estar logado (deve redirecionar para `/login`)
3. **Teste de Server Actions**: Modifique estoque e verifique se a atualização é refletida imediatamente

---

## 📦 Dependências Adicionais

As seguintes foram adicionadas:
- `@supabase/supabase-js` - Cliente Supabase
- `@supabase/ssr` - Utilitários SSR para Next.js
- `date-fns` - Manipulação de datas (usada em escalas)
- `zod` - Validação de schemas (já existente)

---

## ⚠️ Remoção do Clerk

Para limpar completamente o Clerk:

```bash
npm uninstall @clerk/nextjs @clerk/localizations
```

E remova referências restantes em:
- `src/app/sign-up/` (se não for mais usado)
- Qualquer import de `@clerk/*`

---

## 📄 Estrutura Atualizada

```
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   │   ├── estoque/
│   │   ├── escalas/
│   │   └── etiquetas/
│   └── login/
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── services/
│   │   ├── auth-service.ts
│   │   ├── estoque-service.ts
│   │   └── escala-service.ts
│   └── utils/
├── schemas/
│   └── index.ts
└── middleware.ts
```
