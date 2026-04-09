# Voxis — Guia de Implementação para o Claude Code

> **Leia este documento inteiro antes de escrever qualquer linha de código.**
> Ele contém todas as decisões de produto, arquitetura e implementação já tomadas.
> Não invente escopo, não questione decisões marcadas como ✅ FECHADO.

---

## 1. O que é o Voxis

**Voxis** ("A voz do cliente na agência") é um sistema web open source para coleta e gestão
de NPS de gerentes de relacionamento (GR) em agências bancárias via QR Code.

**Premissas inegociáveis:**
- O cliente que avalia é 100% anônimo — nenhum dado identificável é coletado
- O GR avaliado **nunca** tem acesso ao sistema — não é usuário, não vê seus dados
- O QR Code é fixo por GR — o GR não controla quando existe ou não (antiviés de seleção)
- Mobile-first — o cliente avalia pelo celular, a UI deve funcionar perfeitamente em 375px
- Open source — cada banco instala sua própria instância; identidade visual configurável

---

## 2. Stack Técnica ✅ FECHADO

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de dados + Auth | Supabase (PostgreSQL + Supabase Auth) |
| CSS | Tailwind CSS + CSS variables para temas |
| QR Code | biblioteca `qrcode` (npm) |
| Device Fingerprint | `@fingerprintjs/fingerprintjs` (open source) |
| Linguagem | TypeScript (strict mode) |

**Não usar:** nenhum ORM (queries diretas via Supabase client). Não usar Redux ou Zustand
no MVP — React state + Server Components resolvem.

---

## 3. Setup Inicial

### 3.1 Criar o projeto

```bash
npx create-next-app@latest voxis \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd voxis
```

### 3.2 Instalar dependências

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install qrcode
npm install @fingerprintjs/fingerprintjs
npm install @types/qrcode --save-dev
```

### 3.3 Variáveis de ambiente

Criar `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4 Clientes Supabase

**`src/lib/supabase/client.ts`** (uso em Client Components):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** (uso em Server Components e API Routes):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

---

## 4. Migration SQL — Rodar no Supabase

Rodar no **SQL Editor do Supabase**, nesta ordem exata:

