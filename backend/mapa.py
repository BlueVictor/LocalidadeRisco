import folium
from folium.plugins import MarkerCluster
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import json
import os
import sys
from municipios import (municipios_fronteira, municipios_mineracao, municipios_risco, rota_caipira, rota_solimoes)

# Configuração do geocodificador
geolocator = Nominatim(user_agent="geoapp")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

# Função para obter o caminho absoluto do recurso, considerando o PyInstaller
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


CACHE_FILE = resource_path("coords_cache.json")

if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        COORDS_CACHE = json.load(f)
else:
    COORDS_CACHE = {}

# Definição das cores para cada tipologia
CORES = {
    "Região de Fronteira": "red",
    "Região de Mineração": "blue",
    "Outra Região de Risco": "orange",
    "Rota Caipira": "purple",
    "Rota do Solimões": "darkgreen",
}

# Função para obter latitude e longitude de uma cidade, utilizando cache
def obter_lat_lon(cidade):
    cidade_upper = cidade.upper()

    if cidade_upper in COORDS_CACHE:
        return COORDS_CACHE[cidade_upper]["lat"], COORDS_CACHE[cidade_upper]["lon"]

    try:
        loc = geocode(f"{cidade}, Brasil")
        if loc:
            COORDS_CACHE[cidade_upper] = {"lat": loc.latitude, "lon": loc.longitude}

            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(COORDS_CACHE, f, indent=2, ensure_ascii=False)

            return loc.latitude, loc.longitude
    except:
        pass

    return None, None

# Função principal para gerar o mapa com tipologias
def gerar_mapa_tipologias():

    cidades = []

    for c in municipios_fronteira:
        cidades.append((c, "Região de Fronteira"))
    for c in municipios_mineracao:
        cidades.append((c, "Região de Mineração"))
    for c in municipios_risco:
        cidades.append((c, "Outra Região de Risco"))
    for c in rota_caipira:
        cidades.append((c, "Rota Caipira"))
    for c in rota_solimoes:
        cidades.append((c, "Rota do Solimões"))

    mapa = folium.Map(location=[-15.78, -47.88], zoom_start=4)

    cluster = MarkerCluster().add_to(mapa)

    for cidade, tipo in cidades:
        lat, lon = obter_lat_lon(cidade)

        if lat is None:
            continue

        cor = CORES.get(tipo, "gray")

        # Se for uma rota crítica, usa um ícone de Alerta em vez de bolinha
        if tipo in ["Rota Caipira", "Rota do Solimões"]:
            folium.Marker(
                location=[lat, lon],
                icon=folium.Icon(color='red', icon='exclamation-sign'),
                tooltip=f"⚠️ ALERTA: {cidade.title()} ({tipo})"
            ).add_to(cluster)
        else:
            folium.CircleMarker(
                location=[lat, lon],
                radius=6,
                color=cor,
                weight=1,
                fill=True,
                fill_color=cor,
                fill_opacity=0.8,
                tooltip=f"{cidade.title()} – {tipo}"
            ).add_to(cluster)