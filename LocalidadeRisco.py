import streamlit as st
import pandas as pd
import io
import unicodedata
import plotly.express as px
import re

# Bibliotecas adicionais
from fpdf import FPDF
import folium
from streamlit_folium import st_folium
import networkx as nx
from pyvis.network import Network
import streamlit.components.v1 as components

# Função para remover acentos
def remover_acentos(txt):
    if not isinstance(txt, str):
        return txt
    return ''.join(c for c in unicodedata.normalize('NFKD', txt) if not unicodedata.combining(c))

# Função para criar PDF simples com resumo
def criar_pdf_relatorio(df_resumo, valor_total, nome_arquivo="relatorio.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(200, 10, txt="Relatório de Transações Suspeitas", ln=1, align="C")
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, "Resumo por Tipologia (Origem):", ln=1)
    
    for idx, row in df_resumo.iterrows():
        texto = f"{row['TIPOLOGIA_ORIGEM']}: {row['count']} transações, total R$ {row['VALOR_TRANSACAO']:,.2f}"
        pdf.cell(0, 10, txt=texto, ln=1)
    
    pdf.ln(5)
    pdf.cell(0, 10, f"Valor total das transações suspeitas: R$ {valor_total:,.2f}", ln=1)
    
    pdf.output(nome_arquivo)
    return nome_arquivo

# Configuração da página
st.set_page_config(page_title="Relatório de Transações Suspeitas", layout="wide")

st.title("🚨 Relatório de Transações Suspeitas por Localidade de Risco (Tipologia 7A-7B-7C)")
st.markdown(
    "Este sistema lê um arquivo de transações e gera um **relatório apenas com transações suspeitas**, "
    "com base em **localidades sensíveis** (origem ou destino) e **valor mínimo**."
)

# Listas de municípios sensíveis
municipios_fronteira = [
    "Foz do Iguaçu", "Ponta Porã", "Tabatinga", "Corumbá", "Guajará-Mirim", "Brasiléia",
    "Assis Brasil", "Epitaciolândia", "Santa Helena", "Santana do Livramento", "Jaguarão",
    "Chuí", "Uruguaiana", "São Borja", "Mundo Novo", "Porto Murtinho", "Bonfim", "Pacaraima",
    "São Gabriel", "Guaíra", "Porto Esperidião", "Marechal Thaumaturgo", "Tabatinga",
    "Epitaciolândia", "Bonito", "Itaqui", "Coronel Sapucaia", "Benjamim Constant", "São Luiz do Guaporé",
    "Pacaraima", "Primavera do Leste", "Epitaciolândia"
]

municipios_mineracao = [
    "Parauapebas", "Marabá", "Ouro Preto", "Serra Pelada", "Canaã dos Carajás",
    "Itabira", "Barão de Cocais", "Brumadinho", "Congonhas", "Nova Lima", "Paracatu",
    "Curionópolis", "Crixás", "Tapira", "Jacobina", "Caetité", "Itaituba",
    "Carajás", "Santarém", "Alvorada de Minas", "Conceição do Mato Dentro", "Itamarandiba",
    "Governador Valadares", "Sabará", "Santa Bárbara", "Igarapé", "Santa Luzia", "Cabo Verde",
    "Itabirito", "São Gonçalo do Rio Abaixo"
]

municipios_risco = [
    "Altamira", "Itaituba", "Pacaraima", "Humaitá", "Lábrea", "Apuí", "Novo Progresso",
    "São Félix do Xingu", "Anapu", "Porto Velho", "Careiro", "Manaus", "Xapuri", "Rio Branco",
    "Carauari", "Tefé", "Manacapuru", "Coari", "Cametá", "Boca do Acre", "Manicoré",
    "Senador Guiomard", "Tarauacá", "Cruzeiro do Sul", "Feijó", "Eirunepé",
    "São João da Baliza", "Rorainópolis", "Amajari", "Japurá", "São Gabriel da Cachoeira",
    "Eldorado dos Carajás", "Novo Airão", "Santa Isabel do Rio Negro", "Iranduba"
] 

# Padronizar listas
municipios_fronteira = [remover_acentos(m).upper() for m in municipios_fronteira]
municipios_mineracao = [remover_acentos(m).upper() for m in municipios_mineracao]
municipios_risco = [remover_acentos(m).upper() for m in municipios_risco]

