# Pendências para Produção

Itens que ficaram fora do MVP e precisam ser resolvidos antes de rodar o Voxis
em produção real.

---

## 🔒 RLS (Row-Level Security)

**Status:** Desabilitado em todas as tabelas.

**Contexto:** O schema inicial (Fase 1) criou as 11 tabelas sem RLS para evitar
fricção no desenvolvimento. Todo o controle de acesso hoje é feito nas Server
Actions e Server Components via `requerirPerfil()` e filtro por `banco_id` em
cada query.

**O que implementar antes de produção:**

1. **Ativar RLS em todas as tabelas do schema `public`:**
   ```sql
   ALTER TABLE instancia_banco      ENABLE ROW LEVEL SECURITY;
   ALTER TABLE configuracao_tema    ENABLE ROW LEVEL SECURITY;
   ALTER TABLE superintendencia     ENABLE ROW LEVEL SECURITY;
   ALTER TABLE agencia              ENABLE ROW LEVEL SECURITY;
   ALTER TABLE gerente_relacionamento ENABLE ROW LEVEL SECURITY;
   ALTER TABLE historico_vinculo_gr ENABLE ROW LEVEL SECURITY;
   ALTER TABLE opcao_motivo         ENABLE ROW LEVEL SECURITY;
   ALTER TABLE avaliacao            ENABLE ROW LEVEL SECURITY;
   ALTER TABLE avaliacao_motivo     ENABLE ROW LEVEL SECURITY;
   ALTER TABLE anomalia_log         ENABLE ROW LEVEL SECURITY;
   ALTER TABLE usuario              ENABLE ROW LEVEL SECURITY;
   ```

2. **Criar policies que:**
   - Permitam leitura pública apenas de `gerente_relacionamento` (por `qr_token`),
     `configuracao_tema`, `opcao_motivo` e `agencia` — o estritamente necessário
     para a página `/avaliar/[token]` funcionar com a anon key.
   - Permitam `INSERT` público em `avaliacao` e `avaliacao_motivo` (checagem de
     rate limit e rajada continua no código).
   - Permitam CRUD em todas as tabelas **apenas** para usuários autenticados do
     mesmo `banco_id` do registro, com filtro extra por perfil quando aplicável
     (ex.: GESTOR_AGENCIA só deve ver avaliações da própria agência).
   - A tabela `usuario` precisa de policy que permita a um usuário ler o próprio
     registro (necessário para o middleware funcionar após RLS ligado).

3. **Revisar `createAdminClient()`** (`src/lib/supabase/admin.ts`): o service
   role bypassa RLS — garantir que ele só é usado onde realmente precisa
   (criação/reset de usuário e anomalias cross-agência). Qualquer query que não
   precise de bypass deve usar `createClient()` normal.

4. **Testar o fluxo completo após ativar RLS:**
   - Fluxo público `/avaliar/[token]` com anon key
   - Login de cada perfil
   - CRUDs administrativos
   - Dashboards com filtro correto por perfil
   - Reset de senha e criação de usuário (service role)

5. **Considerar dropar `SUPABASE_SERVICE_ROLE_KEY` do `.env.local` de
   desenvolvimento** quando não estiver testando auth admin, para capturar
   regressões onde código usa o admin client sem precisar.

**Referências:**
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- Tabelas do Voxis e relações: ver `_contexto/voxis-guia-claudecode.md` seção 4
