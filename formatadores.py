import pandas as pd
import unicodedata

# Formatar valores no padrão brasileiro
def formatar_valor(valor):
    if pd.isna(valor):
        return ""
    return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# Remover acentos
def remover_acentos(txt):
    if not isinstance(txt, str):
        return txt
    return ''.join(c for c in unicodedata.normalize('NFKD', txt) if not unicodedata.combining(c))
