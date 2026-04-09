export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      agencia: {
        Row: {
          ativo: boolean | null
          banco_id: string
          codigo: string
          criado_em: string | null
          id: string
          municipio: string | null
          nome: string
          superintendencia_id: string | null
          uf: string | null
        }
        Insert: {
          ativo?: boolean | null
          banco_id: string
          codigo: string
          criado_em?: string | null
          id?: string
          municipio?: string | null
          nome: string
          superintendencia_id?: string | null
          uf?: string | null
        }
        Update: Partial<Database['public']['Tables']['agencia']['Insert']>
        Relationships: []
      }
      anomalia_log: {
        Row: {
          agencia_id: string | null
          banco_id: string
          descricao: string | null
          detectado_em: string | null
          gr_id: string | null
          id: string
          resolvido: boolean | null
          resolvido_em: string | null
          resolvido_por: string | null
          tipo_anomalia: string
        }
        Insert: {
          agencia_id?: string | null
          banco_id: string
          descricao?: string | null
          detectado_em?: string | null
          gr_id?: string | null
          id?: string
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo_anomalia: string
        }
        Update: Partial<Database['public']['Tables']['anomalia_log']['Insert']>
        Relationships: []
      }
      avaliacao: {
        Row: {
          agencia_id: string
          banco_id: string
          dispositivo_hash: string
          gr_id: string
          id: string
          ip_hash: string | null
          motivo_quarentena: string | null
          nota: number
          respondido_em: string
          status: 'VALIDA' | 'QUARENTENA' | 'REJEITADA'
          user_agent_hash: string | null
        }
        Insert: {
          agencia_id: string
          banco_id: string
          dispositivo_hash: string
          gr_id: string
          id?: string
          ip_hash?: string | null
          motivo_quarentena?: string | null
          nota: number
          respondido_em?: string
          status?: 'VALIDA' | 'QUARENTENA' | 'REJEITADA'
          user_agent_hash?: string | null
        }
        Update: Partial<Database['public']['Tables']['avaliacao']['Insert']>
        Relationships: []
      }
      avaliacao_motivo: {
        Row: {
          avaliacao_id: string
          id: string
          opcao_motivo_id: string | null
          texto_outro: string | null
        }
        Insert: {
          avaliacao_id: string
          id?: string
          opcao_motivo_id?: string | null
          texto_outro?: string | null
        }
        Update: Partial<Database['public']['Tables']['avaliacao_motivo']['Insert']>
        Relationships: []
      }
      configuracao_tema: {
        Row: {
          atualizado_em: string | null
          banco_id: string
          cor_primaria: string
          cor_secundaria: string
          id: string
          logo_url: string | null
          nome_exibicao: string
          preset_banco: string | null
        }
        Insert: {
          atualizado_em?: string | null
          banco_id: string
          cor_primaria?: string
          cor_secundaria?: string
          id?: string
          logo_url?: string | null
          nome_exibicao: string
          preset_banco?: string | null
        }
        Update: Partial<Database['public']['Tables']['configuracao_tema']['Insert']>
        Relationships: []
      }
      gerente_relacionamento: {
        Row: {
          agencia_id: string
          ativo: boolean | null
          ativo_desde: string | null
          banco_id: string
          criado_em: string | null
          id: string
          matricula: string | null
          nome: string
          qr_token: string
        }
        Insert: {
          agencia_id: string
          ativo?: boolean | null
          ativo_desde?: string | null
          banco_id: string
          criado_em?: string | null
          id?: string
          matricula?: string | null
          nome: string
          qr_token?: string
        }
        Update: Partial<Database['public']['Tables']['gerente_relacionamento']['Insert']>
        Relationships: []
      }
      historico_vinculo_gr: {
        Row: {
          agencia_id: string
          criado_em: string | null
          fim_em: string | null
          gr_id: string
          id: string
          inicio_em: string
        }
        Insert: {
          agencia_id: string
          criado_em?: string | null
          fim_em?: string | null
          gr_id: string
          id?: string
          inicio_em?: string
        }
        Update: Partial<Database['public']['Tables']['historico_vinculo_gr']['Insert']>
        Relationships: []
      }
      instancia_banco: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['instancia_banco']['Insert']>
        Relationships: []
      }
      opcao_motivo: {
        Row: {
          ativo: boolean | null
          banco_id: string
          id: string
          ordem: number
          texto: string
        }
        Insert: {
          ativo?: boolean | null
          banco_id: string
          id?: string
          ordem?: number
          texto: string
        }
        Update: Partial<Database['public']['Tables']['opcao_motivo']['Insert']>
        Relationships: []
      }
      superintendencia: {
        Row: {
          ativo: boolean | null
          banco_id: string
          codigo: string | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          banco_id: string
          codigo?: string | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: Partial<Database['public']['Tables']['superintendencia']['Insert']>
        Relationships: []
      }
      usuario: {
        Row: {
          agencia_id: string | null
          ativo: boolean | null
          banco_id: string
          criado_em: string | null
          email: string
          id: string
          nome: string
          perfil: 'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'
        }
        Insert: {
          agencia_id?: string | null
          ativo?: boolean | null
          banco_id: string
          criado_em?: string | null
          email: string
          id: string
          nome: string
          perfil: 'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'
        }
        Update: Partial<Database['public']['Tables']['usuario']['Insert']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
