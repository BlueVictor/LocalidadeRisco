'use client';

import { useState, type ReactNode } from 'react';
import { formatarValor } from '../utils/formatadores';

// Função para renderizar a tabela paginada com os dados fornecidos
export default function PaginadorTabela({ dados }: { dados: any[] }) {
  // Estados para controlar a página atual, itens por página e a transação selecionada
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any | null>(
    null
  );

  if (!dados || dados.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-4 font-medium text-slate-500">
        Nenhum dado encontrado.
      </p>
    );
  }

  // Cálculo do total de páginas e dos dados a serem exibidos na página atual
  const totalPaginas = Math.ceil(dados.length / itensPorPagina) || 1;
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const dadosPaginados = dados.slice(indexInicio, indexInicio + itensPorPagina);
  const temScore = dados.length > 0 && dados[0].SCORE_SUSPEITA !== undefined;

  // Função para obter a cor da tipologia com base no tipo fornecido
  const getCorTipologia = (tipo: string) => {
    switch (tipo) {
      case 'Região de Fronteira':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Região de Mineração':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Outra Região de Risco':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rota Caipira':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rota do Solimões':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Baixo Risco':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Função para obter o tema da tipologia com base no tipo fornecido
  const getTemaTipologia = (tipo: string) => {
    switch (tipo) {
      case 'Região de Fronteira':
        return {
          gradient: 'from-red-600 via-rose-500 to-orange-500',
          soft: 'bg-red-50 border-red-100 text-red-700',
          icon: 'bg-red-100 border-red-200 text-red-700',
          badge: 'bg-red-100 border-red-200 text-red-700',
          ring: 'ring-red-100',
          glow: 'bg-red-500/10',
          title: 'text-red-700',
          emoji: '🚩'
        };

      case 'Região de Mineração':
        return {
          gradient: 'from-blue-600 via-sky-500 to-cyan-500',
          soft: 'bg-blue-50 border-blue-100 text-blue-700',
          icon: 'bg-blue-100 border-blue-200 text-blue-700',
          badge: 'bg-blue-100 border-blue-200 text-blue-700',
          ring: 'ring-blue-100',
          glow: 'bg-blue-500/10',
          title: 'text-blue-700',
          emoji: '⛏️'
        };

      case 'Outra Região de Risco':
        return {
          gradient: 'from-amber-500 via-orange-500 to-yellow-500',
          soft: 'bg-amber-50 border-amber-100 text-amber-700',
          icon: 'bg-amber-100 border-amber-200 text-amber-700',
          badge: 'bg-amber-100 border-amber-200 text-amber-700',
          ring: 'ring-amber-100',
          glow: 'bg-amber-500/10',
          title: 'text-amber-700',
          emoji: '⚠️'
        };

      case 'Rota Caipira':
        return {
          gradient: 'from-purple-600 via-violet-500 to-fuchsia-500',
          soft: 'bg-purple-50 border-purple-100 text-purple-700',
          icon: 'bg-purple-100 border-purple-200 text-purple-700',
          badge: 'bg-purple-100 border-purple-200 text-purple-700',
          ring: 'ring-purple-100',
          glow: 'bg-purple-500/10',
          title: 'text-purple-700',
          emoji: '🛣️'
        };

      case 'Rota do Solimões':
        return {
          gradient: 'from-emerald-600 via-teal-500 to-cyan-500',
          soft: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          icon: 'bg-emerald-100 border-emerald-200 text-emerald-700',
          badge: 'bg-emerald-100 border-emerald-200 text-emerald-700',
          ring: 'ring-emerald-100',
          glow: 'bg-emerald-500/10',
          title: 'text-emerald-700',
          emoji: '🌊'
        };

      case 'Baixo Risco':
        return {
          gradient: 'from-slate-500 via-slate-600 to-slate-700',
          soft: 'bg-slate-50 border-slate-200 text-slate-700',
          icon: 'bg-slate-100 border-slate-200 text-slate-700',
          badge: 'bg-slate-100 border-slate-200 text-slate-700',
          ring: 'ring-slate-100',
          glow: 'bg-slate-500/10',
          title: 'text-slate-700',
          emoji: '✅'
        };

      default:
        return {
          gradient: 'from-slate-700 via-slate-800 to-slate-950',
          soft: 'bg-slate-50 border-slate-200 text-slate-700',
          icon: 'bg-slate-100 border-slate-200 text-slate-700',
          badge: 'bg-slate-100 border-slate-200 text-slate-700',
          ring: 'ring-slate-100',
          glow: 'bg-slate-500/10',
          title: 'text-slate-700',
          emoji: '📄'
        };
    }
  };

  // Função para obter a cor do score com base no valor fornecido
  const getCorScore = (score: number) => {
    const scorePercentual = score <= 1 ? score * 100 : score;

    if (scorePercentual < 40) {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }

    if (scorePercentual < 80) {
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    }

    return 'bg-red-100 text-red-700 border border-red-200';
  };

  // Função para obter o nível do score com base no valor fornecido
  const getNivelScore = (score: number) => {
    const scorePercentual = score <= 1 ? score * 100 : score;

    if (scorePercentual < 40) {
      return {
        texto: 'Baixo',
        classe: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        barra: 'bg-emerald-500'
      };
    }

    if (scorePercentual < 80) {
      return {
        texto: 'Médio',
        classe: 'text-orange-700 bg-orange-50 border-orange-100',
        barra: 'bg-orange-500'
      };
    }

    return {
      texto: 'Crítico',
      classe: 'text-red-700 bg-red-50 border-red-100',
      barra: 'bg-red-500'
    };
  };

  // Função para formatar o valor de um campo com base no nome do campo e no valor fornecido
  const formatarValorCampo = (campo: string, valor: any) => {
    if (valor === null || valor === undefined || valor === '') {
      return 'Não informado';
    }

    if (
      campo.toUpperCase().includes('VALOR') ||
      campo.toUpperCase().includes('TOTAL')
    ) {
      const numero = Number(valor);

      if (!Number.isNaN(numero)) {
        return `R$ ${formatarValor(numero)}`;
      }
    }

    if (campo === 'SCORE_SUSPEITA') {
      const score = Number(valor);
      const scorePercentual = score <= 1 ? score * 100 : score;

      return `${scorePercentual.toFixed(1)}%`;
    }

    return String(valor);
  };

  // Obtenção do tema da tipologia da transação selecionada
  const temaModal = transacaoSelecionada
    ? getTemaTipologia(transacaoSelecionada.TIPOLOGIA_ORIGEM)
    : null;

  // Cálculo do score da transação selecionada, considerando o caso em que o score não está definido
  const scoreModal =
    transacaoSelecionada?.SCORE_SUSPEITA !== undefined
      ? Number(transacaoSelecionada.SCORE_SUSPEITA || 0)
      : 0;

  // Cálculo do percentual do score e obtenção do nível e formatação do score
  const scorePercentualModal = scoreModal <= 1 ? scoreModal * 100 : scoreModal;
  const nivelScoreModal = getNivelScore(scoreModal);
  const scoreFormatadoModal = formatarValorCampo('SCORE_SUSPEITA', scoreModal);

  // Componente para exibir informações em um card
  const CardInfo = ({
    titulo,
    valor,
    destaque = false,
    valorGrande = false,
    children
  }: {
    titulo: string;
    valor?: string;
    destaque?: boolean;
    valorGrande?: boolean;
    children?: ReactNode;
  }) => (
    <div
      className={`min-w-0 rounded-3xl border p-5 shadow-sm ${
        destaque && temaModal
          ? temaModal.soft
          : 'border-slate-200 bg-white text-slate-800'
      }`}
    >
      <p
        className={`mb-3 text-[10px] font-black uppercase tracking-[0.18em] ${
          destaque ? 'opacity-70' : 'text-slate-400'
        }`}
      >
        {titulo}
      </p>

      {children || (
        <p
          title={valor || 'Não informado'}
          className={`max-w-full font-black leading-tight ${
            valorGrande
              ? 'overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.15rem,1.65vw,1.75rem)]'
              : 'break-words text-base md:text-lg'
          }`}
        >
          {valor || 'Não informado'}
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <table className="w-full min-w-[980px] table-fixed border-collapse bg-white text-left text-sm">
            <colgroup>
              {temScore && <col className="w-[110px]" />}
              <col className={temScore ? 'w-[310px]' : 'w-[410px]'} />
              <col className="w-[190px]" />
              <col className="w-[230px]" />
              <col className="w-[220px]" />
            </colgroup>

            <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
              <tr className="border-b border-slate-200">
                {temScore && (
                  <th className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Score
                  </th>
                )}

                <th className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Titular / Documento
                </th>

                <th className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Valor (R$)
                </th>

                <th className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Tipologia
                </th>

                <th className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Localidade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {dadosPaginados.map((row, i) => {
                const score = Number(row.SCORE_SUSPEITA || 0);
                const scorePercentual = score <= 1 ? score * 100 : score;

                return (
                  <tr
                    key={i}
                    onClick={() => setTransacaoSelecionada(row)}
                    className="cursor-pointer bg-white transition-all hover:bg-blue-50/60"
                  >
                    {temScore && (
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${getCorScore(
                            score
                          )}`}
                        >
                          {scorePercentual.toFixed(1)}%
                        </span>
                      </td>
                    )}

                    <td className="overflow-hidden px-4 py-4 align-middle">
                      <div
                        className="truncate font-bold text-slate-800"
                        title={row.NOME_TITULAR || 'Não Informado'}
                      >
                        {row.NOME_TITULAR || 'Não Informado'}
                      </div>

                      <div className="mt-0.5 truncate font-mono text-xs text-slate-400">
                        {row.CPF_CNPJ_TITULAR || 'S/ Doc'}
                      </div>
                    </td>

                    <td className="overflow-hidden px-4 py-4 align-middle">
                      <div
                        className="truncate font-mono font-medium text-slate-700"
                        title={formatarValor(row.VALOR_TRANSACAO)}
                      >
                        {formatarValor(row.VALOR_TRANSACAO)}
                      </div>
                    </td>

                    <td className="overflow-hidden px-4 py-4 align-middle">
                      <span
                        className={`block w-fit max-w-full truncate rounded-lg border px-3 py-1 text-xs font-bold ${getCorTipologia(
                          row.TIPOLOGIA_ORIGEM
                        )}`}
                        title={row.TIPOLOGIA_ORIGEM}
                      >
                        {row.TIPOLOGIA_ORIGEM || 'Desconhecido'}
                      </span>
                    </td>

                    <td className="overflow-hidden px-4 py-4 align-middle text-slate-600">
                      <div
                        className="truncate"
                        title={row.LOCAL_TRANSACAO_LIMPO}
                      >
                        <span className="font-medium">
                          {row.LOCAL_TRANSACAO_LIMPO || 'Não informado'}
                        </span>

                        {row.UF_FINAL && (
                          <span className="ml-1 text-slate-400">
                            ({row.UF_FINAL})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="z-30 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
          <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Legenda de Risco:
          </span>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-red-500 bg-red-400" />
            <span className="text-xs font-medium text-slate-600">
              Fronteira
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-blue-500 bg-blue-400" />
            <span className="text-xs font-medium text-slate-600">
              Mineração
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-purple-500 bg-purple-400" />
            <span className="text-xs font-medium text-slate-600">
              Rota Caipira
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-emerald-500 bg-emerald-400" />
            <span className="text-xs font-medium text-slate-600">
              Solimões
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-amber-500 bg-amber-400" />
            <span className="text-xs font-medium text-slate-600">
              Outro Risco
            </span>
          </div>
        </div>

        <div className="z-30 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              Mostrar
            </span>

            <select
              value={itensPorPagina}
              onChange={e => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 p-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span className="hidden text-sm font-medium text-slate-500 sm:inline">
              registos
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual(p => p - 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40 sm:px-4"
            >
              Anterior
            </button>

            <span className="hidden text-sm font-medium text-slate-600 sm:inline">
              Página <strong className="text-slate-900">{paginaAtual}</strong>{' '}
              de {totalPaginas}
            </span>

            <span className="text-sm font-medium text-slate-600 sm:hidden">
              {paginaAtual}/{totalPaginas}
            </span>

            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual(p => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40 sm:px-4"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {transacaoSelecionada && temaModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setTransacaoSelecionada(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.45)]"
            onClick={event => event.stopPropagation()}
          >
            <div
              className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${temaModal.gradient}`}
            />

            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 py-6">
              <div
                className={`absolute -right-24 -top-24 h-72 w-72 rounded-full ${temaModal.glow} blur-3xl`}
              />

              <div
                className={`absolute right-8 bottom-8 h-24 w-24 rounded-full bg-gradient-to-br ${temaModal.gradient} opacity-10 blur-2xl`}
              />

              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border text-3xl shadow-sm ring-8 ${temaModal.icon} ${temaModal.ring}`}
                  >
                    {temaModal.emoji}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Detalhes da transação
                    </p>

                    <h3 className="mt-1 max-w-2xl truncate text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                      {transacaoSelecionada.NOME_TITULAR || 'Não informado'}
                    </h3>

                    <p className="mt-2 font-mono text-sm font-bold text-slate-400">
                      {transacaoSelecionada.CPF_CNPJ_TITULAR || 'S/ documento'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-black ${temaModal.badge}`}
                      >
                        {transacaoSelecionada.TIPOLOGIA_ORIGEM ||
                          'Desconhecido'}
                      </span>

                      {transacaoSelecionada.SCORE_SUSPEITA !== undefined && (
                        <>
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${getCorScore(
                              Number(transacaoSelecionada.SCORE_SUSPEITA || 0)
                            )}`}
                          >
                            Score: {scoreFormatadoModal}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-black ${nivelScoreModal.classe}`}
                          >
                            Leitura: {nivelScoreModal.texto}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTransacaoSelecionada(null)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(92vh-180px)] overflow-y-auto p-6">
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <CardInfo
                  titulo="Valor movimentado"
                  destaque
                  valorGrande
                  valor={formatarValorCampo(
                    'VALOR_TRANSACAO',
                    transacaoSelecionada.VALOR_TRANSACAO
                  )}
                />

                <CardInfo
                  titulo="Localidade"
                  valor={`${
                    transacaoSelecionada.LOCAL_TRANSACAO_LIMPO ||
                    'Não informado'
                  }${
                    transacaoSelecionada.UF_FINAL
                      ? ` (${transacaoSelecionada.UF_FINAL})`
                      : ''
                  }`}
                />

                <CardInfo
                  titulo="Instituição"
                  valor={transacaoSelecionada.NOME_BANCO || 'Não informado'}
                />
              </div>

              {transacaoSelecionada.SCORE_SUSPEITA !== undefined && (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Leitura do score
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Classificação operacional do registro selecionado.
                      </p>
                    </div>

                    <span
                      className={`rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${nivelScoreModal.classe}`}
                    >
                      {nivelScoreModal.texto} • {scoreFormatadoModal}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${nivelScoreModal.barra}`}
                      style={{
                        width: `${Math.min(scorePercentualModal, 100)}%`
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <span>0%</span>
                    <span>{scorePercentualModal.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CardInfo
                  titulo="Documento"
                  valor={transacaoSelecionada.CPF_CNPJ_TITULAR || 'S/ documento'}
                />

                <CardInfo
                  titulo="Data da transação"
                  valor={transacaoSelecionada.DATA_TRANSACAO || 'Não informada'}
                />

                <CardInfo titulo="Agência / Conta">
                  <p className="break-words text-base font-black leading-snug text-slate-800">
                    {transacaoSelecionada.NUMERO_AGENCIA ||
                    transacaoSelecionada.NUMERO_CONTA
                      ? `${transacaoSelecionada.NUMERO_AGENCIA || 'S/ agência'} / ${
                          transacaoSelecionada.NUMERO_CONTA || 'S/ conta'
                        }`
                      : 'Não informado'}
                  </p>
                </CardInfo>

                <CardInfo
                  titulo="Destino"
                  valor={
                    transacaoSelecionada.LOCAL_DESTINO ||
                    transacaoSelecionada.LOCAL_DESTINO_LIMPO ||
                    'Não informado'
                  }
                />

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Resumo operacional
                  </p>

                  <p className="text-sm font-semibold leading-relaxed text-slate-600">
                    Transação vinculada à tipologia{' '}
                    <span className={`font-black ${temaModal.title}`}>
                      {transacaoSelecionada.TIPOLOGIA_ORIGEM ||
                        'não classificada'}
                    </span>
                    , movimentada em{' '}
                    <span className="font-black text-slate-800">
                      {transacaoSelecionada.LOCAL_TRANSACAO_LIMPO ||
                        'local não informado'}
                    </span>
                    {transacaoSelecionada.UF_FINAL
                      ? ` (${transacaoSelecionada.UF_FINAL})`
                      : ''}
                    , com valor de{' '}
                    <span className="font-black text-slate-900">
                      {formatarValorCampo(
                        'VALOR_TRANSACAO',
                        transacaoSelecionada.VALOR_TRANSACAO
                      )}
                    </span>
                    {transacaoSelecionada.SCORE_SUSPEITA !== undefined && (
                      <>
                        {' '}
                        e leitura de score{' '}
                        <span className={`font-black ${temaModal.title}`}>
                          {nivelScoreModal.texto} ({scoreFormatadoModal})
                        </span>
                      </>
                    )}
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Card com os principais dados da transação.
                </p>

                <button
                  type="button"
                  onClick={() => setTransacaoSelecionada(null)}
                  className={`rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 ${temaModal.gradient}`}
                >
                  Fechar detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
