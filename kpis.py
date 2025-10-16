import streamlit as st
from formatadores import formatar_valor

def mostrar_kpis(df):
    total_trans = len(df)
    valor_total = df["VALOR_TRANSACAO"].sum()
    ticket_medio = valor_total / total_trans if total_trans else 0
    col1, col2, col3 = st.columns(3)
    col1.metric("Transações Suspeitas", f"{total_trans:,}".replace(",", "."))
    col2.metric("Valor Total", f"R$ {formatar_valor(valor_total)}")
    col3.metric("Valor Médio", f"R$ {formatar_valor(ticket_medio)}")
