'use client';

import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

export default function VisualizadorGrafo() {

  // Referências para o container do grafo e a instância da rede
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  // Estado para armazenar os parâmetros de física do grafo
  const [gravidade, setGravidade] = useState(-15000);
  const [centralGravity, setCentralGravity] = useState(0.7);
  const [springLength, setSpringLength] = useState(150);
  const [loading, setLoading] = useState(true);

  // Estado para armazenar as estatísticas do grafo
  const [estatisticas, setEstatisticas] = useState({
    nos: 0,
    arestas: 0
  });

  useEffect(() => {
    setLoading(true);

    fetch('http://localhost:8000/api/grafo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipologias: [
          'Região de Fronteira',
          'Região de Mineração',
          'Outra Região de Risco',
          'Rota Caipira',
          'Rota do Solimões'
        ]
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setEstatisticas({
            nos: data.nodes?.length || 0,
            arestas: data.edges?.length || 0
          });
        }

        if (
          containerRef.current &&
          data.nodes &&
          data.nodes.length > 0
        ) {
          const options = {
            layout: {
              improvedLayout: data.nodes.length < 200
            },

            interaction: {
              hideEdgesOnDrag: true,
              hideEdgesOnZoom: true,
              hover: true
            },

            physics: {
              stabilization: {
                enabled: true,
                iterations: 200,
                updateInterval: 50
              },

              barnesHut: {
                gravitationalConstant: gravidade,
                centralGravity: centralGravity,
                springLength: springLength,
                springConstant: 0.04,
                damping: 0.35,
                avoidOverlap: 0
              }
            }
          };

          if (networkRef.current) {
            networkRef.current.destroy();
          }

          networkRef.current = new Network(
            containerRef.current,
            data,
            options
          );

          networkRef.current.once(
            'stabilizationIterationsDone',
            () => {
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar grafo:', err);
        setLoading(false);
      });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [gravidade, centralGravity, springLength]);

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
                  Inteligência Relacional
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl xl:text-6xl">
                Grafo{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Criminal
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Análise relacional de entidades suspeitas, vínculos financeiros,
                agrupamentos operacionais e estruturas de risco.
              </p>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Nós
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {estatisticas.nos.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Conexões
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {estatisticas.arestas.toLocaleString('pt-BR')}
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
                          Rede Relacional
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-white">
                          Suspeitos
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        🕸️
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Física
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        Ajustável
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Interação
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Dinâmica
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  📊
                </span>
                Topologia da Rede
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Métricas da estrutura investigativa.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Nós
                </p>

                <h3 className="text-4xl font-black text-blue-700">
                  {estatisticas.nos}
                </h3>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">
                  Arestas
                </p>

                <h3 className="text-4xl font-black text-indigo-700">
                  {estatisticas.arestas}
                </h3>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  ⚙️
                </span>
                Motor de Física
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Ajuste o comportamento estrutural da rede.
              </p>
            </div>

            <div className="space-y-8 p-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                    Força de Repulsão
                  </label>

                  <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                    {gravidade}
                  </span>
                </div>

                <input
                  type="range"
                  min="-60000"
                  max="-5000"
                  value={gravidade}
                  onChange={e =>
                    setGravidade(Number(e.target.value))
                  }
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                />

                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>-60000</span>
                  <span>-5000</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                    Gravidade Central
                  </label>

                  <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                    {centralGravity.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={centralGravity}
                  onChange={e =>
                    setCentralGravity(Number(e.target.value))
                  }
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                />

                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>0</span>
                  <span>1</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                    Distância das Arestas
                  </label>

                  <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                    {springLength}px
                  </span>
                </div>

                <input
                  type="range"
                  min="100"
                  max="800"
                  value={springLength}
                  onChange={e =>
                    setSpringLength(Number(e.target.value))
                  }
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                />

                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>100px</span>
                  <span>800px</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="relative overflow-hidden border-b border-slate-800 px-6 py-5">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10" />

              <div className="relative z-10">
                <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                    🧠
                  </span>
                  Guia Operacional
                </h3>

                <p className="mt-2 text-sm font-medium text-slate-400">
                  Interações disponíveis para exploração do grafo.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {[
                {
                  icon: '🔎',
                  title: 'Zoom',
                  desc: 'Use o scroll do mouse para aprofundar a análise visual.'
                },
                {
                  icon: '🖐️',
                  title: 'Movimentação',
                  desc: 'Arraste o cenário para navegar pela rede criminal.'
                },
                {
                  icon: '🧩',
                  title: 'Organização',
                  desc: 'Reposicione os nós para separar agrupamentos.'
                },
                {
                  icon: '📌',
                  title: 'Detalhamento',
                  desc: 'Passe o mouse sobre os nós para visualizar informações.'
                },
                {
                  icon: '🧠',
                  title: 'Interpretação',
                  desc: 'Priorize nós maiores, pois eles indicam maior volume ou relevância na rede.'
                }

              ].map(item => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-3xl border border-white/5 bg-white/[0.035] p-4 transition-all hover:border-blue-400/20 hover:bg-white/[0.055]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl">
                    {item.icon}
                  </div>

                  <div>
                    <h4 className="mb-1 text-sm font-black text-white">
                      {item.title}
                    </h4>

                    <p className="text-xs leading-relaxed text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[850px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    🕸️
                  </span>
                  Rede Relacional
                </h3>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  Estrutura dinâmica de vínculos financeiros suspeitos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  {estatisticas.nos} nós
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                  {estatisticas.arestas} arestas
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md">
              <div className="relative mb-5">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 shadow-sm" />
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700 animate-pulse">
                A estabilizar vetores da rede...
              </p>
            </div>
          )}

          <div className="absolute right-6 top-32 z-20 hidden w-[330px] rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur-xl xl:block">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                📋
              </span>

              <h4 className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">
                Dicionário de Nós
              </h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg text-amber-600">
                  ⭐
                </div>

                <div>
                  <p className="text-sm font-black text-slate-800">
                    Tipologia de Risco
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Núcleo estratégico da estrutura criminosa ou região
                    operacional prioritária.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white">
                  <div className="h-4 w-4 rounded-full bg-slate-500" />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-800">
                    Titular Movimentador
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    O tamanho do nó representa o volume financeiro agregado das
                    transações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="h-full min-h-[850px] w-full cursor-grab bg-slate-50/70 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:34px_34px] active:cursor-grabbing"
          />
        </div>
      </div>
    </div>
  );
}
