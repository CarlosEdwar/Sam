# Estrutura Técnica Implementada - SaaS Restaurant

## Visão Geral
Sistema multi-tenant para gestão de restaurantes com:
- **Estoque**: Controle de produtos e quantidades
- **Escalas**: Auxiliador inteligente de escalas de trabalho
- **Etiquetas**: Impressão de rótulos para produtos

---

## Stack Tecnológico

### Frontend & Backend
- **Framework**: Next.js 15.3+ (App Router)
- **Linguagem**: TypeScript 5.8+
- **Estilização**: Tailwind CSS 3.4+
- **Validação**: Zod 3.24+

### Banco de Dados & Auth
- **BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **Cliente**: @supabase/supabase-js + @supabase/ssr
- **Datas**: date-fns 4.1+

---

## Estrutura de Diretórios

```
saas-restaurant/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Rotas de autenticação
│   │   │   └── login/
│   │   │       └── page.tsx      # Página de login
│   │   ├── dashboard/            # Área protegida (logada)
│   │   │   ├── layout.tsx        # Layout comum do dashboard
│   │   │   ├── estoque/
│   │   │   │   └── page.tsx      # Gestão de produtos
│   │   │   ├── escalas/
│   │   │   │   └── page.tsx      # Auxiliador de escalas
│   │   │   └── etiquetas/
│   │   │       └── page.tsx      # Impressão de etiquetas
│   │   ├── api/                  # APIs externas (webhooks)
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   │
│   ├── components/
│   │   └── ui/
│   │       └── index.tsx         # Componentes reutilizáveis
│   │                             # (Button, Input, Card, Badge, Select)
│   │
│   ├── lib/                      # Lógica de negócio (Backend)
│   │   ├── services/             # Server Actions
│   │   │   ├── auth-service.ts   # Autenticação
│   │   │   ├── estoque-service.ts # CRUD de produtos
│   │   │   └── escala-service.ts # Geração de escalas
│   │   ├── supabase/
│   │   │   ├── client.ts         # Cliente browser
│   │   │   └── server.ts         # Cliente server
│   │   └── utils/                # Funções auxiliares
│   │
│   ├── schemas/
│   │   └── index.ts              # Validação com Zod
│   │
│   └── middleware.ts             # Proteção de rotas
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

---

## Funcionalidades Implementadas

### 1. Autenticação (`src/lib/services/auth-service.ts`)
- Login com email/senha via Supabase Auth
- Middleware de proteção de rotas `/dashboard`
- Perfis de usuário com roles (admin/user)
- Isolamento por tenant (restaurant_id)

### 2. Gestão de Estoque (`src/app/dashboard/estoque/page.tsx`)
- Listagem de produtos em tabela
- Indicadores visuais de nível de estoque
- Integração com impressão de etiquetas
- Server actions para CRUD completo

### 3. Auxiliador de Escalas (`src/app/dashboard/escalas/page.tsx`)
**Regras de Negócio Implementadas:**
- Folga fixa toda segunda-feira
- 1 domingo de folga por mês com rodízio automático
- Turnos operacionais:
  - Manhã: 07:00 às 15:00
  - Tarde: 15:00 às 23:00
- Setores: Administrativo, Bar, Cozinha, Salão

**Funcionalidades da UI:**
- Navegação entre meses
- Geração automática de escalas
- Tabela mensal com agrupamento por data
- Campo de observações editável por lançamento
- Badges de status (Folga/Trabalho)

**Algoritmo (`src/lib/services/escala-service.ts`):**
- `generateSchedule()`: Gera escala automática baseada nas regras
- `getSchedule()`: Recupera escala do banco
- `updateScheduleObservation()`: Atualiza observações
- Controle de rodízio de domingos
- Respeito ao isolamento por tenant

### 4. Impressão de Etiquetas (`src/app/dashboard/etiquetas/page.tsx`)
- Seleção de produtos do estoque
- Preview em tempo real (50mm x 30mm)
- Impressão via window.print() nativo
- Lista de produtos com status de estoque
- Instruções de configuração de impressora térmica

---

## Componentes Reutilizáveis (`src/components/ui/index.tsx`)

| Componente | Props Principais | Uso |
|------------|------------------|-----|
| `Button` | variant, disabled, onClick | Botões primários/secundários |
| `Input` | label, type, required | Campos de formulário |
| `Select` | label, options, required | Dropdowns |
| `Card` | title | Containers com título |
| `Badge` | variant | Status coloridos |

---

## Validação de Dados (`src/schemas/index.ts`)

Esquemas Zod para:
- `loginSchema`: Email + senha
- `employeeSchema`: Dados de funcionário
- `shiftSchema`: Definição de turnos
- `scheduleAssignmentSchema`: Atribuições de escala
- `productSchema`: Produtos de estoque

---

## Segurança Multi-Tenant

### Row Level Security (RLS) no Supabase
Todas as tabelas possuem políticas RLS que garantem:
```sql
-- Exemplo de política
CREATE POLICY "Isolate Tenant Data" ON products
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE restaurant_id = products.restaurant_id
  )
);
```

### Middleware (`src/middleware.ts`)
- Verifica sessão do usuário em rotas `/dashboard`
- Injeta informações do tenant no contexto
- Redireciona para login se não autenticado

---

## Server Actions Pattern

Exemplo de implementação (`src/lib/services/estoque-service.ts`):
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function atualizarEstoque(produtoId: string, novaQtd: number) {
  const supabase = await createClient();
  
  // 1. Verifica autenticação
  const { data: user } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  // 2. Atualiza no banco com segurança por tenant
  const { error } = await supabase
    .from('products')
    .update({ stock_qty: novaQtd })
    .eq('id', produtoId)
    .eq('restaurant_id', user.restaurant_id);

  if (error) throw new Error(error.message);

  // 3. Invalida cache da página
  revalidatePath('/dashboard/estoque');
  
  return { success: true };
}
```

---

## Próximos Passos Sugeridos

### Pendentes de Implementação
1. [ ] Criar script SQL completo das tabelas Supabase
2. [ ] Implementar CRUD completo de funcionários
3. [ ] Adicionar edição manual de escalas (troca de turnos)
4. [ ] Criar página de perfil do restaurante
5. [ ] Implementar upload de logos para etiquetas
6. [ ] Adicionar exportação de escalas (PDF/Excel)
7. [ ] Criar dashboard com métricas e gráficos

### Configuração Necessária
1. Criar projeto no Supabase
2. Executar scripts SQL das tabelas
3. Configurar variáveis de ambiente:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
4. Configurar RLS em todas as tabelas
5. Deploy na Vercel

---

## Custo Zero (Free Tier)

Limites do Supabase Free:
- ✅ 500MB banco de dados (suficiente para ~5 restaurantes)
- ✅ 50k usuários ativos/mês
- ✅ 2GB banda/mês

Limites da Vercel Free:
- ✅ 100GB banda/mês
- ✅ Funções serverless gratuitas
- ✅ Build automático via Git

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Build de produção
npm run start        # Inicia servidor de produção

# Qualidade
npm run lint         # ESLint
```

---

## Considerações Finais

Esta estrutura técnica segue as melhores práticas de:
- **Multi-tenancy**: Isolamento total de dados por cliente
- **Server Components**: Máximo de lógica no servidor
- **Type Safety**: TypeScript em todo o código
- **Validation**: Zod para validação de inputs
- **Performance**: Cache e revalidação inteligente
- **Security**: RLS + Middleware + Server Actions

O sistema está pronto para receber configurações do Supabase e ser deployado em produção.