```sql
-- =============================================
-- VOXIS — Schema inicial v1.0
-- =============================================

-- 1. Banco (instância)
CREATE TABLE instancia_banco (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  ativo       BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- 2. Configuração de tema
CREATE TABLE configuracao_tema (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id         UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  cor_primaria     TEXT NOT NULL DEFAULT '#2563EB',
  cor_secundaria   TEXT NOT NULL DEFAULT '#64748B',
  logo_url         TEXT,
  nome_exibicao    TEXT NOT NULL,
  preset_banco     TEXT,
  atualizado_em    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(banco_id)
);

-- 3. Superintendência (opcional por banco)
CREATE TABLE superintendencia (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id  UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  codigo    TEXT,
  ativo     BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Agência
CREATE TABLE agencia (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id            UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  superintendencia_id UUID REFERENCES superintendencia(id),
  nome                TEXT NOT NULL,
  codigo              TEXT NOT NULL,
  municipio           TEXT,
  uf                  CHAR(2),
  ativo               BOOLEAN DEFAULT true,
  criado_em           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(banco_id, codigo)
);

-- 5. Gerente de Relacionamento
CREATE TABLE gerente_relacionamento (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id     UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  agencia_id   UUID NOT NULL REFERENCES agencia(id),
  nome         TEXT NOT NULL,
  matricula    TEXT,
  qr_token     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ativo        BOOLEAN DEFAULT true,
  ativo_desde  TIMESTAMPTZ DEFAULT now(),
  criado_em    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gr_agencia ON gerente_relacionamento(agencia_id);
CREATE INDEX idx_gr_token   ON gerente_relacionamento(qr_token);
CREATE INDEX idx_gr_banco   ON gerente_relacionamento(banco_id);

-- 6. Histórico de vínculos GR ↔ Agência (para transferências)
CREATE TABLE historico_vinculo_gr (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id      UUID NOT NULL REFERENCES gerente_relacionamento(id) ON DELETE CASCADE,
  agencia_id UUID NOT NULL REFERENCES agencia(id),
  inicio_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em     TIMESTAMPTZ,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vinculo_gr      ON historico_vinculo_gr(gr_id);
CREATE INDEX idx_vinculo_agencia ON historico_vinculo_gr(agencia_id);

-- 7. Opções de motivo (configurável por banco, máx. 4 ativas)
CREATE TABLE opcao_motivo (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  texto    TEXT NOT NULL,
  ordem    INT NOT NULL DEFAULT 0,
  ativo    BOOLEAN DEFAULT true
);

-- 8. Avaliação (coração do sistema)
CREATE TABLE avaliacao (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id             UUID NOT NULL REFERENCES gerente_relacionamento(id),
  agencia_id        UUID NOT NULL REFERENCES agencia(id),
  banco_id          UUID NOT NULL REFERENCES instancia_banco(id),
  nota              SMALLINT NOT NULL CHECK (nota BETWEEN 0 AND 10),
  dispositivo_hash  TEXT NOT NULL,
  ip_hash           TEXT,
  user_agent_hash   TEXT,
  status            TEXT NOT NULL DEFAULT 'VALIDA'
                      CHECK (status IN ('VALIDA', 'QUARENTENA', 'REJEITADA')),
  motivo_quarentena TEXT,
  respondido_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_av_gr          ON avaliacao(gr_id);
CREATE INDEX idx_av_respondido  ON avaliacao(respondido_em);
CREATE INDEX idx_av_status      ON avaliacao(status);
CREATE INDEX idx_av_hash        ON avaliacao(dispositivo_hash, gr_id);
CREATE INDEX idx_av_banco       ON avaliacao(banco_id);

-- 9. Motivos por avaliação
CREATE TABLE avaliacao_motivo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id    UUID NOT NULL REFERENCES avaliacao(id) ON DELETE CASCADE,
  opcao_motivo_id UUID REFERENCES opcao_motivo(id),
  texto_outro     TEXT
);

-- 10. Log de anomalias (antifraude)
CREATE TABLE anomalia_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id       UUID NOT NULL REFERENCES instancia_banco(id),
  gr_id          UUID REFERENCES gerente_relacionamento(id),
  agencia_id     UUID REFERENCES agencia(id),
  tipo_anomalia  TEXT NOT NULL,
  descricao      TEXT,
  resolvido      BOOLEAN DEFAULT false,
  resolvido_por  UUID,
  resolvido_em   TIMESTAMPTZ,
  detectado_em   TIMESTAMPTZ DEFAULT now()
);

-- 11. Usuário interno (admin, direção, gestor)
CREATE TABLE usuario (
  id         UUID PRIMARY KEY,  -- mesmo UUID do Supabase Auth
  banco_id   UUID NOT NULL REFERENCES instancia_banco(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  perfil     TEXT NOT NULL CHECK (perfil IN ('ADMIN', 'DIRECAO', 'GESTOR_AGENCIA')),
  agencia_id UUID REFERENCES agencia(id),  -- só para GESTOR_AGENCIA
  ativo      BOOLEAN DEFAULT true,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SEED: instância demo + tema neutro
-- =============================================

INSERT INTO instancia_banco (id, nome, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Banco Demo', 'demo');

INSERT INTO configuracao_tema (banco_id, cor_primaria, cor_secundaria, nome_exibicao)
VALUES ('00000000-0000-0000-0000-000000000001', '#2563EB', '#64748B', 'Voxis Demo');

-- Opções de motivo padrão
INSERT INTO opcao_motivo (banco_id, texto, ordem) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tempo de espera', 1),
  ('00000000-0000-0000-0000-000000000001', 'Clareza nas explicações', 2),
  ('00000000-0000-0000-0000-000000000001', 'Solução do problema', 3),
  ('00000000-0000-0000-0000-000000000001', 'Cordialidade', 4);
```

