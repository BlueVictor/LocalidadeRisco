import streamlit as st
import pandas as pd
import plotly.express as px
import io

import scoring
from formatadores import formatar_valor, remover_acentos
from pdf import gerar_pdf
from classificadores import classificar_local_parcial
from kpis import mostrar_kpis
from grafo import render_grafo
from paginador import paginate_dataframe

st.set_page_config(page_title="Relatório de Transações Suspeitas", layout="wide")

# Carrega o arquivo de estilo CSS para uma aparência personalizada
with open("style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# --- Inicializa session_state ---
if "uploaded_file_bytes" not in st.session_state:
    st.session_state.uploaded_file_bytes = None
if "uploaded_file_name" not in st.session_state:
    st.session_state.uploaded_file_name = None

# --- Exibição condicional ---
if st.session_state.uploaded_file_bytes is None:
    st.title("🚨 Relatório de Transações Suspeitas por Localidade de Risco")

    with st.expander("Ver instruções para formatação do arquivo CSV"):
        try:
            with open("instrucoes_csv.md", "r", encoding="utf-8") as f:
                st.markdown(f.read(), unsafe_allow_html=True)
        except FileNotFoundError:
            st.warning("Arquivo de instruções (instrucoes_csv.md) não encontrado.")

    st.subheader("📤 Enviar Arquivo CSV")
    uploaded_file = st.file_uploader(
        "Selecione seu arquivo CSV com separador ';'",
        type="csv",
        key="fileuploader"
    )
    if uploaded_file is not None:
        st.session_state.uploaded_file_name = uploaded_file.name
        st.session_state.uploaded_file_bytes = uploaded_file.getvalue()
        st.rerun()

else:
    # Após upload, lê o CSV e mostra só o dashboard
    df = pd.read_csv(
        io.BytesIO(st.session_state.uploaded_file_bytes),
        sep=";",
        dtype=str
    )


if st.session_state.uploaded_file_bytes is not None:
    try:
        df = pd.read_csv(io.BytesIO(st.session_state.uploaded_file_bytes), sep=";", dtype=str)

        # Validação de colunas essenciais
        if "LOCAL_TRANSACAO" not in df.columns or "VALOR_TRANSACAO" not in df.columns:
            st.error("⚠️ O arquivo deve conter pelo menos as colunas 'LOCAL_TRANSACAO' e 'VALOR_TRANSACAO'.")
        else:
            # Limpeza e transformação dos dados
            df["LOCAL_TRANSACAO_LIMPO"] = df["LOCAL_TRANSACAO"].astype(str).apply(remover_acentos).str.upper()
            df["LOCAL_DESTINO_LIMPO"] = df["LOCAL_DESTINO"].astype(str).apply(remover_acentos).str.upper() if "LOCAL_DESTINO" in df.columns else ""
            df["VALOR_TRANSACAO"] = pd.to_numeric(df["VALOR_TRANSACAO"].str.replace(".", "", regex=False).str.replace(",", ".", regex=False), errors='coerce').fillna(0)

            # Classificação de tipologias
            df["TIPOLOGIA_ORIGEM"] = df["LOCAL_TRANSACAO_LIMPO"].apply(classificar_local_parcial)
            df["TIPOLOGIA_DESTINO"] = df["LOCAL_DESTINO_LIMPO"].apply(classificar_local_parcial)

            # Filtro inicial de suspeitas
            valor_minimo = st.slider("Valor mínimo para considerar suspeita (R$):", 0, 500000, 30000, 1000)
            df["SUSPEITA"] = df.apply(lambda r: "Sim" if r["TIPOLOGIA_ORIGEM"] != "Baixo Risco" and r["VALOR_TRANSACAO"] >= valor_minimo else "Não", axis=1)
            df_suspeitas = df[df["SUSPEITA"] == "Sim"].copy()

            # --- 2. NAVEGAÇÃO PRINCIPAL NA SIDEBAR ---
            st.sidebar.title("Navegação")
            pagina_selecionada = st.sidebar.radio(
                "Escolha a visualização:",
                ["📂 Dados e Filtros", "📊 Resumos e Rankings", "🔗 Grafo", "🧮 Scoring", "📄 Exportações"]
            )
            st.sidebar.markdown("---")  # Linha divisória

        
            # PÁGINA 1: DADOS E FILTROS
        
            if pagina_selecionada == "📂 Dados e Filtros":
                st.header("📂 Dados Detalhados e Filtros Dinâmicos")

                # --- Filtros específicos desta página na sidebar ---
                st.sidebar.subheader("🔎 Filtros Dinâmicos")
                df_filtro = df_suspeitas.copy()

                if "NOME_BANCO" in df_filtro.columns:
                    bancos = st.sidebar.multiselect("Selecione bancos:", df_filtro["NOME_BANCO"].dropna().unique())
                    if bancos:
                        df_filtro = df_filtro[df_filtro["NOME_BANCO"].isin(bancos)]

                if "NOME_TITULAR" in df_filtro.columns:
                    titulares = st.sidebar.multiselect("Selecione titulares:", df_filtro["NOME_TITULAR"].dropna().unique())
                    if titulares:
                        df_filtro = df_filtro[df_filtro["NOME_TITULAR"].isin(titulares)]

                if "LOCAL_TRANSACAO_LIMPO" in df_filtro.columns:
                    local = st.sidebar.multiselect("Selecione o local de origem:", df_filtro["LOCAL_TRANSACAO_LIMPO"].dropna().unique())
                    if local:
                        df_filtro = df_filtro[df_filtro["LOCAL_TRANSACAO_LIMPO"].isin(local)]
                        
                if "LOCAL_DESTINO_LIMPO" in df_filtro.columns:
                    local_destino_filtro = st.sidebar.multiselect("Selecione o local de destino:", df_filtro["LOCAL_DESTINO_LIMPO"].dropna().unique())
                    if local_destino_filtro:    
                        df_filtro = df_filtro[df_filtro["LOCAL_DESTINO_LIMPO"].isin(local_destino_filtro)]

                # --- Exibição dos resultados ---
                if df_filtro.empty:
                    st.success("✅ Nenhuma suspeita encontrada com os filtros atuais.")
                else:
                    mostrar_kpis(df_filtro)

                    df_filtro_vis = df_filtro.copy()

                    with st.expander("Selecionar Colunas para Exibição"):
                        colunas_disponiveis = df_filtro_vis.columns.tolist()
                        colunas_padrao = [col for col in ["NOME_TITULAR", "CPF_CNPJ_TITULAR", "VALOR_TRANSACAO", "TIPOLOGIA_ORIGEM", "LOCAL_TRANSACAO", "NOME_BANCO"] if col in colunas_disponiveis]

                        colunas_selecionadas = st.multiselect(
                            "Selecione as colunas:",
                            options=colunas_disponiveis,
                            default=colunas_padrao if colunas_padrao else colunas_disponiveis,
                            key="filtro_colunas_pagina1"
                        )

                    # Formata o valor apenas nas colunas selecionadas para exibição
                    df_exibicao = df_filtro_vis[colunas_selecionadas].copy()
                    if "VALOR_TRANSACAO" in df_exibicao.columns:
                        df_exibicao["VALOR_TRANSACAO"] = df_exibicao["VALOR_TRANSACAO"].apply(formatar_valor)

                    paginate_dataframe(df_exibicao)

        
            # PÁGINA 2: RESUMOS E RANKINGS
        
            elif pagina_selecionada == "📊 Resumos e Rankings":
                st.header("📊 Resumos e Rankings")

                # --- Resumo por Tipologia ---
                st.subheader("📊 Resumo por Tipologia de Origem")
                resumo = df_suspeitas.groupby("TIPOLOGIA_ORIGEM", dropna=False).agg(count=("VALOR_TRANSACAO", "count"), VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")).reset_index().sort_values(by="VALOR_TRANSACAO", ascending=False)
                resumo_vis = resumo.copy()
                resumo_vis["VALOR_TRANSACAO"] = resumo_vis["VALOR_TRANSACAO"].apply(formatar_valor)
                st.dataframe(resumo_vis, use_container_width=True)

                # --- Top 10 Municípios ---
                st.subheader("🏆 Top 10 Municípios de Origem por Valor")
                top10 = df_suspeitas.groupby("LOCAL_TRANSACAO_LIMPO")["VALOR_TRANSACAO"].sum().sort_values(ascending=False).head(10).reset_index()
                top10_vis = top10.copy()
                top10_vis["VALOR_TRANSACAO"] = top10_vis["VALOR_TRANSACAO"].apply(formatar_valor)
                st.dataframe(top10_vis, use_container_width=True)

                # --- Top 10 Titulares ---
                st.subheader("🏆 Top 10 Titulares por Valor Suspeito")
                if "NOME_TITULAR" in df_suspeitas.columns:
                    top10_titulares = df_suspeitas.groupby("NOME_TITULAR")["VALOR_TRANSACAO"].sum().sort_values(ascending=False).head(10).reset_index()
                    top10_titulares["VALOR_TRANSACAO"] = top10_titulares["VALOR_TRANSACAO"].apply(formatar_valor)
                    st.dataframe(top10_titulares, use_container_width=True)
                else:
                    st.warning("⚠️ Coluna 'NOME_TITULAR' ausente. Não é possível gerar ranking de titulares.")

                # --- Resumo por Banco ---
                st.subheader("🏦 Resumo por Banco")
                if "NOME_BANCO" in df_suspeitas.columns:
                    resumo_banco = df_suspeitas.groupby("NOME_BANCO", dropna=False).agg(total_trans=("VALOR_TRANSACAO", "count"), valor_total=("VALOR_TRANSACAO", "sum")).sort_values("valor_total", ascending=False).reset_index()
                    resumo_banco_vis = resumo_banco.copy()
                    resumo_banco_vis["valor_total"] = resumo_banco_vis["valor_total"].apply(formatar_valor)
                    st.dataframe(resumo_banco_vis, use_container_width=True)

                # --- Gráfico de Barras ---
                fig = px.bar(resumo, x="TIPOLOGIA_ORIGEM", y="count", labels={"TIPOLOGIA_ORIGEM":"Tipologia de Origem", "count":"Quantidade de Transações"}, title="Quantidade de Transações Suspeitas por Tipologia")
                st.plotly_chart(fig, use_container_width=True)

        
            # PÁGINA 3: GRAFO
        
            elif pagina_selecionada == "🔗 Grafo":
                st.header("🔗 Análise de Conexões em Grafo")
                st.markdown("Utilize os controles na barra lateral para filtrar e configurar a visualização do grafo.")

                # --- Filtros específicos do Grafo na sidebar ---
                st.sidebar.title("⚙️ Controles do Grafo")
                tipologias = df_suspeitas["TIPOLOGIA_ORIGEM"].unique().tolist()
                tipologias_selecionadas_grafo = st.sidebar.multiselect("Selecione as Tipologias do Grafo", options=tipologias, default=tipologias, key="grafo_tipologias")

                # --- Chamada da função que renderiza o grafo ---
                render_grafo(
                    df_suspeitas=df_suspeitas,
                    tipologias_selecionadas=tipologias_selecionadas_grafo,
                )

        
            # PÁGINA 4: SCORING
        
            elif pagina_selecionada == "🧮 Scoring":
                # A função render_scoring já organiza seu próprio layout
                df_scored = scoring.render_scoring(df_suspeitas)

        
            # PÁGINA 5: EXPORTAÇÕES
        
            elif pagina_selecionada == "📄 Exportações":
                st.header("📄 Exportações")

                # --- Exportação de PDF ---
                st.subheader("📄 Exportar Relatório PDF")
                resumo_pdf = df_suspeitas.groupby("TIPOLOGIA_ORIGEM", dropna=False).agg(count=("VALOR_TRANSACAO", "count"), VALOR_TRANSACAO=("VALOR_TRANSACAO", "sum")).reset_index().sort_values(by="VALOR_TRANSACAO", ascending=False)
                valor_total_suspeito = df_suspeitas["VALOR_TRANSACAO"].sum()
                nome_pdf = gerar_pdf(resumo_pdf, valor_total_suspeito, nome_arquivo="relatorio_suspeitas.pdf")
                with open(nome_pdf, "rb") as f:
                    st.download_button("⬇️ Baixar Relatório PDF", data=f, file_name="relatorio_suspeitas.pdf", mime="application/pdf")
                
                st.markdown("---")

                try:
                    df_scored # Verifica se a variável existe
                except NameError:
                    df_scored = scoring.compute_suspicion_score(df_suspeitas) # Calcula se não existir
                
                st.subheader("⬇️ Exportar CSV com Scores")
                csv_scored_bytes = df_scored.to_csv(index=False, sep=";", encoding="utf-8-sig").encode("utf-8-sig")
                st.download_button("⬇️ Baixar CSV com Scores", data=csv_scored_bytes, file_name="transacoes_com_score.csv", mime="text/csv")
                
                st.markdown("---")
                
                # --- Exportação de CSV com Filtros ---
                st.subheader("⬇️ Exportar CSV com Filtros Personalizados")
                tipologias_unicas = sorted(df_suspeitas["TIPOLOGIA_ORIGEM"].fillna("Desconhecido").unique().tolist())
                tipologias_selecionadas_export = st.multiselect("Selecione Tipologias para exportar", options=tipologias_unicas, default=tipologias_unicas, key="export_tipos")
                df_export = df_suspeitas[df_suspeitas["TIPOLOGIA_ORIGEM"].fillna("Desconhecido").isin(tipologias_selecionadas_export)].copy()
                
                colunas_disponiveis = df_export.columns.tolist()
                colunas_selecionadas = st.multiselect("Selecione colunas para exportar", options=colunas_disponiveis, default=colunas_disponiveis, key="export_cols")
                
                if colunas_selecionadas:
                    df_export = df_export[colunas_selecionadas]

                csv_bytes = df_export.to_csv(index=False, sep=";", encoding="utf-8-sig").encode("utf-8-sig")
                st.download_button("⬇️ Baixar CSV Filtrado", data=csv_bytes, file_name="transacoes_suspeitas_filtrado.csv", mime="text/csv")


    # --- Bloco de tratamento de erro ---
    except Exception as e:
        st.error(f"❌ Ocorreu um erro inesperado ao processar o arquivo: {e}")