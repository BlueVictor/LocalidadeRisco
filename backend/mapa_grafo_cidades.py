import folium
import pandas as pd
import json
import os
import re
import sys
import networkx as nx
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from geopy.distance import geodesic
import itertools

# Definição das cores para cada tipologia
CORES = {
    "Região de Fronteira": "red",
    "Região de Mineração": "blue",
    "Outra Região de Risco": "orange",
    "Rota Caipira": "purple",        
    "Rota do Solimões": "darkgreen",
    "Baixo Risco": "gray"
}

# Função para obter o caminho absoluto do recurso, considerando o PyInstaller
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


CACHE_FILE = resource_path("coords_cache.json")

geolocator = Nominatim(user_agent="analise_risco_br_full_audit_v19", timeout=10)
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.0)

# Função para carregar o cache de coordenadas
def carregar_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

COORDS_CACHE = carregar_cache()

# Função para verificar se uma coordenada está dentro do Brasil
def coordenada_no_brasil(lat, lon):
    if lat is None or lon is None:
        return False
    if -35 <= lat <= 6 and -75 <= lon <= -30:
        return True
    return False

# Função para limpar e padronizar o nome da cidade
def limpar_nome_cidade(local_cru):
    if pd.isna(local_cru) or str(local_cru).strip() == "":
        return None
    
    texto = str(local_cru).upper().strip()
    
    # Isola quebrando por 2 ou mais espaços
    partes = re.split(r'\s{2,}', texto)
    if len(partes) > 1:
        candidato = partes[-1].strip()
        # Se o último bloco for apenas "BR", pega o bloco anterior.
        if candidato in ["BR", "B R"] and len(partes) > 2:
            candidato = partes[-2].strip()
        texto = candidato
        
    # Limpa o sufixo "BR" se estiver colado na cidade (ex: "SANTAREM BR")
    texto = re.sub(r'\bB\s*R$', '', texto).strip()

    # Normalização de hífens
    texto = texto.replace('–', '-').replace('—', '-').replace('−', '-')
    
    # Prefixos inúteis bancários
    padrao_prefixos = r"^(?:TCX|TAA|CAIXA|BANCO|BCO|AGENCIA|AG|PAGTO|TRANSF|DOC|TED|PIX|EFT|PAG|ATM)[\W_]+"
    texto = re.sub(padrao_prefixos, '', texto)
    # Remove prefixos de agência com números (ex: "AG 1234 - SANTAREM")
    texto = re.sub(r"^AG[:.]?\s*\d+[\W_]+", '', texto)
    # Remove sufixos de agência com números (ex: "SANTAREM - AG 1234")
    texto = re.sub(r'\b[A-Z]*\d+[A-Z]*\b', '', texto).strip()
    # Remove números soltos
    texto = re.sub(r'\d+', '', texto)

    # Remoção de termos proibidos
    termos_proibidos = [
        r"MISS\s+BELLA", r"FOOD\s+ITALIA", r"COSMETICOS", r"A\s+P\s+AVENIDA", 
        r"AEROPORTO", r"MODAS", r"CONFECCOES", r"LTDA", r"EIRELI", r"POSTO",
        r"DROGARIA", r"MERCADO", r"SUPERMERCADO", r"AUTO\s+POSTO", r"^PAG\s"
    ]
    for termo in termos_proibidos:
        texto = re.sub(termo, '', texto)

    ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
           "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
           "RS", "RO", "RR", "SC", "SP", "SE", "TO"]
    
    # Remove sufixos de UF, considerando diferentes separadores
    for uf in ufs:
        if f"/{uf}" in texto: return texto.split(f"/{uf}")[0].strip()
        if f"-{uf}" in texto: return texto.split(f"-{uf}")[0].strip()
        if f" {uf} " in texto: return texto.split(f" {uf} ")[0].strip()
        if texto.endswith(f" {uf}"): return texto[:-3].strip()

    if "-" in texto:
        partes = texto.split("-")
        texto = max(partes, key=len).strip()

    # Remove pontuação preservando espaços, hífens e apóstrofos
    texto = re.sub(r'[^\w\s\-\']', '', texto).strip()
    
    return texto

# Função para obter latitude e longitude de uma cidade
def obter_lat_lon(local_original):
    cidade_limpa = limpar_nome_cidade(local_original)
    
    if not cidade_limpa or len(cidade_limpa) < 3: 
        return None, None, f"Inválido (Curto/Vazio)"

    if cidade_limpa in COORDS_CACHE:
        lat = COORDS_CACHE[cidade_limpa]["lat"]
        lon = COORDS_CACHE[cidade_limpa]["lon"]
        if coordenada_no_brasil(lat, lon):
            return lat, lon, "Cache"

    # Função interna para buscar coordenadas via API
    def buscar(q):
        try:
            loc = geocode(f"{q}, Brazil")
            if loc and coordenada_no_brasil(loc.latitude, loc.longitude):
                return loc
        except:
            return None
        return None

    # Tenta buscar a string limpa exata
    loc = buscar(cidade_limpa)
    if loc:
        COORDS_CACHE[cidade_limpa] = {"lat": loc.latitude, "lon": loc.longitude}
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(COORDS_CACHE, f, indent=2, ensure_ascii=False)
        return loc.latitude, loc.longitude, "API (Exato)"

    if " " in cidade_limpa:
        # Tenta a última palavra primeiro
        ultima_palavra = cidade_limpa.split()[-1]
        if len(ultima_palavra) > 3:
            loc = buscar(ultima_palavra)
            if loc:
                COORDS_CACHE[cidade_limpa] = {"lat": loc.latitude, "lon": loc.longitude}
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(COORDS_CACHE, f, indent=2, ensure_ascii=False)
                return loc.latitude, loc.longitude, "API (Última Palavra)"
        
        # Se a última falhar, tenta a primeira
        primeira_palavra = cidade_limpa.split()[0]
        if len(primeira_palavra) > 4: 
            loc = buscar(primeira_palavra)
            if loc:
                COORDS_CACHE[cidade_limpa] = {"lat": loc.latitude, "lon": loc.longitude}
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(COORDS_CACHE, f, indent=2, ensure_ascii=False)
                return loc.latitude, loc.longitude, "API (1ª Palavra)"

    return None, None, f"Não encontrado"

