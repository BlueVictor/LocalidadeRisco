'use client';

import { useState } from 'react';
import { formatarValor } from '../utils/formatadores';

export default function PainelKPIs({
  dados = []
}: {
  dados?: any[];
}) {
  // Cálculo dos KPIs
  const totalTransacoes = dados.length;

  const valorTotal = dados.reduce(
    (acc, curr) =>
      acc + Number(curr.VALOR_TRANSACAO || 0),
    0
  );

  const ticketMedio =
    totalTransacoes > 0
      ? valorTotal / totalTransacoes
      : 0;

  const cidadesUnicas = new Set(
    dados
      .map(item => item.LOCAL_TRANSACAO_LIMPO)
      .filter(
        cidade =>
          cidade &&
          cidade.toUpperCase() !==
            'NÃO INFORMADO'
      )
  ).size;

  // Estado para controlar o card selecionado
  const [cardSelecionado, setCardSelecionado] = useState<string | null>(null);
  // Definição dos cards com informações detalhadas
  const cards = [
    {
      title: 'Alertas Gerados',
      value:
        totalTransacoes.toLocaleString('pt-BR'),
      subtitle:
        'Transações sinalizadas pela matriz de risco.',
      icon: '⚠️',
      color:
        'from-rose-500 to-red-600',
      badge:
        'border-rose-100 bg-rose-50 text-rose-700',
      iconBox:
        'border-rose-100 bg-rose-50 text-rose-600',
      glow:
        'hover:shadow-rose-100',
      description:
        'Representa a quantidade total de transações que permaneceram na base analisada após os filtros aplicados.',
      leitura:
        'Quanto maior esse número, maior é o volume de ocorrências que precisam ser revisadas pela equipe operacional.',
      metodologia:
        'Contagem simples dos registros disponíveis no conjunto de dados filtrado.',
      formula:
        'Total de alertas = quantidade de registros analisados'
    },

    {
      title: 'Volume Financeiro',
      value: `R$ ${formatarValor(
        valorTotal
      )}`,
      subtitle:
        'Valor total movimentado nas ocorrências.',
      icon: '💰',
      color:
        'from-slate-700 to-slate-950',
      badge:
        'border-slate-200 bg-slate-50 text-slate-700',
      iconBox:
        'border-slate-200 bg-slate-100 text-slate-700',
      glow:
        'hover:shadow-slate-200',
      description:
        'Soma financeira de todas as transações suspeitas presentes na base filtrada.',
      leitura:
        'Ajuda a medir a materialidade financeira dos alertas e priorizar casos com maior impacto monetário.',
      metodologia:
        'Soma do campo VALOR_TRANSACAO em todos os registros analisados.',
      formula:
        'Volume financeiro = soma de VALOR_TRANSACAO'
    },

    {
      title: 'Ticket Médio',
      value: `R$ ${formatarValor(
        ticketMedio
      )}`,
      subtitle:
        'Média financeira por transação suspeita.',
      icon: '📈',
      color:
        'from-emerald-500 to-green-600',
      badge:
        'border-emerald-100 bg-emerald-50 text-emerald-700',
      iconBox:
        'border-emerald-100 bg-emerald-50 text-emerald-600',
      glow:
        'hover:shadow-emerald-100',
      description:
        'Mostra o valor médio das transações suspeitas dentro do conjunto analisado.',
      leitura:
        'Um ticket médio elevado pode indicar concentração de risco em operações de maior valor.',
      metodologia:
        'Divisão do volume financeiro total pela quantidade de transações analisadas.',
      formula:
        'Ticket médio = volume financeiro / total de transações'
    },

    {
      title: 'Cidades Afetadas',
      value:
        cidadesUnicas.toLocaleString(
          'pt-BR'
        ),
      subtitle:
        'Municípios distintos envolvidos nas operações.',
      icon: '🗺️',
      color:
        'from-blue-500 to-indigo-600',
      badge:
        'border-blue-100 bg-blue-50 text-blue-700',
      iconBox:
        'border-blue-100 bg-blue-50 text-blue-600',
      glow:
        'hover:shadow-blue-100',
      description:
        'Quantidade de municípios diferentes envolvidos nas transações suspeitas.',
      leitura:
        'Ajuda a entender a dispersão territorial dos alertas e possíveis zonas de concentração operacional.',
      metodologia:
        'Contagem de cidades únicas a partir do campo LOCAL_TRANSACAO_LIMPO, ignorando valores não informados.',
      formula:
        'Cidades afetadas = quantidade de municípios únicos válidos'
    }
  ];

  // Encontrar o card ativo com base no título selecionado
  const cardAtivo =
    cards.find(card => card.title === cardSelecionado) || null;

  return (
    <div className="w-full space-y-8">

      <div className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-[#071120] shadow-[0_26px_90px_rgba(15,23,42,0.28)]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1730] to-[#17375c]" />
          <div className="absolute -top-32 -right-28 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:38px_38px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        </div>

        <div className="relative z-10 px-6 py-8 md:px-9 md:py-10 xl:px-11 xl:py-11">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-8 xl:gap-12 items-center">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 shadow-inner shadow-white/5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)] animate-pulse" />

                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-100">
                  Dashboard Financeiro
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Indicadores{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Operacionais
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-slate-300">
                Monitoramento de movimentações suspeitas, volume financeiro
                e abrangência geográfica da base.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Alertas
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {totalTransacoes.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Municípios
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {cidadesUnicas.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/70">
                    Status
                  </p>

                  <p className="mt-2 text-xl font-black text-emerald-300">
                    Atualizado
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[380px] xl:max-w-none justify-self-center xl:justify-self-end">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-blue-500/25 via-cyan-500/10 to-indigo-500/25 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.075] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_38%)]" />

                <div className="relative z-10 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                          Volume Total
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-white">
                          R$ {formatarValor(valorTotal)}
                        </h3>
                      </div>

                      <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        💰
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Ticket
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        Médio
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Cidades
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        {cidadesUnicas.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
        {cards.map(card => (
          <button
            key={card.title}
            type="button"
            onClick={() => setCardSelecionado(card.title)}
            className={`group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white text-left shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-blue-100 ${card.glow}`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.color}`}
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div>
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-sm transition-transform duration-300 group-hover:scale-105 ${card.iconBox}`}
                >
                  {card.icon}
                </div>

                <div
                  className={`mb-4 inline-flex rounded-2xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${card.badge}`}
                >
                  Indicador
                </div>

                <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900">
                  {card.title}
                </h3>

                <p className="text-sm leading-relaxed text-slate-500">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-8">
                <div className="break-words text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl">
                  {card.value}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.65)] animate-pulse" />

                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Atualizado
                    </span>
                  </div>

                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-400">
                    Ver detalhes
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {cardAtivo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => setCardSelecionado(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.45)]"
            onClick={event => event.stopPropagation()}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${cardAtivo.color}`}
            />

            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-6">
              <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-slate-100 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border text-3xl shadow-sm ${cardAtivo.iconBox}`}
                  >
                    {cardAtivo.icon}
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Detalhamento do indicador
                    </p>

                    <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                      {cardAtivo.title}
                    </h3>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {cardAtivo.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Valor atual
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {cardAtivo.value}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCardSelecionado(null)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  O que representa
                </p>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                  {cardAtivo.description}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Como interpretar
                </p>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                  {cardAtivo.leitura}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Metodologia
                </p>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                  {cardAtivo.metodologia}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Cálculo
                </p>

                <p className="mt-2 font-mono text-sm font-bold text-slate-700">
                  {cardAtivo.formula}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
