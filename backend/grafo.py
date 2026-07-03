import networkx as nx
from pyvis.network import Network
from formatadores import formatar_valor
import pandas as pd

def render_grafo(df_suspeitas: pd.DataFrame, tipologias_selecionadas: list):

    # Definição de Cores para Tipologias
    cores_tipologias = {
        "Região de Fronteira": "#FF6347",   # Vermelho
        "Região de Mineração": "#1E90FF",   # Azul
        "Outra Região de Risco": "#32CD32", # Verde Lima
        "Rota Caipira": "#8A2BE2",          # Roxo
        "Rota do Solimões": "#20B2AA",      # Verde Mar
        "Baixo Risco": "#808080",           # Cinza
        "Desconhecido": "#A9A9A9"           # Cinza Escuro
    }
    
    df_filtrado = df_suspeitas[df_suspeitas["TIPOLOGIA_ORIGEM"].isin(tipologias_selecionadas)]
    if df_filtrado.empty:
        return

    G = nx.Graph()

    # Adiciona Tipologias como nós
    for tipo in tipologias_selecionadas:
        G.add_node(
            tipo,
            label=tipo,
            node_type="tipologia",
            size=45,
            color=cores_tipologias.get(tipo, "#999999"),
            shape="star",
            title=f"Tipologia: {tipo}"
        )

    # Adiciona Pessoas e Transações
    for idx, row in df_filtrado.iterrows():
        tipo_origem = row.get("TIPOLOGIA_ORIGEM", "Desconhecido")
        pessoa = row.get("NOME_TITULAR", "Pessoa Desconhecida")
        cpf = row.get("CPF_CNPJ_TITULAR", "")
        valor = row.get("VALOR_TRANSACAO", 0)
        local = row.get("LOCAL_TRANSACAO", "")
        banco = row.get("NOME_BANCO", "")
        data_tx = row.get("DATA_TRANSACAO", "")

        # Cor da pessoa herdada da tipologia
        cor_pessoa = cores_tipologias.get(tipo_origem, "#999999")

        # ID único da pessoa na tipologia
        id_pessoa_contextual = f"P|{pessoa}|{cpf}|{tipo_origem}"

        tamanho_base = 28
        tamanho_pessoa = max(tamanho_base, len(pessoa) * 1.5)
        
        if id_pessoa_contextual not in G.nodes:
            G.add_node(
                id_pessoa_contextual,
                label=pessoa,
                node_type="pessoa",
                size=tamanho_pessoa,
                color=cor_pessoa,
                shape="ellipse",
                title=(
                    f"Titular:{pessoa}"
                    f"\nCPF/CNPJ: {cpf}"
                    f"\nTipologia: {tipo_origem}"
                )
            )
            G.add_edge(tipo_origem, id_pessoa_contextual, color="#CCCCCC")

        # ID único para a Transação
        id_transacao = f"T|{id_pessoa_contextual}|{local}|{valor}|{data_tx}|{idx}"

        tooltip_tx = (
            f"Transação"
            f"\nValor: R$ {formatar_valor(valor)}"
            f"\nTitular: {pessoa}"
            f"\nLocal: {local}"
            f"\nBanco: {banco}"
        )
        
        G.add_node(
            id_transacao,
            label=f"R$ {int(valor/1000)}k",
            node_type="transacao",
            size=max(10, min(valor / 6000, 22)),
            color=cor_pessoa,  # mesma cor da tipologia
            shape="dot",
            title=tooltip_tx
        )
        
        G.add_edge(id_pessoa_contextual, id_transacao, color="#B0B0B0")

    # Renderização com Pyvis
    net = Network(height="800px", width="100%", notebook=False, cdn_resources="in_line")
    net.from_nx(G)