# Função principal para renderizar o mapa com o grafo das cidades suspeitas
def render_mapa_grafo(df_suspeitas):

    if df_suspeitas.empty:
        return

    m = folium.Map(location=[-15.78, -47.93], zoom_start=4, tiles="CartoDB positron")
    
    cidades_info = {}
    cidades_erro = []
    auditoria_nomes = []
    
    unique_locais = df_suspeitas["LOCAL_TRANSACAO_LIMPO"].unique()
    total_bruto = len(unique_locais)
    
    # Processamento de cidades
    for i, raw in enumerate(unique_locais):
        subset = df_suspeitas[df_suspeitas["LOCAL_TRANSACAO_LIMPO"] == raw]
        tipos = subset["TIPOLOGIA_ORIGEM"].unique()
        
        tipo_final = "Baixo Risco"
        # Prioridade máxima para as rotas de Narcotráfico
        if "Rota do Solimões" in tipos: tipo_final = "Rota do Solimões"
        elif "Rota Caipira" in tipos: tipo_final = "Rota Caipira"
        # Prioridade secundária para Tipologias Padrão
        elif "Região de Fronteira" in tipos: tipo_final = "Região de Fronteira"
        elif "Região de Mineração" in tipos: tipo_final = "Região de Mineração"
        elif "Outra Região de Risco" in tipos: tipo_final = "Outra Região de Risco"
            
        lat, lon, status = obter_lat_lon(raw)
        
        # Auditoria de nomes
        nome_limpo = limpar_nome_cidade(raw)
        auditoria_nomes.append({
            "Nome Original na Planilha": raw,
            "Nome Limpo": nome_limpo,
            "Status Geocoding": status
        })
        
        if lat is not None and lon is not None:
            key = nome_limpo
            cidades_info[key] = {"lat": lat, "lon": lon, "tipo": tipo_final, "raw": raw}
        else:
            cidades_erro.append(f"{raw} -> {status}")

    total_mapa = len(cidades_info)
    unificados = total_bruto - total_mapa - len(cidades_erro)
    grupos = {}
    
    for cid, info in cidades_info.items():
        t = info["tipo"]
        
        if t not in grupos: grupos[t] = []
        grupos[t].append(cid)
        
        cor = CORES.get(t, "gray")

        if t in ["Rota Caipira", "Rota do Solimões"]:
            folium.Marker(
                location=[info["lat"], info["lon"]],
                icon=folium.Icon(color='red', icon='exclamation-sign'), # Ícone chamativo
                tooltip=f"⚠️ ALERTA: {cid} ({t})",
                popup=f"Original: {info['raw']}\nTipologia: {t}"
            ).add_to(m)
        else:
            folium.CircleMarker(
                location=[info["lat"], info["lon"]],
                radius=6, color=cor, fill=True, fill_color=cor, fill_opacity=0.9,
                tooltip=cid, popup=f"Original: {info['raw']}"
            ).add_to(m)

    conexoes_count = 0
    for tipo, lista in grupos.items():
        if len(lista) < 2: continue
        
        G = nx.Graph()
        for c in lista: G.add_node(c)
        
        for c1, c2 in itertools.combinations(lista, 2):
            p1 = (cidades_info[c1]["lat"], cidades_info[c1]["lon"])
            p2 = (cidades_info[c2]["lat"], cidades_info[c2]["lon"])
            dist = geodesic(p1, p2).kilometers
            G.add_edge(c1, c2, weight=dist)
            
        mst = nx.minimum_spanning_edges(G, algorithm="prim", data=True)
        cor_linha = CORES.get(tipo, "gray")
        
        for u, v, d in mst:
            p1 = [cidades_info[u]["lat"], cidades_info[u]["lon"]]
            p2 = [cidades_info[v]["lat"], cidades_info[v]["lon"]]
            
            # Se a linha for de uma rota crítica, ela é mais grossa e opaca
            weight_line = 4 if tipo in ["Rota Caipira", "Rota do Solimões"] else 2
            opacity_line = 0.9 if tipo in ["Rota Caipira", "Rota do Solimões"] else 0.6
            
            folium.PolyLine(
                locations=[p1, p2], color=cor_linha, weight=weight_line, opacity=opacity_line,
                tooltip=f"{tipo}"
            ).add_to(m)
            conexoes_count += 1
    
    return m
