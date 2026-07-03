'use client';

import { useEffect, useState } from 'react';
import { formatarValor } from '../utils/formatadores';

export default function RankingsDashboard() {
  // Estado para armazenar os dados do ranking
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/rankings')
      .then(res => res.json())
      .then(setData)
      .catch(err =>
        console.error(
          'Erro ao carregar rankings:',
          err
        )
      );
  }, []);

  // Renderização condicional com base no estado dos dados
  if (!data)
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />

          <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 shadow-xl" />
        </div>

        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">
            Inteligência Analítica
          </p>

          <p className="mt-2 animate-pulse text-sm text-slate-400">
            Processando rankings operacionais...
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full space-y-8 pb-10">

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
          <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 shadow-inner shadow-white/5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)] animate-pulse" />

                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-100">
                  Inteligência Analítica
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl xl:text-6xl">
                Central de{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Rankings
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Ranking das tipologias, titulares, instituições financeiras e
                zonas críticas com maior incidência operacional.
              </p>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Tipologias
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {data.tipologias?.length || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Bancos
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {data.bancos?.length || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/70">
                    Status
                  </p>

                  <p className="mt-2 text-xl font-black text-emerald-300">
                    Atualizado
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[380px] justify-self-center xl:max-w-none xl:justify-self-end">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-blue-500/25 via-cyan-500/10 to-indigo-500/25 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.075] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_38%)]" />

                <div className="relative z-10 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                          Rankings
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-white">
                          Operacionais
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        📊
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Zonas
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        Top 10
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Titulares
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Top 10
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  📊
                </span>
                Distribuição por Tipologia
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Volume financeiro por origem geográfica.
              </p>
            </div>

            <div className="w-fit rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              {data.tipologias.length} categorias
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="p-5">
                  Tipologia
                </th>

                <th className="p-5 text-center">
                  Transações
                </th>

                <th className="p-5 text-right">
                  Volume Financeiro
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.tipologias.map(
                (t: any, i: number) => (
                  <tr
                    key={i}
                    className="group transition-all duration-200 hover:bg-slate-50/80"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 font-black text-blue-700 shadow-inner">
                          {i + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-black text-slate-900 transition-colors group-hover:text-blue-600">
                            {t.TIPOLOGIA_ORIGEM ||
                              'Desconhecido'}
                          </div>

                          <div className="mt-1 text-xs font-medium text-slate-400">
                            Categoria
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                        {t.qtd} registros
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="text-lg font-black text-slate-900">
                        R$ {formatarValor(t.total)}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    📍
                  </span>
                  Zonas Críticas
                </h3>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  Municípios com maior movimentação suspeita.
                </p>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700">
                Top 10
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {data.municipios.map(
              (m: any, i: number) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-100 hover:shadow-lg"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-red-600" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                          i === 0
                            ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white'
                            : i === 1
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                            : i === 2
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        #{i + 1}
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <span className="truncate text-base font-black text-slate-800 transition-colors group-hover:text-rose-600">
                          {m.LOCAL_TRANSACAO_LIMPO}
                        </span>

                        {m.TIPOLOGIA_ORIGEM && (
                          <span className="inline-flex h-6 shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-600">
                            {m.TIPOLOGIA_ORIGEM}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-base font-black text-slate-900">
                        R${' '}
                        {formatarValor(
                          m.VALOR_TRANSACAO
                        )}
                      </div>

                      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Volume
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {data.titulares &&
          data.titulares.length > 0 && (
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        👤
                      </span>
                      Maiores Movimentadores
                    </h3>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Titulares com maior volume operacional.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                    Top 10
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                {data.titulares.map(
                  (t: any, i: number) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600" />

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                              i === 0
                                ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white'
                                : i === 1
                                ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                                : i === 2
                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            #{i + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-black text-slate-800 transition-colors group-hover:text-indigo-600">
                              {
                                t.NOME_TITULAR
                              }
                            </div>

                            <div className="mt-1 text-xs font-medium text-slate-400">
                              Titular monitorado
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-base font-black text-slate-900">
                            R${' '}
                            {formatarValor(
                              t.VALOR_TRANSACAO
                            )}
                          </div>

                          <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Movimentado
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </div>

      {data.bancos &&
        data.bancos.length > 0 && (
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      🏦
                    </span>
                    Risco Institucional
                  </h3>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Ranking por instituição financeira.
                  </p>
                </div>

                <div className="w-fit rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  {data.bancos.length} bancos
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="p-5">
                      Instituição
                    </th>

                    <th className="p-5 text-center">
                      Alertas
                    </th>

                    <th className="p-5 text-right">
                      Volume Financeiro
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.bancos.map(
                    (b: any, i: number) => (
                      <tr
                        key={i}
                        className="group transition-all duration-200 hover:bg-slate-50/80"
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 font-black text-emerald-700 shadow-inner">
                              🏦
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-black text-slate-900 transition-colors group-hover:text-emerald-600">
                                {b.NOME_BANCO ||
                                  'Não Informado'}
                              </div>

                              <div className="mt-1 text-xs font-medium text-slate-400">
                                Instituição monitorada
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                            {b.qtd} alertas
                          </div>
                        </td>

                        <td className="p-5 text-right">
                          <div className="text-lg font-black text-slate-900">
                            R$ {formatarValor(b.total)}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </div>
  );
}
