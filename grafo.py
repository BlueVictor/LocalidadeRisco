import streamlit as st
import networkx as nx
from pyvis.network import Network
import streamlit.components.v1 as components
from formatadores import formatar_valor
import pandas as pd

def render_grafo(df_suspeitas: pd.DataFrame, tipologias_selecionadas: list):
    # --- Controles da Barra Lateral (Sidebar) ---
    with st.sidebar.expander("Configurações Avançadas de Visualização"):
        st.markdown("**Dica:** Para separar mais os grupos, aumente a 'Força de Repulsão'. Se eles ficarem muito distantes, aumente um pouco a 'Força Central'.")
        gravidade = st.slider("Força de Repulsão (afasta nós)", -60000, -5000, -15000, key="grafo_grav")
        central_gravity = st.slider("Força Central (junta os grupos)", 0.0, 1.0, 0.7, step=0.05, key="grafo_central_grav")
        spring_length = st.slider("Comprimento das Arestas", 100, 800, 150, key="grafo_spring")
        
    # --- Cores e Estilos ---
    cores_tipologias = {
        "Região de Fronteira": "#FF6347",   # Vermelho Tomate
        "Região de Mineração": "#1E90FF",   # Azul Dodger
        "Outra Região de Risco": "#32CD32", # Verde Lima
        "Baixo Risco": "#808080",           # Cinza
        "Desconhecido": "#A9A9A9"           # Cinza Escuro
    }
    
    # --- Filtragem de Dados ---
    df_filtrado = df_suspeitas[df_suspeitas["TIPOLOGIA_ORIGEM"].isin(tipologias_selecionadas)]
    if df_filtrado.empty:
        st.warning("Nenhum dado encontrado para as tipologias selecionadas.")
        return

    # --- Construção do Grafo com NetworkX ---
    G = nx.Graph()

    # 1. Adiciona nós de Tipologia
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

    # 2. Adiciona Pessoas e Transações
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

        # ID único da pessoa no contexto da tipologia
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

    # --- Renderização com Pyvis ---
    net = Network(height="800px", width="100%", notebook=False, cdn_resources="in_line")
    
    net.barnes_hut(
        gravity=gravidade,
        central_gravity=central_gravity,
        spring_length=spring_length,
        spring_strength=0.04,
        damping=0.35
    )

    net.from_nx(G)
    net.show_buttons(filter_=["physics"])
    components.html(net.generate_html(notebook=False), height=800, scrolling=True)
