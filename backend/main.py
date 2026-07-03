from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import io
import re
import os
import json
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import itertools
import networkx as nx
from geopy.distance import geodesic
from pydantic import BaseModel
import mlflow
from mlflow_caixinhas import (configurar_mlflow, child_run, hash_bytes,log_dataframe_profile, log_dataframe_artifact, log_json_artifact,log_params_safe, log_metrics_safe, log_exception)
import sys
import tempfile
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from auditoria import detectar_smurfing
from classificadores import classificar_local_parcial
from scoring import compute_suspicion_score
from pdf import gerar_pdf
from formatadores import remover_acentos
from mapa_grafo_cidades import limpar_nome_cidade, obter_lat_lon as obter_lat_lon_avancado
from mapa import obter_lat_lon as obter_lat_lon_simples
from municipios import (municipios_fronteira, municipios_mineracao, municipios_risco, rota_caipira, rota_solimoes)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = FastAPI(title="LocalidadeRisco")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SESSAO_DB = {"df": None, "df_suspeitas": None, "mlflow_parent_run_id": None}
CACHE_IBGE = None

# Função para obter o caminho de dados da aplicação, criando diretório se necessário
def app_data_path(filename: str) -> str:
    base_dir = os.getenv("APP_DATA_DIR")
    if base_dir:
        pasta = Path(base_dir).expanduser().resolve()
    else:
        pasta = Path(os.getenv("LOCALAPPDATA", tempfile.gettempdir())) / "LocalidadeRisco"
    pasta.mkdir(parents=True, exist_ok=True)
    return str(pasta / filename)

# Função para obter o caminho de downloads do usuário, criando diretório se necessário
def downloads_path(filename: str) -> str:
    pasta = Path.home() / "Downloads"

    if not pasta.exists():
        pasta = Path(os.getenv("USERPROFILE", tempfile.gettempdir())) / "Downloads"

    pasta.mkdir(parents=True, exist_ok=True)

    return str(pasta / filename)

AUDITORIA_FILE = app_data_path("auditoria_casos.json")

# Função para gerar um ID único de caso com base no nome do titular e CPF/CNPJ
def gerar_caso_id(nome_titular, cpf_cnpj):
    return f"{cpf_cnpj or 'sem-documento'}__{nome_titular or 'sem-nome'}"

