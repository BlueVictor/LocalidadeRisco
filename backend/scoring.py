import pandas as pd
import numpy as np

# Função para normalizar uma série pandas
def _normalize_series(s, method="minmax", eps=1e-9):
    s = s.fillna(0).astype(float)
    if method == "minmax":
        mn, mx = s.min(), s.max()
        if mx - mn < eps:
            return s*0.0
        return (s - mn) / (mx - mn)
    if method == "log":
        return np.log1p(s) / np.log1p(s.max() + eps)
    return s

# Função para formatar valores monetários
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

# Função principal para calcular o score de suspeição
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

    # Normalização do valor da transação (log)
    df["_valor_norm"] = _normalize_series(df["VALOR_TRANSACAO"], method="log")

    # Frequência de transações por titular
    key_titular = "CPF_CNPJ_TITULAR" if "CPF_CNPJ_TITULAR" in df.columns else ("NOME_TITULAR" if "NOME_TITULAR" in df.columns else None)
    if key_titular:
        freq = df.groupby(key_titular).size().rename("freq_titular")
        df = df.merge(freq, how="left", left_on=key_titular, right_index=True)
    else:
        df["freq_titular"] = 1
    df["_freq_norm"] = _normalize_series(df["freq_titular"], method="log")
    
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

    # Unusual: verifica se o titular possui múltiplas contas bancárias
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

    # Cálculo do score final
    valor = df["_valor_norm"].fillna(0)
    freq_n = df["_freq_norm"].fillna(0)
    tip = df["_tipologia_score"].fillna(0)
    rec = df["_recency_norm"].fillna(0)
    unus = df["_unusual_flag"].fillna(0)

    raw_score = (w_valor * valor) + (w_freq * freq_n) + (w_tipologia * tip) + (w_recencia * rec) + (w_unusual * unus)
    df["SCORE_SUSPEITA_RAW"] = raw_score
    df["SCORE_SUSPEITA"] = _normalize_series(df["SCORE_SUSPEITA_RAW"], method="minmax")

    return df