# Upload do arquivo
st.subheader("📤 Enviar Arquivo CSV")
uploaded_file = st.file_uploader("Selecione seu arquivo CSV com separador ';'", type="csv")

if uploaded_file:
    try:
        # Ler o CSV
        df = pd.read_csv(uploaded_file, sep=";", dtype=str)

        # Verificar colunas mínimas
        if "LOCAL_TRANSACAO" not in df.columns or "VALOR_TRANSACAO" not in df.columns:
            st.error("⚠️ O arquivo deve conter pelo menos 'LOCAL_TRANSACAO' e 'VALOR_TRANSACAO'.")
        else:
            # Criar coluna limpa
            df["LOCAL_TRANSACAO_LIMPO"] = df["LOCAL_TRANSACAO"].astype(str).apply(remover_acentos).str.upper()
            if "LOCAL_DESTINO" in df.columns:
                df["LOCAL_DESTINO_LIMPO"] = df["LOCAL_DESTINO"].astype(str).apply(remover_acentos).str.upper()
            else:
                df["LOCAL_DESTINO_LIMPO"] = ""

            # Converter valor
            df["VALOR_TRANSACAO"] = (
                df["VALOR_TRANSACAO"]
                .str.replace(".", "", regex=False)
                .str.replace(",", ".", regex=False)
                .astype(float)
            )

            # Função de classificação parcial
            def classificar_local_parcial(local):
                if pd.isna(local) or local.strip() == "":
                    return "Desconhecido"
                for m in municipios_fronteira:
                    if m in local:
                        return "Região de Fronteira"
                for m in municipios_mineracao:
                    if m in local:
                        return "Região de Mineração"
                for m in municipios_risco:
                    if m in local:
                        return "Outra Região de Risco"
                return "Baixo Risco"

            # Classificação para origem e destino
            df["TIPOLOGIA_ORIGEM"] = df["LOCAL_TRANSACAO_LIMPO"].apply(classificar_local_parcial)
            df["TIPOLOGIA_DESTINO"] = df["LOCAL_DESTINO_LIMPO"].apply(classificar_local_parcial)

            # Filtro interativo
            st.subheader("💵 Filtro de Análise")
            valor_minimo = st.slider("Valor mínimo para considerar suspeita (R$):", 0, 500000, 30000, 1000)

            df["SUSPEITA"] = df.apply(
                lambda r: "Sim" if r["TIPOLOGIA_ORIGEM"] != "Baixo Risco" and r["VALOR_TRANSACAO"] >= valor_minimo else "Não",
                axis=1
            )

            # Filtrar suspeitas
            df_suspeitas = df[df["SUSPEITA"] == "Sim"]

            # Filtro por local de origem ou destino
            st.subheader("🔎 Filtrar transações suspeitas por localidade")

            local_origem_filtro = st.text_input("Filtrar transações suspeitas por local de origem (deixe em branco para não filtrar):").strip().upper()
            local_destino_filtro = st.text_input("Filtrar transações suspeitas por local de destino (deixe em branco para não filtrar):").strip().upper()

            df_suspeitas_filtrado = df_suspeitas.copy()

            if local_origem_filtro:
                df_suspeitas_filtrado = df_suspeitas_filtrado[
                    df_suspeitas_filtrado["LOCAL_TRANSACAO_LIMPO"].str.contains(local_origem_filtro, na=False)
                ]

            if local_destino_filtro:
                df_suspeitas_filtrado = df_suspeitas_filtrado[
                    df_suspeitas_filtrado["LOCAL_DESTINO_LIMPO"].str.contains(local_destino_filtro, na=False)
                ]

            # Exibir resultado filtrado
            if df_suspeitas_filtrado.empty:
                st.success("✅ Nenhuma suspeita encontrada com os filtros atuais.")
            else:
                st.warning(f"⚠️ {len(df_suspeitas_filtrado)} suspeitas encontradas após filtro adicional.")
                st.dataframe(df_suspeitas_filtrado)

                valor_total = df_suspeitas_filtrado["VALOR_TRANSACAO"].sum()
                st.markdown(f"**💰 Valor total: R$ {valor_total:,.2f}**".replace(",", "#").replace(".", ",").replace("#", "."))

                # Exportar CSV filtrado
                csv_buffer = io.StringIO()
                df_suspeitas_filtrado.to_csv(csv_buffer, sep=";", index=False)
                st.download_button(
                    label="⬇️ Baixar relatório filtrado (.csv)",
                    data=csv_buffer.getvalue().encode("utf-8"),
                    file_name="relatorio_suspeitas_filtrado.csv",
                    mime="text/csv"
                )
                
                # Resumo estatístico por tipologia origem
                resumo = (
                    df_suspeitas_filtrado.groupby("TIPOLOGIA_ORIGEM")
                    .agg(count=("VALOR_TRANSACAO", "count"), VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum"))
                    .reset_index()
                    .sort_values(by="VALOR_TRANSACAO", ascending=False)
                )
                st.subheader("📊 Resumo por Tipologia de Origem")
                st.dataframe(resumo)

                # Gráfico das tipologias mais comuns (origem)
                fig = px.bar(resumo, x="TIPOLOGIA_ORIGEM", y="count", 
                             labels={"TIPOLOGIA_ORIGEM":"Tipologia Origem", "count":"Quantidade de Transações"},
                             title="Quantidade de Transações Suspeitas por Tipologia de Origem")
                st.plotly_chart(fig, use_container_width=True)

                # Lista locais únicos origem e destino
                locais_origem = df_suspeitas_filtrado["LOCAL_TRANSACAO_LIMPO"].unique()
                locais_destino = df_suspeitas_filtrado["LOCAL_DESTINO_LIMPO"].unique()

                # Grafo das conexões entre localidades (origem -> destino)

                st.subheader("🔗 Grafo com Cidades ligadas à Região de Origem das transações suspeitas")

                G = nx.DiGraph()

                tipologias = ["Região de Fronteira", "Região de Mineração", "Outra Região de Risco", "Baixo Risco"]
                for tipo in tipologias:
                    G.add_node(tipo, tipo_central=True)

                for _, row in df_suspeitas_filtrado.iterrows():
                    cidade = row["LOCAL_TRANSACAO_LIMPO"]
                    tipologia_origem = row["TIPOLOGIA_ORIGEM"]
                    valor = row["VALOR_TRANSACAO"]

                    if not cidade or cidade.strip() == "":
                        continue

                    if cidade not in G:
                        G.add_node(cidade, tipo_central=False)

                    if not G.has_edge(tipologia_origem, cidade):
                        G.add_edge(tipologia_origem, cidade, weight=valor, count=1)
                    else:
                        G[tipologia_origem][cidade]["weight"] += valor
                        G[tipologia_origem][cidade]["count"] += 1

                if G.degree("Baixo Risco") == 0:
                    G.remove_node("Baixo Risco")

                net = Network(height="800px", width="100%", directed=True)

                net.barnes_hut()

                for node, data in G.nodes(data=True):
                    if data.get("tipo_central", False):
                        net.add_node(node, label=node, size=40, color="#000000", font={'color': '#000000', 'size': 18})
                    else:
                        net.add_node(node, label=node, size=20, color="#000000", font={'color': '#000000', 'size': 14})

                for u, v, data in G.edges(data=True):
                    peso = data["weight"]
                    largura = max(1, min(peso / 20000, 10))
                    net.add_edge(u, v, title=f"Total R$ {peso:,.2f}, {data['count']} transações", width=largura, color="#000000")

                net.save_graph("grafo_regioes.html")

                with open("grafo_regioes.html", 'r', encoding='utf-8') as HtmlFile:
                    components.html(HtmlFile.read(), height=850)

                # Gerar e baixar relatório PDF
                st.subheader("📄 Gerar Relatório PDF")
                nome_pdf = criar_pdf_relatorio(resumo, valor_total, nome_arquivo="relatorio_suspeitas.pdf")
                with open(nome_pdf, "rb") as f:
                    st.download_button(
                        label="⬇️ Baixar Relatório em PDF",
                        data=f,
                        file_name="relatorio_suspeitas.pdf",
                        mime="application/pdf"
                    )

    except Exception as e:
        st.error(f"❌ Erro ao processar arquivo: {e}")