# Função para carregar auditoria de casos a partir de arquivo JSON
def carregar_auditoria():
    if not os.path.exists(AUDITORIA_FILE):
        return {}

    try:
        with open(AUDITORIA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

# Função para salvar auditoria de casos em arquivo JSON
def salvar_auditoria_local(dados):
    with open(AUDITORIA_FILE, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

# Modelo Pydantic para os pesos do scoring
class PesosScoring(BaseModel):
    w_valor: float = 0.4
    w_freq: float = 0.2
    w_tipologia: float = 0.25
    w_recencia: float = 0.1
    w_unusual: float = 0.05
    limite: int = 500

# Modelo Pydantic para o filtro global
class FiltroGlobal(BaseModel):
    valor_minimo: float

# Função para obter a base de municípios do IBGE, com cache para evitar múltiplas requisições
def obter_base_ibge():
    global CACHE_IBGE
    if CACHE_IBGE is not None:
        return CACHE_IBGE
        
    mapa_ibge = {}
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    try:
        url = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
        resp = session.get(url, timeout=10)
        if resp.status_code == 200:
            dados = resp.json()
            for mun in dados:
                if not isinstance(mun, dict): continue
                nome = mun.get("nome", "")
                if not nome: continue
                
                nome_limpo = remover_acentos(nome).upper().strip()
                uf = None
                
                micro = mun.get("microrregiao")
                if isinstance(micro, dict):
                    meso = micro.get("mesorregiao")
                    if isinstance(meso, dict):
                        uf_dict = meso.get("UF")
                        if isinstance(uf_dict, dict):
                            uf = uf_dict.get("sigla")
                
                if not uf:
                    imediata = mun.get("regiao-imediata")
                    if isinstance(imediata, dict):
                        inter = imediata.get("regiao-intermediaria")
                        if isinstance(inter, dict):
                            uf_dict = inter.get("UF")
                            if isinstance(uf_dict, dict):
                                uf = uf_dict.get("sigla")
                
                if uf: mapa_ibge[nome_limpo] = uf
    except Exception as e:
        print(f"Aviso IBGE: Falha na rede ({e}). Usando lista local.")
        
    CACHE_IBGE = mapa_ibge
    return mapa_ibge

# Função para obter a base de municípios do IBGE com cache
def carregar_e_processar(file_bytes):
    try:
        try:
            content = file_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            content = file_bytes.decode('latin1', errors='ignore')

        primeira_linha = content.split('\n')[0]
        separador = ";" if ";" in primeira_linha else ","

        df = pd.read_csv(io.StringIO(content), sep=separador, dtype=str)
        df.columns = df.columns.str.strip().str.upper()
        
        if "LOCAL_TRANSACAO" not in df.columns or "VALOR_TRANSACAO" not in df.columns:
            return None, "Colunas obrigatórias ausentes."

        BASE_IBGE = obter_base_ibge()

        todas_nossas_cidades = municipios_fronteira + municipios_mineracao + municipios_risco + rota_caipira + rota_solimoes
        
        dicionario_alvo = {}
        for c in todas_nossas_cidades:
            c_norm = remover_acentos(c).upper().replace('-', ' ').replace("'", " ").strip()
            dicionario_alvo[c_norm] = c.strip() 
            
        cidades_ordenadas = sorted(list(dicionario_alvo.keys()), key=len, reverse=True)
        padrao_alvo = r'\b(' + '|'.join([re.escape(c) for c in cidades_ordenadas]) + r')\b'
        radar_regex = re.compile(padrao_alvo)

        # Função para extrair a cidade do texto sujo, utilizando regex e dicionário de cidades
        def extrair_cidade_radar(texto_sujo):
            if pd.isna(texto_sujo): return "NÃO INFORMADO"
            texto = str(texto_sujo).upper().strip()
            
            if texto in ["INTERNET", "TAA", "AGENCIA", "ATM", "MOBILE", "APP", "TELEFONE"]:
                return "NÃO INFORMADO"
            
            texto_limpo = re.sub(r"^(?:TCX|TAA|ATM|CEF|TERMINAL CEF|AGENCIA|AG|PAGTO|PAG)[\-\s:]*", "", texto)
            texto_limpo = re.sub(r'\bB\s*R$', '', texto_limpo).strip()

            texto_norm = remover_acentos(texto_limpo).replace('-', ' ').replace("'", " ")
            texto_norm = re.sub(r'\s+', ' ', texto_norm).strip()
            
            matches = list(radar_regex.finditer(texto_norm))
            if matches:
                cidade_achada = matches[-1].group(1) 
                return dicionario_alvo[cidade_achada] 
                
            partes = re.split(r'\s{2,}', texto_limpo)
            if len(partes) > 1:
                candidato = partes[-1].strip()
                if len(candidato) <= 2 and len(partes) > 2:
                    candidato = partes[-2].strip()
                texto_limpo = candidato

            fallback = re.sub(r'\d+', '', texto_limpo)
            fallback = re.sub(r'[^\w\s]', '', fallback).strip()
            return fallback if len(fallback) > 2 else "NÃO INFORMADO"

        # Função para extrair a UF do texto sujo, utilizando base do IBGE e regex
        def extrair_uf(texto_sujo, cidade_limpa):
            chave = remover_acentos(str(cidade_limpa)).upper().strip()
            if BASE_IBGE and chave in BASE_IBGE: 
                return BASE_IBGE[chave]
            match = re.search(r'\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b', str(texto_sujo).upper())
            if match: return match.group(1)
            return "Não Informado"

        df["LOCAL_TRANSACAO_LIMPO"] = df["LOCAL_TRANSACAO"].apply(extrair_cidade_radar)
        df["UF_FINAL"] = df.apply(lambda r: extrair_uf(r["LOCAL_TRANSACAO"], r["LOCAL_TRANSACAO_LIMPO"]), axis=1)
        
        df["LOCAL_DESTINO_LIMPO"] = df["LOCAL_DESTINO"].astype(str).apply(remover_acentos).str.upper() if "LOCAL_DESTINO" in df.columns else ""
        
        df["VALOR_TRANSACAO"] = (
            df["VALOR_TRANSACAO"]
            .astype(str)
            .str.replace("R$", "", regex=False)
            .str.replace(".", "", regex=False)
            .str.replace(",", ".", regex=False)
        )
        df["VALOR_TRANSACAO"] = pd.to_numeric(df["VALOR_TRANSACAO"], errors='coerce').fillna(0)

        if "DATA_TRANSACAO" in df.columns:
            df["DATA_TRANSACAO"] = pd.to_datetime(df["DATA_TRANSACAO"], dayfirst=True, errors='coerce')

        df["TIPOLOGIA_ORIGEM"] = df["LOCAL_TRANSACAO_LIMPO"].apply(classificar_local_parcial)
        df["TIPOLOGIA_DESTINO"] = df["LOCAL_DESTINO_LIMPO"].apply(classificar_local_parcial)

        return df, None
    except Exception as e:
        return None, str(e)

# Modelo Pydantic para o payload do MLflow
class MLflowPayload(BaseModel):
    pesos: dict
    metricas: dict

@app.post("/api/mlflow/log")
# Rota para logar parâmetros e métricas no MLflow, criando uma run filha com base no run pai armazenado na sessão.
async def log_mlflow(payload: MLflowPayload):
    configurar_mlflow(app_data_path)
    parent_run_id = SESSAO_DB.get("mlflow_parent_run_id")

    with child_run("00_log_manual_frontend", parent_run_id=parent_run_id) as run:
        mlflow.set_tag("origem", "frontend")
        log_params_safe(payload.pesos, prefix="peso_")
        log_metrics_safe(payload.metricas)
        return {"run_id": run.info.run_id, "parent_run_id": parent_run_id}

@app.post("/api/upload")
# Rota para upload de arquivo CSV, processamento dos dados, classificação de suspeitas e logging no MLflow.
async def upload_csv(file: UploadFile = File(...), valor_minimo: float = 0):
    # Run pai = análise completa. Runs filhos = caixinhas do pipeline.
    configurar_mlflow(app_data_path)
    contents = await file.read()

    with mlflow.start_run(run_name=f"pipeline_pld__{file.filename or 'arquivo_csv'}") as parent_run:
        parent_run_id = parent_run.info.run_id
        SESSAO_DB["mlflow_parent_run_id"] = parent_run_id
        mlflow.set_tags({
            "app": "LocalidadeRisco",
            "pipeline": "PLD",
            "arquivo_nome": file.filename or "sem_nome",
        })
        log_params_safe({
            "valor_minimo": valor_minimo,
            "arquivo_nome": file.filename or "sem_nome",
            "arquivo_sha256": hash_bytes(contents),
        })
        log_metrics_safe({"arquivo_bytes": len(contents)})

        try:
            with child_run("01_ingestao_processamento"):
                df, erro = carregar_e_processar(contents)

                if erro:
                    raise ValueError(erro)

                log_dataframe_profile(df, "base_processada")
                log_dataframe_artifact(df, "amostra_base_processada.csv", artifact_path="amostras", max_rows=200)
                log_json_artifact({"colunas": list(df.columns)}, "colunas_processadas.json", artifact_path="schemas")

            with child_run("02_filtro_suspeitas"):
                df["SUSPEITA"] = df.apply(
                    lambda r: "Sim" if r["TIPOLOGIA_ORIGEM"] not in [
                        "Baixo Risco", "Desconhecido", "Local Não Informado", "NÃO INFORMADO"
                    ] and r["VALOR_TRANSACAO"] >= valor_minimo else "Não",
                    axis=1
                )

                df_suspeitas = df[df["SUSPEITA"] == "Sim"].copy()
                taxa_suspeita = len(df_suspeitas) / len(df) if len(df) else 0

                log_metrics_safe({
                    "total_transacoes": len(df),
                    "total_suspeitas": len(df_suspeitas),
                    "taxa_suspeita": taxa_suspeita,
                    "valor_total_suspeito": float(df_suspeitas["VALOR_TRANSACAO"].sum()) if not df_suspeitas.empty else 0,
                })
                log_dataframe_profile(df_suspeitas, "base_suspeitas")
                log_dataframe_artifact(df_suspeitas, "amostra_base_suspeitas.csv", artifact_path="amostras", max_rows=200)

            mlflow.log_metrics({
                "total_transacoes": len(df),
                "total_suspeitas": len(df_suspeitas),
                "taxa_suspeita": len(df_suspeitas) / len(df) if len(df) else 0,
            })

        except Exception as e:
            log_exception(e, context="upload_csv")
            raise HTTPException(status_code=400, detail=str(e))

    SESSAO_DB["df"] = df
    SESSAO_DB["df_suspeitas"] = df_suspeitas
    
    return {
        "sucesso": True,
        "total_transacoes": len(df),
        "total_suspeitas": len(SESSAO_DB["df_suspeitas"]),
        "mlflow_parent_run_id": parent_run_id,
    }

@app.post("/api/configurar-filtro")
# Rota para configurar o filtro global de suspeitas, recalculando a coluna "SUSPEITA" com base no valor mínimo fornecido e registrando métricas no MLflow.
async def configurar_filtro(payload: FiltroGlobal):
    df = SESSAO_DB.get("df")
    if df is None:
        raise HTTPException(status_code=400, detail="Dados não carregados.")

    configurar_mlflow(app_data_path)
    parent_run_id = SESSAO_DB.get("mlflow_parent_run_id")

    with child_run("02b_recalculo_filtro_global", parent_run_id=parent_run_id):
        log_params_safe({"valor_minimo": payload.valor_minimo})

        df["SUSPEITA"] = df.apply(
            lambda r: "Sim" if r["TIPOLOGIA_ORIGEM"] not in [
                "Baixo Risco", "Desconhecido", "Local Não Informado", "NÃO INFORMADO"
            ] and r["VALOR_TRANSACAO"] >= payload.valor_minimo else "Não",
            axis=1
        )
        
        SESSAO_DB["df_suspeitas"] = df[df["SUSPEITA"] == "Sim"].copy()
        log_dataframe_profile(SESSAO_DB["df_suspeitas"], "base_suspeitas_filtrada")

    return {"sucesso": True, "registos_retidos": len(SESSAO_DB["df_suspeitas"])}

@app.get("/api/kpis")
# Rota para obter os KPIs da base de suspeitas, incluindo total de transações, valor total e ticket médio.
async def get_kpis():
    df = SESSAO_DB.get("df_suspeitas")
    if df is None: return {"total_transacoes": 0, "valor_total": 0, "ticket_medio": 0}
    
    val_total = float(df["VALOR_TRANSACAO"].sum())
    total_tx = len(df)
    
    return {
        "total_transacoes": total_tx,
        "valor_total": val_total,
        "ticket_medio": val_total / total_tx if total_tx > 0 else 0
    }

@app.get("/api/tabela")
# Rota para obter a tabela de suspeitas em formato JSON, convertendo datas para string e preenchendo valores nulos.
async def get_tabela():
    df = SESSAO_DB.get("df_suspeitas")
    if df is None: return []
    df_json = df.fillna("").copy()
    if "DATA_TRANSACAO" in df_json.columns:
        df_json["DATA_TRANSACAO"] = df_json["DATA_TRANSACAO"].astype(str)
    return df_json.to_dict(orient="records")

@app.get("/api/rankings")
# Rota para obter rankings de tipologias, municípios, titulares e bancos com base na base de suspeitas, agregando valores e quantidades.
async def get_rankings():
    df = SESSAO_DB.get("df_suspeitas")
    if df is None or df.empty: return {"tipologias": [], "municipios": [], "titulares": [], "bancos": []}

    resumo_tipologia = df.groupby("TIPOLOGIA_ORIGEM", dropna=False).agg(
        qtd=("VALOR_TRANSACAO", "count"), 
        total=("VALOR_TRANSACAO", "sum")
    ).reset_index().sort_values("total", ascending=False).to_dict(orient="records")

    top_municipios = df.groupby("LOCAL_TRANSACAO_LIMPO").agg(
        VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum"),
        TIPOLOGIA_ORIGEM=("TIPOLOGIA_ORIGEM", "first")
    ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index().to_dict(orient="records")

    top_titulares = []
    if "NOME_TITULAR" in df.columns:
        top_titulares = df.groupby("NOME_TITULAR")["VALOR_TRANSACAO"].sum().sort_values(ascending=False).head(10).reset_index().to_dict(orient="records")

    top_bancos = []
    if "NOME_BANCO" in df.columns:
        top_bancos = df.groupby("NOME_BANCO", dropna=False).agg(
            qtd=("VALOR_TRANSACAO", "count"), 
            total=("VALOR_TRANSACAO", "sum")
        ).reset_index().sort_values("total", ascending=False).to_dict(orient="records")

    return {
        "tipologias": resumo_tipologia,
        "municipios": top_municipios,
        "titulares": top_titulares,
        "bancos": top_bancos
    }

@app.get("/api/casos")
# Rota para obter os casos agrupados por titular e CPF/CNPJ, incluindo valor total, quantidade de transações, status de análise e comentários da auditoria.
async def get_casos():
    df = SESSAO_DB.get("df_suspeitas")
    if df is None or df.empty:
        return []
    
    df_agrupado = df.groupby(["NOME_TITULAR", "CPF_CNPJ_TITULAR"], dropna=False).agg(
        VALOR_TOTAL=("VALOR_TRANSACAO", "sum"),
        QTD_TRANSACOES=("VALOR_TRANSACAO", "count")
    ).reset_index()

    auditoria = carregar_auditoria()

    df_agrupado["CASO_ID"] = df_agrupado.apply(
        lambda r: gerar_caso_id(r.get("NOME_TITULAR"), r.get("CPF_CNPJ_TITULAR")),
        axis=1
    )

    df_agrupado["STATUS_ANALISE"] = df_agrupado["CASO_ID"].apply(
        lambda caso_id: auditoria.get(caso_id, {}).get("STATUS_ANALISE", "Pendente")
    )

    df_agrupado["COMENTARIOS"] = df_agrupado["CASO_ID"].apply(
        lambda caso_id: auditoria.get(caso_id, {}).get("COMENTARIOS", "")
    )

    df_agrupado = df_agrupado.fillna("")
    
    return df_agrupado.to_dict(orient="records")


@app.post("/api/auditoria/salvar")
# Rota para salvar auditoria de casos, atualizando status de análise e comentários no arquivo JSON de auditoria.
async def salvar_auditoria_caso(payload: dict):
    caso_id = payload.get("caso_id")
    campo = payload.get("campo")
    valor = payload.get("valor", "")

    if not caso_id:
        raise HTTPException(status_code=400, detail="Caso inválido.")

    if campo not in ["STATUS_ANALISE", "COMENTARIOS"]:
        raise HTTPException(status_code=400, detail="Campo inválido.")

    auditoria = carregar_auditoria()

    if caso_id not in auditoria:
        auditoria[caso_id] = {}

    auditoria[caso_id][campo] = valor

    salvar_auditoria_local(auditoria)

    return {"sucesso": True}


@app.post("/api/casos/exportar")
# Rota para exportar casos selecionados ou a base completa de casos em formato CSV, retornando o arquivo como resposta.
async def exportar_casos(payload: dict):
    df = SESSAO_DB.get("df_suspeitas")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    casos = await get_casos()
    df_casos = pd.DataFrame(casos)

    if df_casos.empty:
        raise HTTPException(status_code=404, detail="Nenhum caso encontrado")

    selecionados = payload.get("selecionados", [])

    if selecionados:
        df_casos = df_casos[df_casos["CASO_ID"].isin(selecionados)]
        nome_arquivo = "casos_selecionados.csv"
    else:
        nome_arquivo = "base_completa_casos.csv"

    if df_casos.empty:
        raise HTTPException(status_code=404, detail="Nenhum caso selecionado")

    caminho = app_data_path(nome_arquivo)

    df_casos.to_csv(
        caminho,
        index=False,
        sep=";",
        encoding="utf-8-sig"
    )

    return FileResponse(
        caminho,
        filename=nome_arquivo,
        media_type="text/csv"
    )

@app.post("/api/scoring")
# Rota para calcular o scoring de suspeição com base nos pesos fornecidos, retornando os registros com maior pontuação e registrando métricas no MLflow.
async def post_scoring(pesos: PesosScoring):
    df = SESSAO_DB.get("df_suspeitas")
    if df is None: return []

    configurar_mlflow(app_data_path)
    parent_run_id = SESSAO_DB.get("mlflow_parent_run_id")

    with child_run("04_scoring_suspeicao", parent_run_id=parent_run_id) as run:
        log_params_safe(pesos.dict())
        
        df_scored = compute_suspicion_score(
            df, 
            w_valor=pesos.w_valor, 
            w_freq=pesos.w_freq, 
            w_tipologia=pesos.w_tipologia,
            w_recencia=pesos.w_recencia,
            w_unusual=pesos.w_unusual
        )
        
        df_top = (df_scored.sort_values("SCORE_SUSPEITA", ascending=False).head(pesos.limite).fillna(""))
        if "DATA_TRANSACAO" in df_top.columns:
            df_top["DATA_TRANSACAO"] = df_top["DATA_TRANSACAO"].astype(str)

        log_dataframe_profile(df_scored, "scores_completos")
        log_dataframe_profile(df_top, "scores_top")
        log_dataframe_artifact(df_top, "top_scores.csv", artifact_path="scoring", max_rows=int(pesos.limite))
        mlflow.set_tag("mlflow_child_run_id_scoring", run.info.run_id)
            
    return df_top.to_dict(orient="records")

@app.post("/api/grafo")
# Rota para gerar o grafo de conexões entre tipologias e titulares, retornando os nós e arestas para visualização.
async def post_grafo(payload: dict):
    tipologias = payload.get("tipologias", ["Região de Fronteira", "Região de Mineração", "Outra Região de Risco", "Rota Caipira", "Rota do Solimões"])
    df = SESSAO_DB.get("df_suspeitas")
    if df is None or df.empty: return {"nodes": [], "edges": []}
    
    cores_tipologias = {
        "Região de Fronteira": "#EF4444", 
        "Região de Mineração": "#3B82F6", 
        "Outra Região de Risco": "#F59E0B", 
        "Rota Caipira": "#8B5CF6", 
        "Rota do Solimões": "#10B981", 
        "Baixo Risco": "#94A3B8",
        "Desconhecido": "#A9A9A9"
    }
    
    nodes = []
    edges = []
    
    for tipo in tipologias:
        nodes.append({"id": tipo, "label": tipo, "group": "tipologia", "color": cores_tipologias.get(tipo, "#999999"), "shape": "star", "size": 45})
        
    df_filtrado = df[df["TIPOLOGIA_ORIGEM"].isin(tipologias)]
    
    df_agrupado = df_filtrado.groupby(["NOME_TITULAR", "TIPOLOGIA_ORIGEM"], dropna=False).agg(
        VALOR_TOTAL=("VALOR_TRANSACAO", "sum"),
        QTD_TX=("VALOR_TRANSACAO", "count")
    ).reset_index()
    
    for _, row in df_agrupado.iterrows():
        tipo_origem = row.get("TIPOLOGIA_ORIGEM", "Desconhecido")
        pessoa = row.get("NOME_TITULAR")
        if pd.isna(pessoa) or not str(pessoa).strip():
            pessoa = "Desconhecido"
            
        valor_total = row.get("VALOR_TOTAL", 0)
        qtd = row.get("QTD_TX", 0)
        
        id_pessoa = f"P_{pessoa}_{tipo_origem}"

        tamanho_bolha = max(12, min((valor_total ** 0.5) / 30, 110))
        valor_str = f"{valor_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        texto_qtd = f"{qtd} transação" if qtd == 1 else f"{qtd} transações"
        label_texto = f"{pessoa}\nR$ {valor_str} em {texto_qtd}"
        
        nodes.append({
            "id": id_pessoa, 
            "label": str(label_texto), 
            "group": "pessoa", 
            "color": cores_tipologias.get(tipo_origem, "#999999"), 
            "shape": "dot", 
            "size": tamanho_bolha
        })
        
        edges.append({"from": tipo_origem, "to": id_pessoa})
        
    return {"nodes": nodes, "edges": edges}

@app.get("/api/mapa/tipologias")
# Rota para obter informações de cidades e suas tipologias para visualização em mapa, incluindo latitude e longitude.
async def get_mapa_tipos():
    cidades_mapa = []
    tipos = {
        "Região de Fronteira": municipios_fronteira,
        "Região de Mineração": municipios_mineracao,
        "Outra Região de Risco": municipios_risco,
        "Rota Caipira": rota_caipira,
        "Rota do Solimões": rota_solimoes
    }
    
    for label, lista in tipos.items():
        for cid in lista:
            lat, lon = obter_lat_lon_simples(cid)
            if lat:
                cidades_mapa.append({"cidade": cid, "tipo": label, "lat": lat, "lon": lon})
    return cidades_mapa

@app.post("/api/mapa/conexoes")
# Rota para gerar conexões entre cidades com base nas tipologias, utilizando algoritmo de árvore geradora mínima para determinar as conexões mais curtas.
async def post_mapa_conexoes(payload: dict = None):
    df = SESSAO_DB.get("df_suspeitas")
    if df is None or df.empty: return {"cidades": {}, "conexoes": []}
    
    unique_locais = df["LOCAL_TRANSACAO_LIMPO"].unique()
    cidades_info = {}
    grupos = {}
    
    for raw in unique_locais:
        subset = df[df["LOCAL_TRANSACAO_LIMPO"] == raw]
        tipos = subset["TIPOLOGIA_ORIGEM"].unique()
        
        tipo_final = "Baixo Risco"
        if "Rota do Solimões" in tipos: tipo_final = "Rota do Solimões"
        elif "Rota Caipira" in tipos: tipo_final = "Rota Caipira"
        elif "Região de Fronteira" in tipos: tipo_final = "Região de Fronteira"
        elif "Região de Mineração" in tipos: tipo_final = "Região de Mineração"
        elif "Outra Região de Risco" in tipos: tipo_final = "Outra Região de Risco"
            
        lat, lon, status = obter_lat_lon_avancado(raw)
        nome_limpo = limpar_nome_cidade(raw)
        
        if lat:
            cidades_info[nome_limpo] = {"lat": lat, "lon": lon, "tipo": tipo_final, "raw": raw}
            if tipo_final not in grupos: grupos[tipo_final] = []
            grupos[tipo_final].append(nome_limpo)

    conexoes = []
    for tipo, lista in grupos.items():
        if len(lista) < 2: continue
        G = nx.Graph()
        for c in lista: G.add_node(c)
        for c1, c2 in itertools.combinations(lista, 2):
            p1 = (cidades_info[c1]["lat"], cidades_info[c1]["lon"])
            p2 = (cidades_info[c2]["lat"], cidades_info[c2]["lon"])
            G.add_edge(c1, c2, weight=geodesic(p1, p2).kilometers)
            
        mst = nx.minimum_spanning_edges(G, algorithm="prim", data=True)
        for u, v, d in mst:
            conexoes.append({
                "tipo": tipo,
                "origem": [cidades_info[u]["lat"], cidades_info[u]["lon"]],
                "destino": [cidades_info[v]["lat"], cidades_info[v]["lon"]]
            })
            
    return {"cidades": cidades_info, "conexoes": conexoes}

@app.get("/api/smurfing")
# Rota para detectar padrões de smurfing nas transações, utilizando janela de tempo e limite de valor, retornando alertas e registrando métricas no MLflow.
async def get_smurfing(janela: str = '2D', limite: float = 0):
    df = SESSAO_DB.get("df")
    if df is None: return []

    configurar_mlflow(app_data_path)
    parent_run_id = SESSAO_DB.get("mlflow_parent_run_id")

    with child_run("05_detector_smurfing", parent_run_id=parent_run_id):
        log_params_safe({"janela": janela, "limite_valor": limite})
        df_alertas = detectar_smurfing(df, janela=janela, limite_valor=limite)
        if isinstance(df_alertas, pd.DataFrame):
            log_dataframe_profile(df_alertas, "alertas_smurfing")
            log_dataframe_artifact(df_alertas, "alertas_smurfing.csv", artifact_path="smurfing", max_rows=500)
            if "DATA_ALERTA" in df_alertas.columns:
                df_alertas["DATA_ALERTA"] = df_alertas["DATA_ALERTA"].astype(str)
            return df_alertas.to_dict(orient="records")
    return []

@app.get("/api/exportar/pdf")
# Rota para exportar um relatório em PDF com base na base de suspeitas, incluindo resumo por tipologia, bancos, municípios, titulares e estados, retornando o arquivo como resposta.
async def exportar_pdf():
    df_export = SESSAO_DB.get("df_suspeitas")
    if df_export is None: raise HTTPException(status_code=404, detail="Dados não processados")
    
    df_export = df_export.copy()
    df_export["CIDADE_FINAL"] = df_export["LOCAL_TRANSACAO_LIMPO"].apply(lambda x: str(x).title() if x != "NÃO INFORMADO" else "Não Informado")

    resumo_pdf = df_export.groupby("TIPOLOGIA_ORIGEM", dropna=False).agg(
        count=("VALOR_TRANSACAO", "count"), VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
    ).reset_index().sort_values(by="VALOR_TRANSACAO", ascending=False)
    valor_total_suspeito = df_export["VALOR_TRANSACAO"].sum()

    df_bancos_pdf = pd.DataFrame()
    if "NOME_BANCO" in df_export.columns:
        df_bancos_pdf = df_export.groupby("NOME_BANCO", dropna=False).agg(
            count=("VALOR_TRANSACAO", "count"), VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
        ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()

    df_municipios_validos = df_export[df_export["CIDADE_FINAL"] != "Não Informado"]
    df_municipios_pdf = df_municipios_validos.groupby("CIDADE_FINAL").agg(
        VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
    ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()
    df_municipios_pdf.rename(columns={"CIDADE_FINAL": "CIDADE_LIMPA"}, inplace=True)

    df_titulares_pdf = pd.DataFrame()
    if "NOME_TITULAR" in df_export.columns:
        df_titulares_pdf = df_export.groupby("NOME_TITULAR").agg(
            VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
        ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()

    df_export.loc[df_export["UF_FINAL"].isin(["-", "N/D", ""]), "UF_FINAL"] = "Não Informado"
    df_estados_pdf = df_export.groupby("UF_FINAL").agg(count=("VALOR_TRANSACAO", "count")).sort_values("count", ascending=False).reset_index()
    df_estados_pdf.rename(columns={"UF_FINAL": "UF"}, inplace=True)

    nome_arq = app_data_path("relatorio_investigacao.pdf")
    gerar_pdf(
        resumo_pdf, valor_total_suspeito, df_bancos=df_bancos_pdf,
        df_municipios=df_municipios_pdf, df_titulares=df_titulares_pdf,
        df_estados=df_estados_pdf, nome_arquivo=nome_arq
    )
    
    return FileResponse(nome_arq, filename="Relatorio_Analise_PLD.pdf", media_type="application/pdf")

# Função para obter o caminho absoluto de um recurso, considerando se o aplicativo está empacotado com PyInstaller ou não.
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

@app.get("/api/exportar/pdf/salvar")
# Rota para salvar o relatório em PDF na pasta de downloads, retornando o caminho do arquivo salvo.
async def salvar_pdf_downloads():
    df_export = SESSAO_DB.get("df_suspeitas")

    if df_export is None or df_export.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    df_export = df_export.copy()

    df_export["CIDADE_FINAL"] = df_export["LOCAL_TRANSACAO_LIMPO"].apply(
        lambda x: str(x).title() if x != "NÃO INFORMADO" else "Não Informado"
    )

    resumo_pdf = df_export.groupby("TIPOLOGIA_ORIGEM", dropna=False).agg(
        count=("VALOR_TRANSACAO", "count"),
        VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
    ).reset_index().sort_values(by="VALOR_TRANSACAO", ascending=False)

    valor_total_suspeito = df_export["VALOR_TRANSACAO"].sum()

    df_bancos_pdf = pd.DataFrame()
    if "NOME_BANCO" in df_export.columns:
        df_bancos_pdf = df_export.groupby("NOME_BANCO", dropna=False).agg(
            count=("VALOR_TRANSACAO", "count"),
            VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
        ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()

    df_municipios_validos = df_export[df_export["CIDADE_FINAL"] != "Não Informado"]
    df_municipios_pdf = df_municipios_validos.groupby("CIDADE_FINAL").agg(
        VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
    ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()
    df_municipios_pdf.rename(columns={"CIDADE_FINAL": "CIDADE_LIMPA"}, inplace=True)

    df_titulares_pdf = pd.DataFrame()
    if "NOME_TITULAR" in df_export.columns:
        df_titulares_pdf = df_export.groupby("NOME_TITULAR").agg(
            VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")
        ).sort_values("VALOR_TRANSACAO", ascending=False).head(10).reset_index()

    df_export.loc[df_export["UF_FINAL"].isin(["-", "N/D", ""]), "UF_FINAL"] = "Não Informado"

    df_estados_pdf = df_export.groupby("UF_FINAL").agg(
        count=("VALOR_TRANSACAO", "count")
    ).sort_values("count", ascending=False).reset_index()
    df_estados_pdf.rename(columns={"UF_FINAL": "UF"}, inplace=True)

    caminho = downloads_path("Relatorio_PLD_LocalidadeRisco.pdf")

    gerar_pdf(
        resumo_pdf,
        valor_total_suspeito,
        df_bancos=df_bancos_pdf,
        df_municipios=df_municipios_pdf,
        df_titulares=df_titulares_pdf,
        df_estados=df_estados_pdf,
        nome_arquivo=caminho
    )

    return {
        "sucesso": True,
        "arquivo": caminho
    }


@app.post("/api/exportar/scores/salvar")
# Rota para salvar os scores de suspeição em CSV na pasta de downloads, retornando o caminho do arquivo salvo.
async def salvar_scores_downloads(pesos: PesosScoring):
    df = SESSAO_DB.get("df_suspeitas")

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    df_scored = compute_suspicion_score(
        df,
        w_valor=pesos.w_valor,
        w_freq=pesos.w_freq,
        w_tipologia=pesos.w_tipologia,
        w_recencia=pesos.w_recencia,
        w_unusual=pesos.w_unusual
    )

    df_scored = (
        df_scored
        .sort_values("SCORE_SUSPEITA", ascending=False)
        .head(pesos.limite)
        .fillna("")
    )

    if "DATA_TRANSACAO" in df_scored.columns:
        df_scored["DATA_TRANSACAO"] = df_scored["DATA_TRANSACAO"].astype(str)

    caminho = downloads_path("transacoes_com_score.csv")

    df_scored.to_csv(
        caminho,
        index=False,
        sep=";",
        encoding="utf-8-sig"
    )

    return {
        "sucesso": True,
        "arquivo": caminho
    }


@app.post("/api/exportar/filtrado/salvar")
# Rota para salvar a base de suspeitas filtrada em CSV na pasta de downloads, permitindo filtrar por tipologias e colunas específicas, retornando o caminho do arquivo salvo.
async def salvar_csv_filtrado_downloads(payload: dict):
    df = SESSAO_DB.get("df_suspeitas")

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    tipos = payload.get("tipologias", [])
    colunas = payload.get("colunas", [])

    df_export = df.copy()

    if tipos:
        df_export = df_export[
            df_export["TIPOLOGIA_ORIGEM"].fillna("Desconhecido").isin(tipos)
        ]

    if colunas:
        colunas_validas = [c for c in colunas if c in df_export.columns]
        df_export = df_export[colunas_validas]

    if df_export.empty:
        raise HTTPException(status_code=404, detail="Nenhum dado para exportar")

    if "DATA_TRANSACAO" in df_export.columns:
        df_export["DATA_TRANSACAO"] = df_export["DATA_TRANSACAO"].astype(str)

    caminho = downloads_path("transacoes_suspeitas_filtrado.csv")

    df_export.to_csv(
        caminho,
        index=False,
        sep=";",
        encoding="utf-8-sig"
    )

    return {
        "sucesso": True,
        "arquivo": caminho
    }


@app.get("/api/exportar/titulares/salvar")
# Rota para salvar o resumo de titulares suspeitos em CSV na pasta de downloads, agregando informações como quantidade de transações.
async def salvar_titulares_downloads():
    df = SESSAO_DB.get("df_suspeitas")

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    df_export = df.copy()

    if "NOME_TITULAR" not in df_export.columns:
        raise HTTPException(status_code=400, detail="Coluna NOME_TITULAR não encontrada")

    def moda(serie):
        serie = serie.dropna()

        if serie.empty:
            return "N/D"

        valores = serie.mode()

        if valores.empty:
            return "N/D"

        return valores.iloc[0]

    agregacoes = {
        "QTD_TRANSACOES": ("VALOR_TRANSACAO", "count"),
        "VALOR_TOTAL": ("VALOR_TRANSACAO", "sum"),
        "LOCAL_MAIS_FREQUENTE": ("LOCAL_TRANSACAO_LIMPO", moda),
        "TIPOLOGIA_PREDOMINANTE": ("TIPOLOGIA_ORIGEM", moda),
    }

    if "NOME_BANCO" in df_export.columns:
        agregacoes["BANCO_MAIS_FREQUENTE"] = ("NOME_BANCO", moda)

    df_titulares = (
        df_export
        .groupby("NOME_TITULAR", dropna=False)
        .agg(**agregacoes)
        .reset_index()
        .sort_values("VALOR_TOTAL", ascending=False)
    )

    caminho = downloads_path("resumo_titulares_suspeitos.csv")

    df_titulares.to_csv(
        caminho,
        index=False,
        sep=";",
        encoding="utf-8-sig"
    )

    return {
        "sucesso": True,
        "arquivo": caminho
    }


@app.post("/api/casos/exportar/salvar")
# Rota para salvar casos selecionados ou a base completa de casos em CSV na pasta de downloads, retornando o caminho do arquivo salvo.
async def salvar_casos_downloads(payload: dict):
    df = SESSAO_DB.get("df_suspeitas")

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Dados não processados")

    casos = await get_casos()
    df_casos = pd.DataFrame(casos)

    if df_casos.empty:
        raise HTTPException(status_code=404, detail="Nenhum caso encontrado")

    selecionados = payload.get("selecionados", [])

    if selecionados:
        df_casos = df_casos[df_casos["CASO_ID"].isin(selecionados)]
        nome_arquivo = "casos_selecionados.csv"
    else:
        nome_arquivo = "base_completa_casos.csv"

    if df_casos.empty:
        raise HTTPException(status_code=404, detail="Nenhum caso selecionado")

    caminho = downloads_path(nome_arquivo)

    df_casos.to_csv(
        caminho,
        index=False,
        sep=";",
        encoding="utf-8-sig"
    )

    return {
        "sucesso": True,
        "arquivo": caminho
    }

FRONTEND_DIR = resource_path("out")

if os.path.exists(FRONTEND_DIR):
    next_dir = os.path.join(FRONTEND_DIR, "_next")

    if os.path.exists(next_dir):
        app.mount(
            "/_next",
            StaticFiles(directory=next_dir),
            name="_next"
        )

    @app.get("/")
    # Rota para servir o arquivo index.html do frontend, permitindo que a aplicação web seja acessada na raiz do servidor.
    async def servir_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{full_path:path}")
    # Rota para servir arquivos estáticos do frontend, retornando o arquivo solicitado se existir ou o index.html caso contrário, permitindo que o frontend gerencie suas próprias rotas.
    async def servir_rotas_frontend(full_path: str):
        caminho = os.path.join(FRONTEND_DIR, full_path)

        if os.path.isfile(caminho):
            return FileResponse(caminho)

        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
