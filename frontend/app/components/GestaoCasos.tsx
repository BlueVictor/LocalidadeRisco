'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatarValor } from '../utils/formatadores';

// Componente principal da página de Gestão de Casos
export default function GestaoCasos() {
  const [dados, setDados] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [busca, setBusca] = useState('');
  // Gerenciamento do estado do popup de download
  const [popupDownload, setPopupDownload] = useState<{
    tipo: 'sucesso' | 'erro';
    titulo: string;
    mensagem: string;
    arquivo?: string;
  } | null>(null);
  
  // Função para exibir o popup de download com informações sobre sucesso ou erro
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

  // Função para obter o ID do caso, utilizando CASO_ID ou uma combinação de CPF/CNPJ e nome do titular
  const getCasoId = (item: any) => {
    return (
      item.CASO_ID ||
      `${item.CPF_CNPJ_TITULAR || 'sem-documento'}__${
        item.NOME_TITULAR || 'sem-nome'
      }`
    );
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/casos')
      .then(res => res.json())
      .then(data => {
        const dataEditavel = data.map((item: any) => {
          return {
            ...item,
            STATUS_ANALISE: item.STATUS_ANALISE || 'Pendente',
            COMENTARIOS: item.COMENTARIOS || ''
          };
        });

        const ordenados = dataEditavel.sort(
          (a: any, b: any) =>
            Number(b.VALOR_TOTAL || 0) - Number(a.VALOR_TOTAL || 0)
        );

        setDados(ordenados);
      });
  }, []);

  // Função para lidar com alterações nos campos de status e comentários, atualizando o estado local e enviando a alteração para o backend
  const handleChange = (
    casoId: string,
    campo: string,
    valor: string
  ) => {
    const novosDados = dados.map(item => {
      if (getCasoId(item) !== casoId) return item;

      return {
        ...item,
        [campo]: valor
      };
    });

    setDados(novosDados);

    fetch('http://localhost:8000/api/auditoria/salvar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        caso_id: casoId,
        campo,
        valor
      })
    }).catch(() => {
      console.error('Erro ao salvar auditoria.');
    });
  };

  // Função para alternar a seleção de um caso, adicionando ou removendo o ID do caso da lista de selecionados
  const toggleSelecao = (casoId: string) => {
    setSelecionados(prev =>
      prev.includes(casoId)
        ? prev.filter(id => id !== casoId)
        : [...prev, casoId]
    );
  };

  // Função para baixar o CSV, enviando uma requisição ao backend para exportar os casos selecionados ou toda a base de auditoria
  const baixarCSV = async (apenasSelecionados = false) => {
    try {
      const response = await fetch('http://localhost:8000/api/casos/exportar/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selecionados: apenasSelecionados ? selecionados : []
        })
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.sucesso) {
        mostrarPopupDownload(
          'erro',
          'Falha na exportação',
          data.detail || 'Não foi possível exportar os casos.'
        );
        return;
      }
  
      mostrarPopupDownload(
        'sucesso',
        apenasSelecionados ? 'Casos selecionados exportados' : 'Base de auditoria exportada',
        'O arquivo foi salvo com sucesso na pasta Downloads.',
        data.arquivo
      );
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
  
      mostrarPopupDownload(
        'erro',
        'Erro inesperado',
        'Não foi possível exportar o arquivo de auditoria.'
      );
    }
  };

  // Função para obter a classe de estilo baseada no status do caso, retornando cores diferentes para cada status
  const getStatusCor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'Em Análise':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'Reportar COAF':
        return 'bg-red-50 text-red-700 border-red-200';

      case 'Falso Positivo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filtra os dados com base na busca do usuário, considerando o nome do titular e o CPF/CNPJ
  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      const termo = busca.toLowerCase();

      return (
        item.NOME_TITULAR?.toLowerCase().includes(termo) ||
        item.CPF_CNPJ_TITULAR?.toLowerCase().includes(termo)
      );
    });
  }, [dados, busca]);

  // Calcula o total de páginas com base no número de itens filtrados e itens por página, garantindo que haja pelo menos uma página
  const totalPaginas =
    Math.ceil(dadosFiltrados.length / itensPorPagina) || 1;

  // Calcula o índice inicial para a paginação, determinando quais itens devem ser exibidos na página atual
  const indexInicio = (paginaAtual - 1) * itensPorPagina;

  // Obtém os dados paginados, selecionando apenas os itens que devem ser exibidos na página atual
  const dadosPaginados = dadosFiltrados.slice(
    indexInicio,
    indexInicio + itensPorPagina
  );

  // Calcula o volume total somando os valores de todos os casos, garantindo que valores nulos ou indefinidos sejam tratados como zero
  const totalVolume = dados.reduce(
    (acc, item) => acc + Number(item.VALOR_TOTAL || 0),
    0
  );

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
                  Auditoria
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Gestão de{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Casos
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-slate-300">
                Auditoria de titulares suspeitos com controle de status,
                notas técnicas persistentes e exportação da base analisada.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Casos
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {dados.length.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/70">
                    Selecionados
                  </p>

                  <p className="mt-2 text-xl font-black text-emerald-300">
                    {selecionados.length}
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
                          R$ {formatarValor(totalVolume)}
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
                        Status
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        Persistente
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Notas
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Técnicas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="flex flex-col xl:flex-row justify-between gap-5 xl:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  🗂️
                </span>
                Dossiê de Titulares Suspeitos
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Status e notas são sincronizados automaticamente.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full lg:w-[340px]">
                <input
                  type="text"
                  placeholder="Buscar titular ou documento..."
                  value={busca}
                  onChange={e => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {selecionados.length > 0 && (
                  <button
                    onClick={() => baixarCSV(true)}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl"
                  >
                    Exportar ({selecionados.length})
                  </button>
                )}

                <button
                  onClick={() => baixarCSV(false)}
                  className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-slate-900 hover:to-black hover:shadow-xl"
                >
                  ⬇️ Exportar Base
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white px-6 py-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              {dadosFiltrados.length} casos encontrados
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
              {selecionados.length} selecionados
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              Página {paginaAtual} de {totalPaginas}
            </div>
          </div>

          <div className="lg:ml-auto flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Exibir
            </span>

            <select
              value={itensPorPagina}
              onChange={e => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="w-[64px] p-5"></th>
                <th className="p-5">Titular</th>
                <th className="p-5">Volume Financeiro</th>
                <th className="p-5">Status Operacional</th>
                <th className="p-5">Notas Técnicas</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {dadosPaginados.map((row, indexLocal) => {
                const globalIndex = indexInicio + indexLocal;
                const casoId = getCasoId(row);
                const isSelected = selecionados.includes(casoId);

                const rowKey = `row-${casoId}-${globalIndex}`;

                return (
                  <tr
                    key={rowKey}
                    className={`group transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-50/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="p-5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelecao(casoId)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                      />
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-base font-black text-slate-700 shadow-inner ring-1 ring-slate-200">
                          {row.NOME_TITULAR?.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div
                            className="truncate text-sm font-black text-slate-900"
                            title={row.NOME_TITULAR}
                          >
                            {row.NOME_TITULAR}
                          </div>

                          <div className="mt-1 truncate font-mono text-xs text-slate-400">
                            {row.CPF_CNPJ_TITULAR}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="text-base font-black text-slate-900">
                        R$ {formatarValor(row.VALOR_TOTAL)}
                      </div>

                      <div className="mt-2 inline-flex rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                        {row.QTD_TRANSACOES} transações
                      </div>
                    </td>

                    <td className="p-5">
                      <select
                        value={row.STATUS_ANALISE}
                        onChange={e =>
                          handleChange(
                            casoId,
                            'STATUS_ANALISE',
                            e.target.value
                          )
                        }
                        className={`w-full rounded-2xl border px-3 py-3 text-xs font-black outline-none transition-all focus:ring-4 focus:ring-blue-100 ${getStatusCor(
                          row.STATUS_ANALISE
                        )}`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Análise">Em Análise</option>
                        <option value="Reportar COAF">Reportar COAF</option>
                        <option value="Falso Positivo">
                          Falso Positivo
                        </option>
                      </select>
                    </td>

                    <td className="p-5">
                      <textarea
                        value={row.COMENTARIOS}
                        onChange={e =>
                          handleChange(
                            casoId,
                            'COMENTARIOS',
                            e.target.value
                          )
                        }
                        placeholder="Adicionar parecer técnico, justificativa ou observação operacional..."
                        rows={2}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/80 p-6 md:flex-row">
          <button
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(p => p - 1)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
          >
            ← Página Anterior
          </button>

          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.7)] animate-pulse" />

            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Página {paginaAtual} de {totalPaginas}
            </span>
          </div>

          <button
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(p => p + 1)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
          >
            Próxima Página →
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
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl shadow-sm ${
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
