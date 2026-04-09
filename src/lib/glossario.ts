/**
 * Glossário central do Voxis — explicações curtas e longas de todos os
 * termos e conceitos usados nos dashboards. Usado tanto em tooltips
 * inline quanto na página de Ajuda.
 */

export type Termo = {
  id: string
  titulo: string
  /** Texto curto para tooltip inline (até ~2 linhas) */
  curto: string
  /** Texto completo para a página de ajuda */
  longo: string[]
}

export const GLOSSARIO: Record<string, Termo> = {
  nps: {
    id: 'nps',
    titulo: 'NPS (Net Promoter Score)',
    curto:
      'Métrica de lealdade que varia de −100 a +100. Quanto maior, melhor. Mede o quanto clientes recomendariam o atendimento.',
    longo: [
      'NPS é a sigla em inglês para Net Promoter Score — literalmente, "índice líquido de promotores". É uma das métricas mais usadas no mundo para medir lealdade de clientes.',
      'Funciona assim: pergunta-se ao cliente uma única coisa — "Em uma escala de 0 a 10, o quanto você recomendaria este serviço a um amigo?" — e com base na nota, o cliente é classificado como promotor, neutro ou detrator.',
      'O NPS final é a diferença percentual entre promotores e detratores. Ele vai de −100 (todo mundo é detrator) a +100 (todo mundo é promotor). Zero significa que promotores e detratores se cancelam.',
    ],
  },
  promotores: {
    id: 'promotores',
    titulo: 'Promotores',
    curto:
      'Clientes que deram nota 9 ou 10. São fãs — recomendam espontaneamente e voltam.',
    longo: [
      'Promotores são clientes que deram nota 9 ou 10 na pergunta do NPS. São clientes engajados, leais, que têm grande probabilidade de recomendar o atendimento a amigos e familiares.',
      'São o ativo mais valioso no NPS — quanto maior a proporção de promotores, mais forte é a base de clientes.',
    ],
  },
  neutros: {
    id: 'neutros',
    titulo: 'Neutros',
    curto:
      'Clientes que deram nota 7 ou 8. Estão satisfeitos, mas não entusiasmados — qualquer atrito pode afastá-los.',
    longo: [
      'Neutros são clientes que deram nota 7 ou 8. Eles estão satisfeitos, mas não a ponto de recomendar ativamente. Não entram no cálculo do NPS — são ignorados na fórmula.',
      'Isso não significa que não importam: neutros podem virar promotores com uma experiência marcante ou detratores com um atrito significativo. São clientes em jogo.',
    ],
  },
  detratores: {
    id: 'detratores',
    titulo: 'Detratores',
    curto:
      'Clientes que deram nota de 0 a 6. Estão insatisfeitos e podem gerar boca-a-boca negativo.',
    longo: [
      'Detratores são clientes que deram nota de 0 a 6 — ou seja, qualquer nota abaixo de 7. São clientes insatisfeitos que provavelmente não recomendariam o serviço e podem, inclusive, gerar boca-a-boca negativo.',
      'Entender por que alguém virou detrator é essencial para corrigir problemas antes que eles se multipliquem.',
    ],
  },
  calculo: {
    id: 'calculo',
    titulo: 'Como o NPS é calculado',
    curto:
      'NPS = % de promotores − % de detratores. O resultado vai de −100 a +100.',
    longo: [
      'A fórmula é: NPS = (promotores ÷ total) × 100 − (detratores ÷ total) × 100.',
      'Exemplo: numa agência com 100 respostas, 60 promotores, 25 neutros e 15 detratores, o NPS seria (60/100)×100 − (15/100)×100 = 60 − 15 = 45.',
      'O resultado sempre vai estar entre −100 (todos detratores) e +100 (todos promotores). É comum arredondar pra inteiro.',
    ],
  },
  classificacao: {
    id: 'classificacao',
    titulo: 'Classificação do NPS',
    curto:
      'Excelente (≥75), Bom (50–74), Neutro (0–49), Crítico (<0). Benchmarks podem variar por setor.',
    longo: [
      'A interpretação do NPS costuma seguir as faixas: Excelente (≥75), Bom (50 a 74), Neutro (0 a 49) e Crítico (abaixo de zero).',
      'Essas faixas são amplamente aceitas, mas benchmarks variam por setor. No setor bancário brasileiro, por exemplo, um NPS de 50 já é considerado muito bom.',
      'O mais importante é acompanhar a tendência (delta) ao longo do tempo — uma agência que sai de 10 pra 30 está melhorando, mesmo que ainda esteja na faixa "Neutro".',
    ],
  },
  delta: {
    id: 'delta',
    titulo: 'Delta (Δ)',
    curto:
      'Variação em pontos do NPS em relação ao período anterior de mesmo tamanho. Verde = melhora, vermelho = piora.',
    longo: [
      'O delta (Δ) compara o NPS atual com o NPS do período anterior de mesmo tamanho. Por exemplo: se você está olhando os últimos 30 dias, o delta é a diferença em relação aos 30 dias anteriores (dias 31 a 60 atrás).',
      'Verde indica melhora, vermelho indica piora. Um delta de "—" significa que algum dos dois períodos não tinha dados suficientes (menos de 5 respostas) e a comparação não é confiável.',
    ],
  },
  dadosInsuficientes: {
    id: 'dadosInsuficientes',
    titulo: 'Dados insuficientes',
    curto:
      'Quando há menos de 5 respostas no período, o NPS é exibido como "—" para evitar conclusões apressadas.',
    longo: [
      'Um NPS calculado com poucas respostas é estatisticamente frágil. Uma única nota pode mover o número em dezenas de pontos, o que leva a conclusões erradas.',
      'Por isso o Voxis exibe "—" sempre que há menos de 5 respostas no período selecionado. É um lembrete visual de que o dado ainda não é representativo.',
      'Se uma agência ou GR está sempre com "—", vale investigar se os QR Codes estão visíveis no atendimento ou se o volume de clientes justifica o cálculo.',
    ],
  },
  anomalia: {
    id: 'anomalia',
    titulo: 'Anomalia',
    curto:
      'Padrão suspeito detectado automaticamente. Exemplo: 5+ respostas em menos de 10 minutos para o mesmo GR.',
    longo: [
      'O Voxis detecta automaticamente padrões suspeitos nas avaliações — por exemplo, uma rajada de 5 ou mais respostas para o mesmo gerente em menos de 10 minutos. Isso pode indicar manipulação intencional (alguém tentando puxar o NPS pra cima ou pra baixo).',
      'Quando uma anomalia é detectada, as avaliações envolvidas são colocadas em "quarentena" e não entram no cálculo do NPS. Um revisor humano (direção, gestor ou admin) precisa aprovar (aceitar como legítimas) ou rejeitar (descartar definitivamente).',
    ],
  },
  qrToken: {
    id: 'qrToken',
    titulo: 'QR Code fixo por GR',
    curto:
      'Cada gerente tem um QR Code único e permanente. Ele não muda nem quando o GR troca de agência.',
    longo: [
      'Cada gerente de relacionamento tem um QR Code único que aponta para a página pública de avaliação desse GR. O QR Code é identificado por um token aleatório e permanente.',
      'Isso é uma decisão de produto: o QR fica impresso no balcão do GR, e ele não controla quando o cliente avalia ou não. Isso previne viés de seleção (o GR escolher apenas clientes que gostaram do atendimento para avaliar).',
      'Quando um GR é transferido entre agências, o mesmo QR Code continua valendo — as novas avaliações são automaticamente atribuídas à nova agência.',
    ],
  },
  anonimato: {
    id: 'anonimato',
    titulo: 'Anonimato do cliente',
    curto:
      'Nenhum dado identificável é coletado do cliente. Hashes de dispositivo são usados apenas para anti-fraude.',
    longo: [
      'O Voxis não coleta nome, email, telefone ou qualquer dado pessoal do cliente que avalia. Isso é uma premissa inegociável do sistema.',
      'Para evitar que a mesma pessoa avalie o mesmo GR múltiplas vezes em sequência (o que distorceria o NPS), o sistema armazena apenas hashes criptográficos do dispositivo, IP e user-agent. Esses hashes não são reversíveis — não dá pra recuperar o dado original a partir deles.',
    ],
  },
  rateLimit: {
    id: 'rateLimit',
    titulo: 'Rate limit de 24h',
    curto:
      'O mesmo cliente não consegue avaliar o mesmo GR duas vezes em 24h — checagem em 3 camadas (cookie, fingerprint e IP+navegador).',
    longo: [
      'Para proteger o indicador contra reavaliações do mesmo cliente, o Voxis bloqueia novas avaliações do mesmo GR pelo mesmo cliente.',
      'A checagem usa 3 camadas em OR lógico: (1) cookie HTTP-only gravado após o envio, (2) fingerprint do dispositivo calculado no navegador, e (3) combinação de hash do IP e do user agent. Qualquer uma que bata é suficiente para bloquear.',
      'No nível do banco de dados, duas unique constraints — em (gerente, dispositivo) e em (gerente, IP, navegador) — garantem atomicidade mesmo contra ataques de concorrência: abrir várias abas simultaneamente do mesmo QR, por exemplo. Apenas uma das requisições grava; as demais recebem erro 429.',
      'Essa abordagem cobre até mesmo o caso de alguém abrir uma janela anônima tentando "resetar" a proteção — o IP e o user agent continuam os mesmos entre modos do navegador.',
    ],
  },
  periodo: {
    id: 'periodo',
    titulo: 'Filtro de período',
    curto:
      'Seleciona a janela de tempo analisada. Todas as métricas se ajustam ao período escolhido.',
    longo: [
      'Os botões "7 dias", "30 dias", "90 dias" e "12 meses" no canto superior definem a janela de tempo analisada. O NPS, os rankings, a distribuição de notas e os motivos mais citados são recalculados com base nas respostas dentro dessa janela.',
      'Períodos curtos mostram mudanças rápidas (útil para reagir a problemas); períodos longos dão mais estabilidade estatística (útil para entender tendências).',
    ],
  },
}

export type GlossarioKey = keyof typeof GLOSSARIO

export function getTermo(chave: GlossarioKey): Termo {
  return GLOSSARIO[chave]
}
