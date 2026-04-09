# Voxis

**A voz do cliente na agência.** Sistema web open source para coleta e gestão
de NPS de gerentes de relacionamento (GR) em agências bancárias via QR Code.

## Premissas inegociáveis

- O cliente que avalia é **100% anônimo** — nenhum dado identificável é coletado.
- O GR avaliado **nunca** tem acesso ao sistema — não é usuário, não vê seus dados.
- O QR Code é **fixo por GR** — o GR não controla quando existe ou não (antiviés
  de seleção). Transferências de agência preservam o mesmo token.
- **Mobile-first** — o cliente avalia pelo celular; a UI funciona em 375px.
- **Open source & multi-tenant** — cada banco instala sua própria instância com
  identidade visual configurável.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Banco de dados + Auth | Supabase (PostgreSQL + Supabase Auth) |
| CSS | Tailwind CSS 4 + CSS variables para temas |
| QR Code | `qrcode` |
| Device Fingerprint | `@fingerprintjs/fingerprintjs` |
| Linguagem | TypeScript (strict mode) |

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- Uma instância Supabase (gratuita no plano Free)

### 2. Clonar e instalar

```bash
git clone <url-do-repo> voxis
cd voxis
npm install
```

### 3. Configurar Supabase

1. Crie um projeto em https://supabase.com
2. No SQL Editor, cole o conteúdo de
   [`_contexto/voxis-guia-claudecode.md`](./_contexto/voxis-guia-claudecode.md)
   seção 4 (schema inicial) e rode. Isso cria as 11 tabelas, índices e a seed
   inicial (`Banco Demo` com 4 opções de motivo).
3. Copie `.env.example` para `.env.local` e preencha com suas credenciais do
   projeto Supabase:

   ```bash
   cp .env.example .env.local
   ```

### 4. Criar o primeiro usuário ADMIN

O sistema não tem tela de signup aberta (é intencional — acesso é controlado).
Para criar o primeiro admin:

```bash
# Usando curl com sua service role key:
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@voxis.dev",
    "password": "defina-uma-senha-forte",
    "email_confirm": true,
    "user_metadata": { "nome": "Admin" }
  }'
```

Pegue o `id` retornado e insira na tabela `usuario` (via SQL Editor do Supabase):

```sql
INSERT INTO usuario (id, banco_id, nome, email, perfil)
VALUES (
  '<id-do-auth-user>',
  '00000000-0000-0000-0000-000000000001', -- Banco Demo da seed
  'Admin',
  'admin@voxis.dev',
  'ADMIN'
);
```

A partir daí, novos usuários podem ser criados pela própria UI em `/admin/usuarios`.

### 5. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000 e faça login como o admin que você criou.

## Fluxos

### Cliente (anônimo)

1. Cliente escaneia o QR Code do GR
2. Cai em `/avaliar/[token]` — vê nome do GR e a agência
3. Avalia de 0 a 10 (escala NPS)
4. Se nota ≤ 8, escolhe um ou mais motivos (configuráveis por banco, máx. 4)
5. Tela de agradecimento

**Antifraude embutido:**
- Fingerprint do dispositivo + rate limit: mesmo device só avalia o mesmo GR
  uma vez a cada 24h
- Detecção de rajada: 5+ respostas ao mesmo GR em 10min → status `QUARENTENA`
  e anomalia registrada para revisão humana

### Admin / Direção / Gestor

Cada perfil tem seu próprio dashboard:

- **ADMIN** (`/admin`): CRUD de agências, gerentes, motivos, tema, usuários
- **DIRECAO** (`/direcao`): visão consolidada do banco + drill-down por agência
- **GESTOR_AGENCIA** (`/agencia`): dashboard da própria agência

## Arquitetura

```
src/
├── app/
│   ├── (public)/avaliar/[token]/  → Fluxo anônimo do cliente
│   ├── (auth)/login/              → Login (Supabase Auth)
│   ├── (dashboard)/
│   │   ├── admin/{agencias,gerentes,motivos,tema,usuarios}/
│   │   ├── direcao/{page,agencia/[id]}/
│   │   └── agencia/{page,anomalias}/
│   └── api/avaliar/{check,submit}/  → Endpoints públicos do cliente
├── components/
│   ├── avaliacao/   → Tela do cliente (EscalaNPS, SelecaoMotivo, etc.)
│   ├── dashboard/   → CardNPS, RankingGRs, GraficoDistribuicao, etc.
│   └── ui/          → Modal
├── lib/
│   ├── supabase/    → Clients (browser, server, admin)
│   ├── auth.ts      → requerirPerfil(), getUsuarioAtual()
│   ├── nps.ts       → calcularNPS()
│   ├── queries.ts   → Helpers dos dashboards
│   ├── antifraude.ts
│   └── tema.ts
├── proxy.ts         → Auth + proteção por perfil (Next 16)
└── types/database.ts
```

### Server Actions e segurança

Todo o CRUD administrativo usa **Server Actions** protegidas por
`requerirPerfil([...])`. Cada action filtra explicitamente por `banco_id` para
garantir segregação multi-tenant mesmo sem RLS.

**⚠️ RLS está desabilitado** para agilizar o desenvolvimento do MVP. Ver
[`PENDENCIAS_PRODUCAO.md`](./PENDENCIAS_PRODUCAO.md) antes de deployar.

## Scripts

```bash
npm run dev     # Dev server (porta 3000)
npm run build   # Build de produção
npm run start   # Servir o build
npm run lint    # ESLint
```

## Licença

MIT — fique à vontade para forkar, adaptar e rodar na sua instituição.
