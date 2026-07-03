'use client';

import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
  useMap
} from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Icone de alerta personalizado
const alertaIcon = new L.Icon({
  iconUrl:
    'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Cores para cada tipologia
const CORES_TEMA: Record<string, string> = {
  'Região de Fronteira': '#EF4444',
  'Região de Mineração': '#3B82F6',
  'Outra Região de Risco': '#F59E0B',
  'Rota Caipira': '#8B5CF6',
  'Rota do Solimões': '#10B981',
  'Baixo Risco': '#94A3B8'
};

// Corrigir o tamanho do mapa quando o componente é montado
function CorrigirTamanhoMapa() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Componente principal do mapa de risco
export default function MapaRisco({
  mostrarConexoes = false,
  atualizar = 0
}: {
  mostrarConexoes?: boolean;
  atualizar?: number;
}) {
  const [cidades, setCidades] = useState<any>({});
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    setMapaPronto(true);

    return () => {
      setMapaPronto(false);
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    const endpoint = mostrarConexoes
      ? '/api/mapa/conexoes'
      : '/api/mapa/tipologias';

    const method = mostrarConexoes ? 'POST' : 'GET';

    fetch(`http://localhost:8000${endpoint}`, { method })
      .then(res => res.json())
      .then(data => {
        if (mostrarConexoes) {
          setCidades(data.cidades || {});
          setConexoes(data.conexoes || []);
        } else {
          const formatado = (data || []).reduce(
            (acc: any, item: any) => {
              acc[item.cidade] = item;
              return acc;
            },
            {}
          );

          setCidades(formatado);
          setConexoes([]);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Erro no mapa:', err);
        setLoading(false);
      });
  }, [mostrarConexoes, atualizar]);

  // Contagem total de cidades e tipologias
  const totalCidades = Object.keys(cidades).length;
  const contagemTipologia: Record<string, number> = {};

  // Identificação de cidades críticas
  const cidadesCriticas: {
    nome: string;
    tipo: string;
  }[] = [];

  Object.entries(cidades).forEach(
    ([nome, info]: [string, any]) => {
      contagemTipologia[info.tipo] =
        (contagemTipologia[info.tipo] || 0) + 1;

      if (
        ['Rota Caipira', 'Rota do Solimões'].includes(
          info.tipo
        )
      ) {
        cidadesCriticas.push({
          nome,
          tipo: info.tipo
        });
      }
    }
  );

  // Ordenação das tipologias por quantidade
  const tipologiasOrdenadas = Object.entries(
    contagemTipologia
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">

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
                  Monitoramento Territorial
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Análise{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Geográfica
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-slate-300">
                Monitoramento territorial e zonas prioritárias
                de risco financeiro com visão dinâmica por tipologia.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Cidades
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {totalCidades.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-red-300/70">
                    Alertas
                  </p>

                  <p className="mt-2 text-xl font-black text-red-300">
                    {cidadesCriticas.length}
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
                          Mapa Operacional
                        </p>

                        <h3 className="mt-2 truncate text-xl font-black text-white">
                          Brasil
                        </h3>
                      </div>

                      <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-200">
                        🗺️
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Modo
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-cyan-300">
                        {mostrarConexoes ? 'Conexões' : 'Tipologias'}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-inner shadow-white/5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Risco
                      </p>

                      <p className="mt-2 truncate text-xl font-black text-indigo-300">
                        Dinâmico
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.45fr)_360px] gap-6">
        <div className="relative min-h-[760px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm 2xl:min-h-[1018px]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    🗺️
                  </span>
                  Mapa Operacional
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Distribuição geográfica.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  {mostrarConexoes ? 'MODO CONEXÕES' : 'MODO TIPOLOGIAS'}
                </div>

                {mostrarConexoes && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                    {conexoes.length} conexões
                  </div>
                )}

                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-black text-red-700">
                  {cidadesCriticas.length} alertas
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white/85 backdrop-blur-md">
              <div className="relative mb-5">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Carregando geolocalizações...
              </p>
            </div>
          )}

          <div className="relative z-0 h-[760px] 2xl:h-[1018px]">
            {mapaPronto && (
              <MapContainer
                key={`mapa-risco-${mostrarConexoes ? 'conexoes' : 'tipologias'}-${atualizar}`}
                center={[-15.78, -47.88]}
                zoom={4.5}
                style={{
                  height: '100%',
                  width: '100%'
                }}
              >
                <CorrigirTamanhoMapa />

                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />

                {mostrarConexoes &&
                  conexoes.map((link, idx) => {
                    const isCritica = [
                      'Rota Caipira',
                      'Rota do Solimões'
                    ].includes(link.tipo);

                    return (
                      <Polyline
                        key={`link-${idx}`}
                        positions={[
                          link.origem,
                          link.destino
                        ]}
                        pathOptions={{
                          color:
                            CORES_TEMA[link.tipo] ||
                            '#94A3B8',
                          weight: isCritica ? 4 : 2,
                          opacity: isCritica ? 0.85 : 0.45,
                          dashArray: isCritica
                            ? undefined
                            : '6 6'
                        }}
                      />
                    );
                  })}

                {Object.entries(cidades).map(
                  ([nome, info]: [string, any]) => {
                    const isCritica = [
                      'Rota Caipira',
                      'Rota do Solimões'
                    ].includes(info.tipo);

                    const position: [number, number] = [
                      info.lat,
                      info.lon
                    ];

                    const corPonto =
                      CORES_TEMA[info.tipo] ||
                      '#94A3B8';

                    if (isCritica) {
                      return (
                        <Marker
                          key={`marker-${nome}`}
                          position={position}
                          icon={alertaIcon}
                        >
                          <Tooltip className="rounded-xl border-0 shadow-xl">
                            <div className="font-bold text-slate-800">
                              ⚠️ {nome}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {info.tipo}
                            </div>
                          </Tooltip>
                        </Marker>
                      );
                    }

                    return (
                      <CircleMarker
                        key={`circle-${nome}`}
                        center={position}
                        radius={7}
                        pathOptions={{
                          color: '#fff',
                          weight: 2,
                          fillColor: corPonto,
                          fillOpacity: 0.9
                        }}
                      >
                        <Tooltip className="rounded-xl border-0 shadow-xl">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  corPonto
                              }}
                            />

                            {nome}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {info.tipo}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  }
                )}
              </MapContainer>
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 z-[1000] hidden max-w-[92%] -translate-x-1/2 items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-xl xl:flex xl:flex-wrap">
            <div className="mr-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-900" />

              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
                Legenda
              </span>
            </div>

            {Object.entries(CORES_TEMA).map(([label, color]) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div
                  className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
                  style={{
                    backgroundColor: color
                  }}
                />

                <span className="whitespace-nowrap text-[11px] font-bold text-slate-600">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  📊
                </span>
                Visão Territorial
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Indicadores operacionais em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Mapeadas
                </p>

                <h3 className="mt-2 text-3xl font-black text-blue-700">
                  {totalCidades}
                </h3>
              </div>

              <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                  Críticas
                </p>

                <h3 className="mt-2 text-3xl font-black text-red-700">
                  {cidadesCriticas.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  📈
                </span>
                Densidade por Tipologia
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Distribuição percentual das ocorrências.
              </p>
            </div>

            <div className="space-y-5 p-6">
              {tipologiasOrdenadas.map(
                ([tipo, count]) => {
                  const cor =
                    CORES_TEMA[tipo] || '#94A3B8';

                  const percentual =
                    totalCidades > 0
                      ? (count / totalCidades) * 100
                      : 0;

                  return (
                    <div key={tipo}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-black text-slate-700">
                          {tipo}
                        </span>

                        <span className="shrink-0 text-xs font-bold text-slate-500">
                          {count} ({percentual.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full transition-all duration-1000"
                          style={{
                            width: `${percentual}%`,
                            backgroundColor: cor
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}

              {tipologiasOrdenadas.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-bold text-slate-500">
                    Nenhuma tipologia carregada.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ALERTAS */}
          {cidadesCriticas.length > 0 && (
            <div className="overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 shadow-2xl">
              <div className="relative overflow-hidden border-b border-slate-800 px-6 py-5">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-cyan-500/10" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                      ⚠️
                    </span>
                    Monitoramento
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Rotas prioritárias em observação.
                  </p>
                </div>
              </div>

              <div className="max-h-[320px] space-y-3 overflow-y-auto p-6">
                {cidadesCriticas.map((cidade, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-red-500/30 hover:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-100">
                        {cidade.nome}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Zona crítica detectada
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-red-500/20 bg-red-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-red-300">
                      {cidade.tipo.replace(
                        'Rota ',
                        ''
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm xl:hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Legenda
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 p-6">
              {Object.entries(CORES_TEMA).map(([label, color]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div
                    className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
                    style={{
                      backgroundColor: color
                    }}
                  />

                  <span className="text-xs font-bold text-slate-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
