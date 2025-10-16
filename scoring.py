import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
from formatadores import formatar_valor, remover_acentos
from paginador import paginate_dataframe
import io

def _normalize_series(s, method="minmax", eps=1e-9):
    # garante não-divisão por zero e lida com NaN
    s = s.fillna(0).astype(float)
    if method == "minmax":
        mn, mx = s.min(), s.max()
        if mx - mn < eps:
            return s*0.0
        return (s - mn) / (mx - mn)
    if method == "log":
        return np.log1p(s) / np.log1p(s.max() + eps)
    return s

def _typology_score(tipo):
    # Pontuação base por tipologia (0..1)
    mapping = {
        "Região de Fronteira": 1.0,
        "Região de Mineração": 0.85,
        "Outra Região de Risco": 0.7,
        "Desconhecido": 0.5,
        "Baixo Risco": 0.1
    }
    return mapping.get(tipo, 0.3)

def compute_suspicion_score(df,
                            w_valor=0.4,
                            w_freq=0.2,
                            w_tipologia=0.25,
                            w_recencia=0.1,
                            w_unusual=0.05):
    df = df.copy()

    if "VALOR_TRANSACAO" not in df.columns:
        df["VALOR_TRANSACAO"] = 0.0
    df["VALOR_TRANSACAO"] = pd.to_numeric(df["VALOR_TRANSACAO"].fillna(0), errors="coerce").fillna(0)

    # Normaliza valor (log)
    df["_valor_norm"] = _normalize_series(df["VALOR_TRANSACAO"], method="log")

    # Frequência por titular (quantidade de transações do mesmo CPF/CNPJ)
    key_titular = "CPF_CNPJ_TITULAR" if "CPF_CNPJ_TITULAR" in df.columns else ("NOME_TITULAR" if "NOME_TITULAR" in df.columns else None)
    if key_titular:
        freq = df.groupby(key_titular).size().rename("freq_titular")
        df = df.merge(freq, how="left", left_on=key_titular, right_index=True)
    else:
        df["freq_titular"] = 1
    df["_freq_norm"] = _normalize_series(df["freq_titular"], method="log")

    # Tipologia -> pontuação
    if "TIPOLOGIA_ORIGEM" in df.columns:
        df["_tipologia_score"] = df["TIPOLOGIA_ORIGEM"].map(_typology_score).fillna(0.3)
    else:
        df["_tipologia_score"] = 0.1

    # Recência: se houver DATA_TRANSACAO, calcula dias desde última transação do titular
    if "DATA_TRANSACAO" in df.columns:
        df["__data_txn_parsed"] = pd.to_datetime(df["DATA_TRANSACAO"], dayfirst=True, errors="coerce")
        if df["__data_txn_parsed"].notna().any():
            today = pd.to_datetime('now', utc=True).tz_convert('America/Sao_Paulo')
            df["__recency_days"] = (today - df["__data_txn_parsed"]).dt.days.clip(lower=0).fillna(99999)
            df["_recency_norm"] = 1 - _normalize_series(df["__recency_days"], method="minmax")
        else:
            df["_recency_norm"] = 0.0
    else:
        df["_recency_norm"] = 0.0

    # Unusual account / banco: flag 1 se titular usa múltiplos bancos/agências/contas
    col_banco = "NOME_BANCO" if "NOME_BANCO" in df.columns else None
    col_ag = "NUMERO_AGENCIA" if "NUMERO_AGENCIA" in df.columns else None
    col_ct = "NUMERO_CONTA" if "NUMERO_CONTA" in df.columns else None

    if key_titular and (col_banco or col_ag or col_ct):
        def _account_id(r):
            parts = []
            if col_banco: parts.append(str(r.get(col_banco, "") or ""))
            if col_ag: parts.append(str(r.get(col_ag, "") or ""))
            if col_ct: parts.append(str(r.get(col_ct, "") or ""))
            return "|".join(parts).strip("|")

        df["_account_id"] = df.apply(_account_id, axis=1)
        unique_accounts = df.groupby(key_titular)["_account_id"].nunique().rename("unique_accounts")
        df = df.merge(unique_accounts, how="left", left_on=key_titular, right_index=True)
        df["_unusual_flag"] = (df["unique_accounts"] > 1).astype(float)
    else:
        df["_unusual_flag"] = 0.0

    # Computa score final
    valor = df["_valor_norm"].fillna(0)
    freq_n = df["_freq_norm"].fillna(0)
    tip = df["_tipologia_score"].fillna(0)
    rec = df["_recency_norm"].fillna(0)
    unus = df["_unusual_flag"].fillna(0)

    raw_score = (w_valor * valor) + (w_freq * freq_n) + (w_tipologia * tip) + (w_recencia * rec) + (w_unusual * unus)
    df["SCORE_SUSPEITA_RAW"] = raw_score
    df["SCORE_SUSPEITA"] = _normalize_series(df["SCORE_SUSPEITA_RAW"], method="minmax")

    return df

