'use client';

import { useState, useEffect } from 'react';
import PaginadorTabela from './PaginadorTabela'; 

// Função para exibir o dashboard de scoring
export default function DashboardScoring() {
  const [pesos, setPesos] = useState({
    w_valor: 0.4,
    w_freq: 0.2,
    w_tipologia: 0.25,
    w_recencia: 0.1,
    w_unusual: 0.05
  });

  // Estado para armazenar os dados de scoring
  const [dadosScore, setDadosScore] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [limiteRegistros, setLimiteRegistros] = useState(500);


  useEffect(() => {
    setLoading(true);

    fetch('http://localhost:8000/api/scoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...pesos,
        limite: limiteRegistros
      })
    })
      .then(res => res.json())
      .then(data => {
        setDadosScore(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [pesos, limiteRegistros]);

  // Função para atualizar os pesos do modelo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPesos({
      ...pesos,
      [e.target.name]: parseFloat(e.target.value)
    });
  };


  // Estrutura dos cards de métricas
  const cardsMetricas = [
    {
      titulo: 'Pesos Ativos',
      valor: '5',
      cor: 'blue'
    },
    {
      titulo: 'Registos Processados',
      valor: dadosScore.length.toLocaleString('pt-BR'),
      cor: 'emerald'
    }
  ];

  // Estrutura dos sliders de ajuste de pesos
  const sliders = [
    {
      id: 'w_valor',
      label: 'Volume',
      icon: '💰',
      cor: 'from-blue-500 to-cyan-500',
      ring: 'focus:ring-blue-500/20'
    },
    {
      id: 'w_freq',
      label: 'Frequência',
      icon: '📈',
      cor: 'from-emerald-500 to-green-500',
      ring: 'focus:ring-emerald-500/20'
    },
    {
      id: 'w_tipologia',
      label: 'Tipologia',
      icon: '🧩',
      cor: 'from-violet-500 to-purple-500',
      ring: 'focus:ring-violet-500/20'
    },
    {
      id: 'w_recencia',
      label: 'Recência',
      icon: '⏱️',
      cor: 'from-orange-500 to-amber-500',
      ring: 'focus:ring-orange-500/20'
    },
    {
      id: 'w_unusual',
      label: 'Incomum',
      icon: '⚠️',
      cor: 'from-pink-500 to-rose-500',
      ring: 'focus:ring-pink-500/20'
    }
  ];

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
          <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 shadow-inner shadow-white/5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)] animate-pulse" />

                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-100">
                  Motor de Priorização
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl xl:text-6xl">
                Engine de{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Scoring
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Modelo ponderado com ajuste dinâmico de volume financeiro,
                frequência operacional, tipologia, recência e padrões incomuns.
              </p>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Registros
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {dadosScore.length.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Pesos
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    5
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
                          Modelo
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-white">
                          Ponderado
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        🧮
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Limite
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        {limiteRegistros.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Pesos
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Ativos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[390px_minmax(0,1fr)] 2xl:h-[820px] 2xl:items-stretch">
        <aside className="min-h-0 h-full">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      ⚙️
                    </span>
                    Calibração
                  </h3>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Ajuste dos coeficientes do modelo.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  5 pesos
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Volume Processado
                  </p>

                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                    Limite máximo analisado na matriz.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-black text-blue-700 shadow-sm">
                  {limiteRegistros.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map(valor => (
                  <button
                    key={valor}
                    onClick={() => setLimiteRegistros(valor)}
                    className={`rounded-2xl px-3 py-2.5 text-xs font-black transition-all duration-300 ${
                      limiteRegistros === valor
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {valor.toLocaleString('pt-BR')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-4 border-b border-slate-100 p-5">
              {cardsMetricas.map((card, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl border p-4 ${
                    card.cor === 'blue'
                      ? 'border-blue-100 bg-blue-50'
                      : 'border-emerald-100 bg-emerald-50'
                  }`}
                >
                  <p
                    className={`mb-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                      card.cor === 'blue'
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {card.titulo}
                  </p>

                  <p
                    className={`text-3xl font-black ${
                      card.cor === 'blue'
                        ? 'text-blue-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {card.valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {sliders.map(item => {
                const valor = pesos[item.id as keyof typeof pesos];

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base shadow-sm">
                          {item.icon}
                        </div>

                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {item.label}
                          </p>

                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Coeficiente
                          </p>
                        </div>
                      </div>

                      <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                        {(valor * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="relative h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${item.cor}`}
                        style={{
                          width: `${valor * 100}%`
                        }}
                      />

                      <input
                        type="range"
                        name={item.id}
                        min="0"
                        max="1"
                        step="0.05"
                        value={valor}
                        onChange={handleChange}
                        className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:outline-none focus:ring-4 ${item.ring}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-h-0 min-w-0 h-full">
          {loading ? (
            <div className="flex h-full min-h-[760px] w-full items-center justify-center rounded-[30px] border border-slate-200 bg-white shadow-sm 2xl:min-h-0">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-slate-200" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
                </div>

                <div className="text-center">
                  <p className="animate-pulse text-sm font-black uppercase tracking-[0.22em] text-blue-700">
                    Recalculando Scores
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    A aplicar nova matriz de ponderação...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[760px] min-w-0 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm 2xl:min-h-0">
              <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        📋
                      </span>
                      Matriz de Scores
                    </h3>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Resultado analítico calculado com os pesos atuais.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                    {dadosScore.length.toLocaleString('pt-BR')} registros
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <PaginadorTabela dados={dadosScore} />
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