---

## 5. Estrutura de Pastas (criar antes de implementar)

```
src/
├── app/
│   ├── (public)/
│   │   └── avaliar/
│   │       └── [token]/
│   │           └── page.tsx
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── admin/
│       │   ├── usuarios/page.tsx
│       │   ├── agencias/page.tsx
│       │   ├── gerentes/page.tsx
│       │   ├── motivos/page.tsx
│       │   └── tema/page.tsx
│       ├── direcao/
│       │   ├── page.tsx
│       │   └── agencia/[id]/page.tsx
│       └── agencia/
│           ├── page.tsx
│           └── anomalias/page.tsx
├── components/
│   ├── avaliacao/
│   │   ├── EscalaNPS.tsx
│   │   ├── SelecaoMotivo.tsx
│   │   └── Agradecimento.tsx
│   ├── dashboard/
│   │   ├── CardNPS.tsx
│   │   ├── RankingGRs.tsx
│   │   ├── GraficoDistribuicao.tsx
│   │   ├── GraficoEvolucao.tsx
│   │   └── AlertaAnomalia.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── nps.ts
│   ├── antifraude.ts
│   └── tema.ts
├── middleware.ts
└── types/
    └── database.ts
```

---

## 6. Middleware de Autenticação e Perfis

**`src/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — sem verificação
  if (pathname.startsWith('/avaliar') || pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Verificar sessão
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Buscar perfil do usuário
  const { data: usuario } = await supabase
    .from('usuario')
    .select('perfil, agencia_id')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteção por perfil
  if (pathname.startsWith('/admin') && usuario.perfil !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/direcao') &&
      !['ADMIN', 'DIRECAO'].includes(usuario.perfil)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 7. Sistema de Temas Dinâmicos

**`src/styles/globals.css`** — adicionar após as diretivas do Tailwind:
```css
:root {
  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-secondary: #64748B;
}
```

**`src/lib/tema.ts`**
```typescript
export const PRESETS_BANCO = {
  bnb:   { cor_primaria: '#006B3F', cor_secundaria: '#FFC107' },
  bb:    { cor_primaria: '#FFCC00', cor_secundaria: '#003DA5' },
  basa:  { cor_primaria: '#004A9C', cor_secundaria: '#F5A623' },
  caixa: { cor_primaria: '#005CA9', cor_secundaria: '#F26522' },
}

export function aplicarTema(corPrimaria: string, corSecundaria: string) {
  document.documentElement.style.setProperty('--color-primary', corPrimaria)
  document.documentElement.style.setProperty('--color-secondary', corSecundaria)
  // Gerar variante dark da primária (escurecer 15%)
  document.documentElement.style.setProperty('--color-primary-dark',
    escurecerCor(corPrimaria, 15))
}

function escurecerCor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
```

---

## 8. Lógica de Antifraude

**`src/lib/antifraude.ts`**
```typescript
import { SupabaseClient } from '@supabase/supabase-js'

// Bloqueia: mesmo device + mesmo GR nas últimas 24h
export async function verificarRateLimit(
  supabase: SupabaseClient,
  grId: string,
  deviceHash: string
): Promise<{ permitido: boolean }> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('avaliacao')
    .select('*', { count: 'exact', head: true })
    .eq('gr_id', grId)
    .eq('dispositivo_hash', deviceHash)
    .gte('respondido_em', desde)

  return { permitido: (count ?? 0) === 0 }
}

// Detecta rajada: 5+ respostas ao mesmo GR nos últimos 10 min
export async function detectarRajada(
  supabase: SupabaseClient,
  grId: string
): Promise<boolean> {
  const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('avaliacao')
    .select('*', { count: 'exact', head: true })
    .eq('gr_id', grId)
    .gte('respondido_em', desde)

  return (count ?? 0) >= 5
}
```

---

## 9. Cálculo de NPS

**`src/lib/nps.ts`**
```typescript
export type ResultadoNPS = {
  nps: number | null       // null = dados insuficientes (< 5 respostas)
  total: number
  promotores: number
  neutros: number
  detratores: number
  classificacao: 'EXCELENTE' | 'BOM' | 'NEUTRO' | 'CRITICO' | 'INSUFICIENTE'
}

