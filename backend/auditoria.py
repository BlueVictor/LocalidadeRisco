import pandas as pd

# Função para detectar indícios de smurfing (fracionamento de transações) em um DataFrame
def detectar_smurfing(df, janela='1D', limite_valor=50000, limite_qtde=3):

    if "DATA_TRANSACAO" not in df.columns:
        return pd.DataFrame()

    if not pd.api.types.is_datetime64_any_dtype(df['DATA_TRANSACAO']):
        df['DATA_TRANSACAO'] = pd.to_datetime(df['DATA_TRANSACAO'], dayfirst=True, errors='coerce')
    
    df_valid = df.dropna(subset=['DATA_TRANSACAO', 'CPF_CNPJ_TITULAR']).copy()
    df_sorted = df_valid.sort_values('DATA_TRANSACAO')
    
    resultados = []
    
    # Agrupa por CPF para analisar comportamento individual
    for cpf, grupo in df_sorted.groupby("CPF_CNPJ_TITULAR"):
        grupo = grupo.set_index("DATA_TRANSACAO")
        
        # Calcula soma e contagem móvel das transações dentro da janela de tempo especificada
        soma_movel = grupo['VALOR_TRANSACAO'].rolling(janela).sum()
        qtde_movel = grupo['VALOR_TRANSACAO'].rolling(janela).count()
        
        # Identifica registros que excedem os limites de valor e quantidade
        mask_suspeita = (soma_movel > limite_valor) & (qtde_movel >= limite_qtde)
        suspeitos = soma_movel[mask_suspeita]
        
        if not suspeitos.empty:
            # Pega o último registro da série suspeita para reportar
            data_alerta = suspeitos.index[-1]
            valor_acumulado = suspeitos.iloc[-1]
            
            resultados.append({
                "CPF_CNPJ_TITULAR": cpf,
                "DATA_ALERTA": data_alerta,
                "VALOR_ACUMULADO": valor_acumulado,
                "TIPO_ALERTA": "Indício de Smurfing (Fracionamento)",
                "DETALHE": f"Acumulou R$ {valor_acumulado:,.2f} em {janela}"
            })
            
    return pd.DataFrame(resultados)