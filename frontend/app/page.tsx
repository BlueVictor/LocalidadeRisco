'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import PainelKPIs from './components/PainelKPIs';
import PaginadorTabela from './components/PaginadorTabela';
import DashboardScoring from './components/DashboardScoring';
import GestaoCasos from './components/GestaoCasos';
import RankingsDashboard from './components/RankingsDashboard';
import InstrucoesCSV from './components/InstrucoesCSV';
import PainelExportacoes from './components/PainelExportacoes';

// Importação dinâmica para componentes que dependem de bibliotecas
const MapaRisco = dynamic(() => import('./components/MapaRisco'), {
  ssr: false
});

// Importação dinâmica para o visualizador de grafo
const VisualizadorGrafo = dynamic(
  () => import('./components/VisualizadorGrafo'),
  {
    ssr: false
  }
);

// Componente principal
export default function AppPrincipal() {
  // Estados principais
  const [arquivoEnviado, setArquivoEnviado] = useState(false);
  const [paginaAtiva, setPaginaAtiva] = useState('kpis');
  const [loading, setLoading] = useState(false);
 
  // Estados para dados da tabela e filtros
  const [dadosTabela, setDadosTabela] = useState<any[]>([]);
  const [valorMinimo, setValorMinimo] = useState<number>(0);
  const [dadosFiltrados, setDadosFiltrados] = useState<any[]>([]);
  const [atualizarMapas, setAtualizarMapas] = useState<number>(0);

  // Função para lidar com o upload do arquivo CSV
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);

    const formData = new FormData();

    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.sucesso) {
        setArquivoEnviado(true);
      } else {
        alert('Erro: ' + data.erro);
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (arquivoEnviado) {
      fetch('http://localhost:8000/api/tabela')
        .then(res => res.json())
        .then(data => setDadosTabela(data));
    }
  }, [arquivoEnviado]);

  // Filtra os dados da tabela com base no valor mínimo definido pelo usuário
  useEffect(() => {
    if (dadosTabela.length > 0) {
      const filtrados = dadosTabela.filter(
        (item: any) =>
          Number(item.VALOR_TRANSACAO || 0) >= valorMinimo
      );

      setDadosFiltrados(filtrados);

      const timer = setTimeout(() => {
        fetch('http://localhost:8000/api/configurar-filtro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valor_minimo: valorMinimo
          })
        }).then(() => {
          setAtualizarMapas(Date.now());
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [dadosTabela, valorMinimo]);

  // Definição das seções da sidebar
  const menuSections = [
    {
      label: 'Análise',
      items: [
        {
          id: 'kpis',
          icon: '📂',
          title: 'Dados e Filtros',
          description: 'Base operacional'
        },
        {
          id: 'rankings',
          icon: '📊',
          title: 'Resumos e Rankings',
          description: 'Indicadores agregados'
        }
      ]
    },
    {
      label: 'Inteligência',
      items: [
        {
          id: 'grafo',
          icon: '🔗',
          title: 'Grafo de Conexões',
          description: 'Relacionamentos'
        },
        {
          id: 'scoring',
          icon: '🧮',
          title: 'Sistema de Scoring',
          description: 'Suspeição e risco'
        }
      ]
    },
    {
      label: 'Geolocalização',
      items: [
        {
          id: 'mapa_tipologias',
          icon: '🗺️',
          title: 'Mapa de Tipologias',
          description: 'Cidades e zonas'
        },
        {
          id: 'mapa_conexoes',
          icon: '📍',
          title: 'Grafo Geográfico',
          description: 'Rotas e conexões'
        }
      ]
    },
    {
      label: 'Ação',
      items: [
        {
          id: 'casos',
          icon: '🕵️',
          title: 'Gestão de Casos',
          description: 'Auditoria técnica'
        },
        {
          id: 'exportacoes',
          icon: '📄',
          title: 'Relatórios PDF',
          description: 'Bases e relatórios'
        }
      ]
    }
  ];

  // Mapeamento de títulos e subtítulos para cada página
  const pageTitles: Record<string, string> = {
    kpis: 'Dados Detalhados e Indicadores',
    rankings: 'Resumos e Rankings',
    grafo: 'Análise de Conexões em Grafo',
    scoring: 'Ranking de Suspeição',
    mapa_tipologias: 'Mapa de Cidades por Tipologia',
    mapa_conexoes: 'Grafo Geográfico',
    casos: 'Gestão e Auditoria de Casos',
    exportacoes: 'Exportação de Relatórios e Bases de Dados'
  };

  const pageSubtitles: Record<string, string> = {
    kpis: 'Base filtrada, ajuste de corte financeiro e principais indicadores.',
    rankings: 'Ranking dos titulares, bancos, locais e tipologias.',
    grafo: 'Grafo de vínculos, agrupamentos e relações suspeitas entre entidades financeiras.',
    scoring: 'Priorização dos casos conforme a matriz de risco configurada.',
    mapa_tipologias: 'Distribuição territorial das ocorrências por tipologia.',
    mapa_conexoes: 'Visualização das rotas, conexões territoriais e zonas críticas de circulação financeira.',
    casos: 'Registro de status, pareceres técnicos e priorização de titulares sob auditoria.',
    exportacoes: 'Gere relatórios, matrizes de score e bases CSV para análise externa.'
  };

  // Renderização condicional com base no estado de envio do arquivo
  if (!arquivoEnviado) {
    return (
      <main className="min-h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.75)]" />

              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-700">
                PLD geográfica
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-6xl">
              Localidade
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                Risco
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">
              Sistema inteligente de monitoramento de transações suspeitas,
              análise territorial, scoring e gestão operacional de casos.
            </p>
          </div>
          
<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="relative h-[132px] overflow-hidden border-b border-slate-200 bg-slate-950 px-6">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

                <div className="relative z-10 flex h-full flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                      📖
                    </span>

                    <h2 className="text-xl font-black leading-none text-white">
                      Instruções de Formatação
                    </h2>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Confira o padrão esperado antes de enviar a base CSV.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <InstrucoesCSV />
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="relative h-[132px] overflow-hidden border-b border-slate-200 bg-slate-950 px-6">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

                <div className="relative z-10 flex h-full flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                      📤
                    </span>

                    <h3 className="text-xl font-black leading-none text-white">
                      Carregar Dados
                    </h3>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-400">
                    Selecione o ficheiro CSV com as transações para iniciar a
                    análise de risco.
                  </p>
                </div>
              </div>

              <div className="relative p-6">
                <div className="relative z-10">
                  <div className="rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-all hover:border-blue-300 hover:bg-blue-50">
                    <span className="text-5xl">📁</span>

                    <div className="mt-6 flex justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus-within:outline-none focus-within:ring-4 focus-within:ring-blue-500/20"
                      >
                        <span>Procurar Ficheiro CSV</span>

                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleUpload}
                          disabled={loading}
                        />
                      </label>
                    </div>

                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      Apenas ficheiros delimitados por ponto e vírgula (;)
                    </p>
                  </div>

                  {loading && (
                    <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-black text-blue-700">
                      <span className="text-xl">⚙️</span>
                      Processando motor de regras e algoritmos...
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-lg font-black text-slate-900">
                        CSV
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Entrada
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-lg font-black text-slate-900">
                        PLD
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Regras
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                      <p className="text-lg font-black text-slate-900">
                        Scoring
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Análise
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <aside className="relative flex w-[292px] shrink-0 flex-col overflow-hidden bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-28 -right-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute bottom-20 -left-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>

        <div className="relative z-10 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl shadow-inner shadow-white/5">
              🛰️
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-blue-400">Localidade</span>
                Risco
              </h1>

              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Hub
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Base utilizada
                </p>

                <p className="mt-1 text-lg font-black text-emerald-300">
                  Carregada
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                ✓
              </span>
            </div>
          </div>
        </div>

        <nav className="relative z-10 flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {menuSections.map(section => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                {section.label}
              </p>

              <div className="space-y-1.5">
                {section.items.map(item => {
                  const ativo = paginaAtiva === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setPaginaAtiva(item.id)}
                      className={`group relative w-full overflow-hidden rounded-2xl px-3.5 py-3 text-left transition-all duration-300 ${
                        ativo
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {ativo && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
                      )}

                      {!ativo && (
                        <div className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-transparent transition-all group-hover:bg-blue-400/70" />
                      )}

                      <div className="relative z-10 flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg transition-all ${
                            ativo
                              ? 'bg-white/15 shadow-inner shadow-white/10'
                              : 'bg-white/[0.05] group-hover:bg-blue-500/10'
                          }`}
                        >
                          {item.icon}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {item.title}
                          </p>

                          <p
                            className={`mt-0.5 truncate text-[11px] font-semibold ${
                              ativo
                                ? 'text-blue-100'
                                : 'text-slate-500 group-hover:text-slate-400'
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative z-10 border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Filtro Global
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">
                  R$ {valorMinimo.toLocaleString('pt-BR')}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Corte mínimo
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                🎚️
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main
        className="flex-1 overflow-y-scroll overflow-x-hidden bg-slate-100"
        style={{
          scrollbarGutter: 'stable'
        }}
      >
        <div className="mx-auto w-full max-w-[1920px] px-10 py-8">
          <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />

                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                  LocalidadeRisco
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                {pageTitles[paginaAtiva]}
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                {pageSubtitles[paginaAtiva]}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Base
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {dadosTabela.length.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">
                  Filtrados
                </p>

                <p className="mt-1 text-lg font-black text-blue-700">
                  {dadosFiltrados.length.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  Status
                </p>

                <p className="mt-1 text-lg font-black text-emerald-700">
                  Atualizado
                </p>
              </div>
            </div>
          </header>

          {paginaAtiva === 'kpis' && (
            <section className="w-full animate-fade-in">
              <div className="mb-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                  <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      🎚️
                    </span>
                    Filtro financeiro de valor mínimo para análise
                  </h3>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Defina o valor mínimo para focar a análise nas transações de maior impacto.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Base original
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-900">
                        {dadosTabela.length.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">
                        Registos retidos
                      </p>

                      <p className="mt-2 text-2xl font-black text-blue-700">
                        {dadosFiltrados.length.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                        Corte atual
                      </p>

                      <p className="mt-2 text-2xl font-black text-emerald-700">
                        R$ {valorMinimo.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700">
                      <span className="text-slate-400">R$ 0</span>

                      <span className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 shadow-sm">
                        Mínimo: R$ {valorMinimo.toLocaleString('pt-BR')}
                      </span>

                      <span className="text-slate-400">R$ 100k+</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={valorMinimo}
                      onChange={e =>
                        setValorMinimo(Number(e.target.value))
                      }
                      className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              </div>

              <PainelKPIs dados={dadosFiltrados} />

              <div className="mt-10">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Tabela de Transações Suspeitas
                  </h3>

                  <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                    {dadosFiltrados.length} registos retidos
                  </span>
                </div>

                {dadosTabela.length > 0 ? (
                  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <PaginadorTabela dados={dadosFiltrados} />
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
                    A carregar dados da tabela...
                  </div>
                )}
              </div>
            </section>
          )}

          {paginaAtiva === 'rankings' && (
            <section className="w-full animate-fade-in">
              <RankingsDashboard />
            </section>
          )}

          {paginaAtiva === 'grafo' && (
            <section className="w-full animate-fade-in">
              <VisualizadorGrafo />
            </section>
          )}

          {paginaAtiva === 'scoring' && (
            <section className="w-full animate-fade-in">
              <DashboardScoring />
            </section>
          )}

          {paginaAtiva === 'mapa_tipologias' && (
            <section className="w-full animate-fade-in">
              <MapaRisco mostrarConexoes={false} />
            </section>
          )}

          {paginaAtiva === 'mapa_conexoes' && (
            <section className="w-full animate-fade-in">
              <MapaRisco
                mostrarConexoes={true}
                atualizar={atualizarMapas}
              />
            </section>
          )}

          {paginaAtiva === 'casos' && (
            <section className="w-full animate-fade-in">
              <GestaoCasos />
            </section>
          )}

          {paginaAtiva === 'exportacoes' && (
            <section className="w-full animate-fade-in">
              <PainelExportacoes />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}