export function calcularNPS(notas: number[]): ResultadoNPS {
  const total = notas.length
  if (total < 5) {
    return { nps: null, total, promotores: 0, neutros: 0,
             detratores: 0, classificacao: 'INSUFICIENTE' }
  }

  const promotores  = notas.filter(n => n >= 9).length
  const detratores  = notas.filter(n => n <= 6).length
  const neutros     = total - promotores - detratores
  const nps = Math.round((promotores / total * 100) - (detratores / total * 100))

  const classificacao =
    nps >= 75 ? 'EXCELENTE' :
    nps >= 50 ? 'BOM' :
    nps >= 0  ? 'NEUTRO' : 'CRITICO'

  return { nps, total, promotores, neutros, detratores, classificacao }
}

export const COR_CLASSIFICACAO = {
  EXCELENTE:   'text-green-600',
  BOM:         'text-blue-600',
  NEUTRO:      'text-yellow-600',
  CRITICO:     'text-red-600',
  INSUFICIENTE:'text-gray-400',
}
```

---

## 10. API Routes Obrigatórias

### POST `/api/avaliar/check`
Verifica se o device pode avaliar este GR (rate limit).
```typescript
// Body: { gr_id: string, device_hash: string }
// Response: { permitido: boolean }
```

### POST `/api/avaliar/submit`
Salva a avaliação com lógica de antifraude.
```typescript
// Body:
{
  gr_id: string
  nota: number              // 0-10
  device_hash: string
  motivos?: string[]        // IDs de opcao_motivo
  motivo_outro?: string
}
// Lógica:
// 1. Verificar rate limit → 429 se bloqueado
// 2. Detectar rajada → status = 'QUARENTENA' se verdadeiro
// 3. Inserir avaliacao
// 4. Inserir avaliacao_motivo (se motivos fornecidos)
// 5. Criar anomalia_log (se rajada detectada)
// Response: { success: true }
```

### POST `/api/admin/gr/transferir`
Transfere GR para nova agência.
```typescript
// Body: { gr_id: string, nova_agencia_id: string }
// Lógica:
// 1. Fechar historico_vinculo_gr atual (fim_em = now())
// 2. Criar novo historico_vinculo_gr
// 3. Atualizar gerente_relacionamento.agencia_id e ativo_desde
// QR TOKEN NÃO MUDA — é a identidade permanente do GR
```

---

## 11. Fluxo de Avaliação — Página Pública

**`src/app/(public)/avaliar/[token]/page.tsx`**

Sequência de estados da página:
```
'carregando'  → busca GR pelo token
'bloqueado'   → device já avaliou nas últimas 24h
'invalido'    → GR não encontrado ou inativo
'nota'        → Tela 1: escala 0-10
'motivo'      → Tela 2: múltipla escolha (só se nota ≤ 8)
'enviando'    → loading após submit
'concluido'   → Tela 3: agradecimento (volta para 'nota' após 5s)
'erro'        → falha no envio
```

**Regra crítica:** o fingerprint é calculado client-side antes de exibir o formulário.
Usar `useEffect` + `FingerprintJS.load()` assim que a página monta.

---

## 12. UX — Regras de Interface

### Tela de Avaliação (mobile-first, 375px)
- Botões da escala 0-10: mínimo 44x44px (touch target)
- Cores da escala: 0-6 vermelho (#EF4444), 7-8 amarelo (#F59E0B), 9-10 verde (#10B981)
- Nome do GR em destaque (font-semibold, tamanho grande)
- Cor primária da instância aplicada via CSS variables

### Dashboards
- CardNPS: número grande centralizado, classificação colorida abaixo, delta vs. período anterior
- RankingGRs: tabela com nome, NPS, total de respostas, delta, ícone de alerta se anomalia
- NPS null (< 5 respostas): exibir "—" cinza com tooltip "Dados insuficientes (mín. 5 respostas)"

### Geral
- Loading states em todos os fetches
- Mensagens de erro amigáveis (sem stack traces para o usuário)
- Responsivo: dashboards funcionam em tablet (768px+), mobile não é prioritário para dashboards

---

## 13. Fases de Implementação e Critérios de Aceite

### Fase 1 — Fundação
- [ ] Projeto Next.js criado com TypeScript + Tailwind
- [ ] Supabase configurado (URL + keys no .env.local)
- [ ] Migration SQL rodada com sucesso
- [ ] Clientes Supabase (client.ts + server.ts) funcionando
- [ ] Middleware de autenticação protegendo rotas

### Fase 2 — Fluxo do Cliente *(prioridade máxima)*
- [ ] `/avaliar/[token]` carrega dados do GR pelo token
- [ ] Fingerprint calculado client-side antes do formulário
- [ ] Rate limit bloqueia mesmo device em 24h para mesmo GR
- [ ] Escala 0-10 funciona em celular (touch targets corretos)
- [ ] Tela de motivos aparece apenas para notas ≤ 8
- [ ] Submit salva avaliação com status correto
- [ ] Rajada de 5+ respostas em 10min → status QUARENTENA + anomalia_log
- [ ] Tela de agradecimento exibida após envio
- [ ] Tema (cores) aplicado dinamicamente via CSS variables

### Fase 3 — Admin
- [ ] Login com email/senha via Supabase Auth
- [ ] CRUD de agências (com vínculo opcional a superintendência)
- [ ] CRUD de gerentes com geração de QR Code (exibível em tela + botão download PNG)
- [ ] Transferência de GR entre agências (com registro em historico_vinculo_gr)
- [ ] CRUD de opções de motivo (máx. 4 ativas por banco)
- [ ] Configuração de tema: cores + logo + preset de banco

### Fase 4 — Dashboards
- [ ] Dashboard do Gestor: NPS agência, ranking GRs, distribuição, motivos
- [ ] Dashboard da Direção: ranking agências, comparativo regional, evolução temporal
- [ ] Drill down: direção → agência → GRs
- [ ] Painel de anomalias com ações (aprovar/rejeitar quarentena)
- [ ] NPS exibe "—" quando < 5 respostas válidas

### Fase 5 — Seed e refinamentos
- [ ] Dados de demonstração carregados (2 agências, 5 GRs, 50 avaliações variadas)
- [ ] Presets de tema aplicáveis no painel admin
- [ ] Testes manuais do fluxo completo em celular real

---

## 14. O que NÃO implementar no MVP

Estas funcionalidades foram explicitamente adiadas para v2:
- ❌ Exportação PDF ou Excel
- ❌ Envio de link por WhatsApp/SMS
- ❌ SSO / Active Directory / LDAP
- ❌ App mobile nativo
- ❌ Metas de NPS por GR
- ❌ Integração com sistemas de RH
- ❌ Notificações por email

**Não adicionar, não mencionar, não perguntar sobre esses itens.**

---

## 15. Nomenclatura e Convenções

- **Idioma do código:** inglês (variáveis, funções, componentes)
- **Idioma da UI:** português do Brasil
- **Nomes de componentes:** PascalCase
- **Nomes de funções:** camelCase
- **Nomes de tabelas Supabase:** snake_case (já definidos no schema)
- **Commits:** não necessário no MVP, mas se usar: `feat:`, `fix:`, `chore:`

---

## Fim do Guia

Você tem tudo que precisa. Comece pela Fase 1, siga a ordem, não pule fases.
Se uma decisão não está neste documento, siga o bom senso de produto:
simples, mobile-first, sem fricção para o cliente.
