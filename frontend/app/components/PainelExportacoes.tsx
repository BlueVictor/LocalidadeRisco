'use client';

import { useState, useEffect } from 'react';

export default function PainelExportacoes() {
  // Estados para controle de carregamento e dados 
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);
  const [allData, setAllData] = useState<any[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<string[]>([]);
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);
  const [colunasDisponiveis, setColunasDisponiveis] = useState<string[]>([]);
  const [colunasSelecionadas, setColunasSelecionadas] = useState<string[]>([]);

  // Popup de download
  const [popupDownload, setPopupDownload] = useState<{
    tipo: 'sucesso' | 'erro';
    titulo: string;
    mensagem: string;
    arquivo?: string;
  } | null>(null);

  // Função para mostrar o popup de download
  const mostrarPopupDownload = (
    tipo: 'sucesso' | 'erro',
    titulo: string,
    mensagem: string,
    arquivo?: string
  ) => {
    setPopupDownload({
      tipo,
      titulo,
      mensagem,
      arquivo
    });

    setTimeout(() => {
      setPopupDownload(null);
    }, 6000);
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/tabela')
      .then(res => res.json())
      .then(data => {
        setAllData(data);

        if (data.length > 0) {
          const cols = Object.keys(data[0]);
          setColunasDisponiveis(cols);
          setColunasSelecionadas(cols);

          const tipos = Array.from(
            new Set(data.map((d: any) => d.TIPOLOGIA_ORIGEM || 'Desconhecido'))
          ) as string[];

          setTiposDisponiveis(tipos.sort());
          setTiposSelecionados(tipos.sort());
        }
      });
  }, []);

  // Função para exportar dados em CSV
  const downloadCSV = (dados: any[], filename: string) => {
    if (dados.length === 0) {
      mostrarPopupDownload(
        'erro',
        'Nenhum dado para exportar',
        'Não existem registros disponíveis para gerar este arquivo.'
      );
      return;
    }

    // Gerar CSV com separador ponto e vírgula
    const colunas = Object.keys(dados[0]);
    const cabecalho = colunas.join(';') + '\n';

    const linhas = dados
      .map(row => {
        return colunas
          .map(col => {
            let val = row[col];

            if (val === null || val === undefined) val = '';

            let strVal = String(val).replace(/"/g, '""');

            if (
              strVal.includes(';') ||
              strVal.includes('\n') ||
              strVal.includes('\r')
            ) {
              strVal = `"${strVal}"`;
            }

            return strVal;
          })
          .join(';');
      })
      .join('\n');

    // Adiciona BOM (Byte Order Mark) para compatibilidade com Excel
    const blob = new Blob(['\uFEFF' + cabecalho + linhas], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
 
  // Funções para baixar arquivos PDF e CSV
  const baixarPDF = async () => {
    setLoadingPDF(true);

    try {
      const response = await fetch('http://localhost:8000/api/exportar/pdf/salvar');
      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        mostrarPopupDownload(
          'erro',
          'Falha ao gerar PDF',
          data.detail || 'Não foi possível gerar o relatório PDF.'
        );
        return;
      }

      mostrarPopupDownload(
        'sucesso',
        'Relatório gerado',
        'O relatório PDF foi salvo com sucesso na pasta Downloads.',
        data.arquivo
      );
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      mostrarPopupDownload(
        'erro',
        'Erro inesperado',
        'Não foi possível gerar o relatório PDF.'
      );
    } finally {
      setLoadingPDF(false);
    }
  };

  // Função para baixar CSV de scores
  const baixarCSVScores = async () => {
    setLoadingScores(true);

    try {
      const pesosPadrao = {
        w_valor: 0.4,
        w_freq: 0.2,
        w_tipologia: 0.25,
        w_recencia: 0.1,
        w_unusual: 0.05,
        limite: 500
      };

      const response = await fetch('http://localhost:8000/api/exportar/scores/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pesosPadrao)
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        mostrarPopupDownload(
          'erro',
          'Falha ao gerar CSV',
          data.detail || 'Não foi possível gerar a matriz de score.'
        );
        return;
      }

      mostrarPopupDownload(
        'sucesso',
        'Matriz exportada',
        'O CSV de scores foi salvo com sucesso na pasta Downloads.',
        data.arquivo
      );
    } catch (error) {
      console.error('Erro no Score:', error);
      mostrarPopupDownload(
        'erro',
        'Erro inesperado',
        'Não foi possível gerar o CSV de scores.'
      );
    } finally {
      setLoadingScores(false);
    }
  };

  // Função para baixar CSV de titulares suspeitos
  const baixarCSVTitulares = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/exportar/titulares/salvar');
      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        mostrarPopupDownload(
          'erro',
          'Falha ao gerar planilha',
          data.detail || 'Não foi possível gerar a planilha de titulares.'
        );
        return;
      }

      mostrarPopupDownload(
        'sucesso',
        'Planilha exportada',
        'A planilha de titulares suspeitos foi salva com sucesso na pasta Downloads.',
        data.arquivo
      );
    } catch (error) {
      console.error('Erro ao gerar titulares:', error);
      mostrarPopupDownload(
        'erro',
        'Erro inesperado',
        'Não foi possível gerar a planilha de titulares.'
      );
    }
  };

  // Função para baixar CSV filtrado
  const baixarCSVFiltrado = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/exportar/filtrado/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipologias: tiposSelecionados,
          colunas: colunasSelecionadas
        })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        mostrarPopupDownload(
          'erro',
          'Falha ao gerar CSV',
          data.detail || 'Não foi possível gerar o CSV filtrado.'
        );
        return;
      }

      mostrarPopupDownload(
        'sucesso',
        'CSV filtrado exportado',
        'O arquivo filtrado foi salvo com sucesso na pasta Downloads.',
        data.arquivo
      );
    } catch (error) {
      console.error('Erro ao gerar CSV filtrado:', error);
      mostrarPopupDownload(
        'erro',
        'Erro inesperado',
        'Não foi possível gerar o CSV filtrado.'
      );
    }
  };

  // Função para alternar seleção de itens em uma lista
  const toggleItem = (
    lista: string[],
    setLista: any,
    item: string
  ) => {
    if (lista.includes(item)) {
      setLista(lista.filter(i => i !== item));
    } else {
      setLista([...lista, item]);
    }
  };

  // Definição dos cards de exportação
  const cards = [
    {
      icon: '📑',
      title: 'Relatório PDF',
      description: 'Documento com gráficos, mapas e rankings.',
      button: loadingPDF ? 'Gerando...' : 'Baixar Relatório',
      action: baixarPDF,
      loading: loadingPDF,
      style: 'from-rose-500 to-red-600',
      iconStyle: 'bg-rose-50 text-rose-600 border-rose-100',
      hover: 'hover:shadow-rose-100'
    },
    {
      icon: '🧮',
      title: 'Matriz de Score',
      description:
        'Exportação com score baseado na matriz de risco atual.',
      button: loadingScores ? 'Calculando...' : 'Baixar CSV',
      action: baixarCSVScores,
      loading: loadingScores,
      style: 'from-slate-700 to-slate-950',
      iconStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      hover: 'hover:shadow-slate-200'
    },
    {
      icon: '👤',
      title: 'Titulares Suspeitos',
      description:
        'Planilha agregada por titular com zonas e tipologias mais frequentes.',
      button: 'Exportar Planilha',
      action: baixarCSVTitulares,
      loading: false,
      style: 'from-emerald-500 to-green-600',
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      hover: 'hover:shadow-emerald-100'
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
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-8 xl:gap-12 items-center">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 shadow-inner shadow-white/5 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)] animate-pulse" />

                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-100">
                  Central de Exportações
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Central de{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Exportações
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-slate-300">
                Baixe relatórios inteligentes, exporte bases financeiras com métricas de scoring,
                gere planilhas de titulares suspeitos e produza análises avançadas com filtros dinâmicos.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Registros
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {allData.length.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Tipologias
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {tiposDisponiveis.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/70">
                    Formatos
                  </p>

                  <p className="mt-2 text-xl font-black text-emerald-300">
                    CSV / PDF
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
                          Relatório
                        </p>

                        <h3 className="mt-2 truncate text-lg font-black text-white">
                          PLD
                        </h3>
                      </div>

                      <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        📑
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Score
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        Atualizado
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Filtros
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Dinâmicos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.hover}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.style}`} />

            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
              <div>
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-sm transition-transform duration-300 group-hover:scale-105 ${card.iconStyle}`}
                >
                  {card.icon}
                </div>

                <h3 className="text-xl font-black tracking-tight text-slate-900 mb-2">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <button
                onClick={card.action}
                disabled={card.loading}
                className={`mt-8 w-full rounded-2xl py-3.5 text-sm font-black text-white bg-gradient-to-r ${card.style} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {card.button}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  🎛️
                </span>
                Exportação Personalizada
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Filtre as tipologias e escolha as colunas antes de exportar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 font-bold text-blue-700">
                {tiposSelecionados.length} tipologias
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 font-bold text-violet-700">
                {colunasSelecionadas.length} colunas
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-black text-slate-800">
                Tipologias
              </label>

              <button
                onClick={() => setTiposSelecionados(tiposDisponiveis)}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
              >
                Selecionar todas
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="grid grid-cols-1 gap-2">
                {tiposDisponiveis.map(tipo => (
                  <label
                    key={tipo}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 transition-all hover:border-blue-200 hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={tiposSelecionados.includes(tipo)}
                      onChange={() =>
                        toggleItem(
                          tiposSelecionados,
                          setTiposSelecionados,
                          tipo
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    <span className="truncate text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                      {tipo}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-black text-slate-800">
                Colunas
              </label>

              <button
                onClick={() => setColunasSelecionadas(colunasDisponiveis)}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100"
              >
                Selecionar todas
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="grid grid-cols-1 gap-2">
                {colunasDisponiveis.map(col => (
                  <label
                    key={col}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 transition-all hover:border-violet-200 hover:bg-violet-50"
                  >
                    <input
                      type="checkbox"
                      checked={colunasSelecionadas.includes(col)}
                      onChange={() =>
                        toggleItem(
                          colunasSelecionadas,
                          setColunasSelecionadas,
                          col
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                    />

                    <span className="truncate text-sm font-semibold text-slate-700 group-hover:text-violet-700">
                      {col}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-500">
            Exportação com filtros personalizados.
          </div>

          <button
            onClick={baixarCSVFiltrado}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
          >
            ⬇️ Baixar CSV Filtrado
          </button>
        </div>
      </div>

      {popupDownload && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[420px] max-w-[calc(100vw-2rem)] animate-[downloadPopup_0.28s_ease-out]">
          <div
            className={`relative overflow-hidden rounded-[30px] border bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)] ${
              popupDownload.tipo === 'sucesso'
                ? 'border-emerald-200'
                : 'border-rose-200'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1.5 ${
                popupDownload.tipo === 'sucesso'
                  ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
                  : 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500'
              }`}
            />

            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

            <div className="relative z-10 p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border text-2xl shadow-sm ${
                    popupDownload.tipo === 'sucesso'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                      : 'border-rose-100 bg-rose-50 text-rose-600'
                  }`}
                >
                  {popupDownload.tipo === 'sucesso' ? '✅' : '⚠️'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black tracking-tight text-slate-900">
                        {popupDownload.titulo}
                      </h4>

                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {popupDownload.mensagem}
                      </p>
                    </div>

                    <button
                      onClick={() => setPopupDownload(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  {popupDownload.arquivo && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Local do arquivo
                      </p>

                      <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-700">
                        {popupDownload.arquivo}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full animate-[downloadProgress_6s_linear_forwards] rounded-full ${
                        popupDownload.tipo === 'sucesso'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                          : 'bg-gradient-to-r from-rose-500 to-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes downloadPopup {
              from {
                opacity: 0;
                transform: translateY(18px) scale(0.96);
              }

              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes downloadProgress {
              from {
                width: 100%;
              }

              to {
                width: 0%;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
