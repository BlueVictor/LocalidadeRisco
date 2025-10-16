from fpdf import FPDF
from formatadores import formatar_valor
import matplotlib.pyplot as plt
import tempfile

def gerar_pdf(df_resumo, valor_total, nome_arquivo="relatorio_avancado.pdf"):
    pdf = FPDF()
    pdf.add_page()
    
    # Cabeçalho
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Relatório de Transações Suspeitas", ln=1, align="C")
    pdf.ln(10)

    # Resumo executivo
    pdf.set_font("Helvetica", "", 12)
    resumo_texto = (
        f"Foram detectadas {df_resumo['count'].sum()} transações suspeitas "
        f"totalizando R$ {formatar_valor(valor_total)}. "
        f"A maior concentração foi em {df_resumo.iloc[0]['TIPOLOGIA_ORIGEM']}."
    )
    pdf.multi_cell(0, 10, resumo_texto)
    pdf.ln(5)

    # Tabela
    pdf.set_font("Helvetica", "", 12)
    for _, row in df_resumo.iterrows():
        valor_formatado = row['VALOR_TRANSACAO']
        if not isinstance(valor_formatado, str):
            valor_formatado = formatar_valor(valor_formatado)
        pdf.cell(0, 10, f"{row['TIPOLOGIA_ORIGEM']}: {row['count']} transações, total R$ {valor_formatado}", ln=1)

    # Salvar PDF
    pdf.output(nome_arquivo)
    return nome_arquivo
