import pandas as pd
import re
from municipios import municipios_fronteira, municipios_mineracao, municipios_risco, rota_caipira, rota_solimoes

# Função para limpar os elementos da lista, removendo entradas vazias ou com menos de 2 caracteres
def limpar_lista(lista):
    return [re.escape(str(c).strip()) for c in lista if c and len(str(c).strip()) > 1]

regex_solimoes = re.compile(rf'\b({"|".join(limpar_lista(rota_solimoes))})\b')
regex_caipira = re.compile(rf'\b({"|".join(limpar_lista(rota_caipira))})\b')
regex_risco = re.compile(rf'\b({"|".join(limpar_lista(municipios_risco))})\b')
regex_mineracao = re.compile(rf'\b({"|".join(limpar_lista(municipios_mineracao))})\b')
regex_fronteira = re.compile(rf'\b({"|".join(limpar_lista(municipios_fronteira))})\b')

# Função para classificar o local de uma transação com base em listas de municípios e rotas
def classificar_local_parcial(local):
    if pd.isna(local) or str(local).strip() == "":
        return "Desconhecido"
    
    local_limpo = str(local).upper().strip()
    
    # Verifica se o local corresponde a alguma das categorias de risco
    if regex_solimoes.search(local_limpo): return "Rota do Solimões"
    if regex_caipira.search(local_limpo): return "Rota Caipira"
    if regex_risco.search(local_limpo): return "Outra Região de Risco"
    if regex_mineracao.search(local_limpo): return "Região de Mineração"
    if regex_fronteira.search(local_limpo): return "Região de Fronteira"
            
    return "Baixo Risco"