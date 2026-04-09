import Link from 'next/link'
import { getUsuarioAtual } from '@/lib/auth'
import { GLOSSARIO } from '@/lib/glossario'
import { SimuladorNPS } from './SimuladorNPS'

const FAIXAS = [
  {
    label: 'Excelente',
    min: 75,
    max: 100,
    cor: 'text-green-600',
    bar: 'bg-green-500',
    descricao: 'Clientes altamente leais. Benchmarks mundiais só poucas empresas alcançam.',
  },
  {
    label: 'Bom',
    min: 50,
    max: 74,
    cor: 'text-blue-600',
    bar: 'bg-blue-500',
    descricao: 'Bom desempenho — a maioria dos clientes é positiva.',
  },
  {
    label: 'Neutro',
    min: 0,
    max: 49,
    cor: 'text-yellow-600',
    bar: 'bg-yellow-500',
    descricao: 'Há espaço relevante pra crescer. Clientes estão divididos.',
  },
  {
    label: 'Crítico',
    min: -100,
    max: -1,
    cor: 'text-red-600',
    bar: 'bg-red-500',
    descricao: 'Detratores superam promotores. Sinal pra agir rápido.',
  },
]

const FAQ = [
  {
    p: 'Por que o NPS da minha agência é "—" em vez de um número?',
    r: 'Porque há menos de 5 respostas no período selecionado. O sistema exibe "—" para evitar que você tire conclusões a partir de dados estatisticamente frágeis. Tente expandir o período (ex: 90 dias) ou verifique se o QR Code está visível para os clientes.',
  },
  {
    p: 'Por que os neutros não contam no cálculo?',
    r: 'Essa é uma decisão do método NPS original (criado em 2003 por Fred Reichheld). A lógica é que o NPS foca nos extremos: quem recomenda ativamente (promotores) e quem pode falar mal (detratores). Os neutros são "indiferentes" e ignorá-los deixa o indicador mais sensível a mudanças reais.',
  },
  {
    p: 'Como o Voxis impede que alguém manipule o NPS?',
    r: 'Cinco camadas. (1) Rate limit por cliente: bloqueia reavaliações do mesmo cliente para o mesmo GR usando cookie HTTP-only + fingerprint do dispositivo + hash de IP e user agent em OR lógico — cobre até janela anônima do navegador. (2) Unique constraints no banco: mesmo que alguém abra várias abas simultaneamente do mesmo QR tentando burlar o rate limit via concorrência, o banco garante atomicidade e apenas uma avaliação é gravada. (3) Detecção automática de rajada: 5+ respostas ao mesmo GR em menos de 10min vão direto pra quarentena. (4) Revisão humana da quarentena por direção ou gestor. (5) O GR não é usuário do sistema — não controla quando o cliente avalia nem tem acesso ao painel.',
  },
  {
    p: 'O gerente pode ver seu próprio NPS?',
    r: 'Não. O GR não é usuário do sistema — ele não tem login. O objetivo é evitar viés: se o GR pudesse ver em tempo real, ele poderia escolher só os clientes "bons" para avaliar, distorcendo o indicador.',
  },
  {
    p: 'Quem pode aprovar ou rejeitar uma anomalia?',
    r: 'Administradores, direção e o gestor da agência onde a anomalia aconteceu. Aprovar significa que as avaliações em quarentena entram no cálculo do NPS; rejeitar significa que são marcadas como "REJEITADA" e ignoradas no cálculo (mas ficam no histórico).',
  },
  {
    p: 'Delta de "—": o que significa?',
    r: 'Significa que não dá para comparar com o período anterior — ou o período atual ou o anterior tinha menos de 5 respostas. A comparação exige que ambos os períodos tenham dados suficientes.',
  },
  {
    p: 'Meu NPS é 35. Isso é bom ou ruim?',
    r: 'Depende do setor e do histórico. Pelas faixas do Voxis, 35 é "Neutro" (entre 0 e 49). Mas o mais importante não é o número absoluto: é a tendência. Saiu de 10 para 35 em 30 dias? Excelente. Saiu de 60 para 35? Sinal de alerta.',
  },
]