def render_scoring(df_suspeitas):
    st.header("🔎 Ranking de Suspeição — pontuação por transação")

    # === Sidebar ===
    st.sidebar.subheader("⚙️ Ajuste de pesos do Score")
    w1 = st.sidebar.slider("Peso: Valor", 0.0, 1.0, 0.4, step=0.05)
    w2 = st.sidebar.slider("Peso: Frequência", 0.0, 1.0, 0.2, step=0.05)
    w3 = st.sidebar.slider("Peso: Tipologia", 0.0, 1.0, 0.25, step=0.05)
    w4 = st.sidebar.slider("Peso: Recência", 0.0, 1.0, 0.1, step=0.05)
    w5 = st.sidebar.slider("Peso: Unusual", 0.0, 1.0, 0.05, step=0.05)

    st.sidebar.subheader("🔝 Top N transações")
    top_n = st.sidebar.number_input("Mostrar top N", min_value=5, max_value=500, value=20, step=5)

    st.sidebar.subheader("📋 Seleção de colunas")
    preferred = [
        "SCORE_SUSPEITA", "VALOR_TRANSACAO", "NOME_TITULAR", "CPF_CNPJ_TITULAR",
        "TIPOLOGIA_ORIGEM", "NOME_BANCO", "LOCAL_TRANSACAO_LIMPO", "DATA_TRANSACAO"
    ]
    colunas_disponiveis = df_suspeitas.columns.tolist()
    colunas_padrao = [col for col in preferred if col in colunas_disponiveis]
    colunas_selecionadas = st.sidebar.multiselect(
        "Colunas a exibir",
        options=colunas_disponiveis,
        default=colunas_padrao
    )

    # === Fórmula do Score ===
    st.subheader("📊 Fórmula Geral do Score de Suspeição")
    st.markdown(
        f"""
        O score de suspeição é calculado como:

        $$
        \\text{{SCORE}} = 
        w_1 \\cdot V + 
        w_2 \\cdot F + 
        w_3 \\cdot T + 
        w_4 \\cdot R + 
        w_5 \\cdot U
        $$

        Onde:
        - $V$ = Valor normalizado da transação  
        - $F$ = Frequência de transações por titular (normalizada)  
        - $T$ = Pontuação da tipologia  
        - $R$ = Recência da transação (normalizada)  
        - $U$ = Indicador de contas incomuns / múltiplas  

        Pesos atuais usados:  
        $w_1={w1}, w_2={w2}, w_3={w3}, w_4={w4}, w_5={w5}$
        """,
        unsafe_allow_html=True
    )

    # === Cálculo do Score ===
    with st.spinner("Calculando scores..."):
        df_scored = compute_suspicion_score(
            df_suspeitas,
            w_valor=w1,
            w_freq=w2,
            w_tipologia=w3,
            w_recencia=w4,
            w_unusual=w5
        )

    # === Top transações e tabela ===
    st.subheader(f"🏆 Top {int(top_n)} transações mais suspeitas")
    df_top = df_scored.sort_values("SCORE_SUSPEITA", ascending=False).head(int(top_n)).copy()
    df_top_display = df_top[colunas_selecionadas].copy()

    df_top_display["SCORE (%)"] = (df_top["SCORE_SUSPEITA"] * 100).round(1)

    # Garante que SCORE fique na frente
    cols = ["SCORE (%)"] + [c for c in df_top_display.columns if c != "SCORE (%)"]
    df_top_display = df_top_display[cols]

    if "VALOR_TRANSACAO" in df_top_display.columns:
        df_top_display["VALOR_TRANSACAO"] = df_top_display["VALOR_TRANSACAO"].apply(formatar_valor)

    paginate_dataframe(df_top_display)

    # Barras/Distribuição
    st.subheader("Distribuição de scores")
    try:
        import altair as alt
        chart_df = df_scored[["SCORE_SUSPEITA"]].copy()
        hist = alt.Chart(chart_df).mark_bar().encode(
            alt.X("SCORE_SUSPEITA:Q", bin=alt.Bin(maxbins=30), title="Score (0..1)"),
            alt.Y("count()", title="Número de transações")
        ).properties(title="Distribuição dos Scores de Suspeita")
        st.altair_chart(hist, use_container_width=True)
    except Exception:
        st.write("Gráfico de distribuição indisponível (Altair não instalado).")

    # Gráfico por tipologia
    if "TIPOLOGIA_ORIGEM" in df_scored.columns:
        st.subheader("Score médio por tipologia")
        mean_by_tipo = df_scored.groupby("TIPOLOGIA_ORIGEM")["SCORE_SUSPEITA"].mean().reset_index().sort_values("SCORE_SUSPEITA", ascending=False)
        
        fig = px.bar(
            mean_by_tipo, 
            x="TIPOLOGIA_ORIGEM", 
            y="SCORE_SUSPEITA",
            title="Score Médio de Suspeita por Tipologia de Origem",
            labels={"TIPOLOGIA_ORIGEM": "Tipologia", "SCORE_SUSPEITA": "Score Médio"}
        )
        st.plotly_chart(fig, use_container_width=True)

    return df_scored

    