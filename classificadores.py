import pandas as pd
from municipios import municipios_fronteira, municipios_mineracao, municipios_risco

def classificar_local_parcial(local):
    if pd.isna(local) or local.strip() == "":
        return "Desconhecido"
    for m in municipios_mineracao:
        if m in local:
            return "Região de Mineração"
    for m in municipios_risco:
        if m in local:
            return "Outra Região de Risco"
    for m in municipios_fronteira:
        if m in local:
            return "Região de Fronteira"
    return "Baixo Risco"