export default async function AjudaPage() {
  await getUsuarioAtual()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajuda</h1>
        <p className="text-sm text-gray-500">
          Tudo o que você precisa pra entender o NPS e os dashboards do Voxis.
        </p>
      </header>

      {/* Índice */}
      <nav className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-xs font-medium uppercase text-gray-500">
          Nesta página
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <a href="#o-que-e-nps" className="text-[var(--color-primary)] hover:underline">
              1. O que é o NPS
            </a>
          </li>
          <li>
            <a href="#calculo" className="text-[var(--color-primary)] hover:underline">
              2. Como é calculado
            </a>
          </li>
          <li>
            <a href="#classificacao" className="text-[var(--color-primary)] hover:underline">
              3. Faixas de classificação
            </a>
          </li>
          <li>
            <a href="#simulador" className="text-[var(--color-primary)] hover:underline">
              4. Simulador interativo
            </a>
          </li>
          <li>
            <a href="#glossario" className="text-[var(--color-primary)] hover:underline">
              5. Glossário
            </a>
          </li>
          <li>
            <a href="#faq" className="text-[var(--color-primary)] hover:underline">
              6. Perguntas frequentes
            </a>
          </li>
        </ul>
      </nav>

      {/* 1. O que é NPS */}
      <section
        id="o-que-e-nps"
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          1. O que é o NPS
        </h2>
        {GLOSSARIO.nps.longo.map((p, i) => (
          <p key={i} className="mt-3 text-sm leading-relaxed text-gray-700">
            {p}
          </p>
        ))}
      </section>

      {/* 2. Cálculo */}
      <section
        id="calculo"
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          2. Como é calculado
        </h2>
        {GLOSSARIO.calculo.longo.map((p, i) => (
          <p key={i} className="mt-3 text-sm leading-relaxed text-gray-700">
            {p}
          </p>
        ))}
        <div className="mt-4 rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-800">
          NPS = (promotores ÷ total × 100) − (detratores ÷ total × 100)
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Observação importante: os <strong>neutros</strong> (notas 7 e 8) não
          entram na fórmula — são ignorados completamente no cálculo.
        </p>
      </section>

      {/* 3. Classificação */}
      <section
        id="classificacao"
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          3. Faixas de classificação
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          O Voxis usa quatro faixas para classificar o NPS:
        </p>
        <div className="mt-4 space-y-3">
          {FAIXAS.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-4 rounded-lg border border-gray-100 p-3"
            >
              <div className="w-20 shrink-0">
                <div className={`text-sm font-bold ${f.cor}`}>{f.label}</div>
                <div className="font-mono text-[11px] text-gray-400">
                  {f.min} a {f.max}
                </div>
              </div>
              <div className="text-xs text-gray-600">{f.descricao}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Benchmarks variam por setor. No setor bancário brasileiro, um NPS de
          50 já é considerado muito bom. O mais importante é acompanhar a
          tendência (delta) ao longo do tempo.
        </p>
      </section>

      {/* 4. Simulador */}
      <section id="simulador" className="mb-8 scroll-mt-20">
        <SimuladorNPS />
      </section>

      {/* 5. Glossário */}
      <section
        id="glossario"
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-lg font-semibold text-gray-900">5. Glossário</h2>
        <p className="mt-1 text-sm text-gray-500">
          Termos e conceitos usados no Voxis.
        </p>
        <dl className="mt-5 space-y-5">
          {Object.values(GLOSSARIO).map((termo) => (
            <div
              key={termo.id}
              className="border-l-2 border-gray-100 pl-4"
            >
              <dt className="text-sm font-semibold text-gray-900">
                {termo.titulo}
              </dt>
              <dd className="mt-1 space-y-2 text-xs leading-relaxed text-gray-600">
                {termo.longo.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 6. FAQ */}
      <section
        id="faq"
        className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          6. Perguntas frequentes
        </h2>
        <div className="mt-5 space-y-4">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-lg border border-gray-100 p-4 open:bg-gray-50"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-gray-900">
                <span className="mr-2 text-gray-400 group-open:rotate-90 inline-block transition-transform">
                  ▸
                </span>
                {item.p}
              </summary>
              <p className="mt-3 pl-4 text-sm leading-relaxed text-gray-600">
                {item.r}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center text-xs text-gray-400">
        <Link href="/painel" className="hover:text-gray-600">
          ← Voltar para o painel
        </Link>
      </div>
    </div>
  )
}
