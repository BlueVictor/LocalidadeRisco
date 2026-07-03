import os
from datetime import datetime
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.legends import Legend

CORES = {
    "primaria": HexColor("#003366"),
    "secundaria": HexColor("#F4F4F4"),
    "borda": HexColor("#DDDDDD"),
    "texto": HexColor("#333333"),
    "grafico": [
        HexColor("#003366"), HexColor("#00509E"), HexColor("#0073E6"), 
        HexColor("#4D94FF"), HexColor("#99C2FF"), HexColor("#B3D1FF"),
        HexColor("#1A2E40"), HexColor("#32597A"), HexColor("#5C85A6")
    ]
}

styles = getSampleStyleSheet()
style_celula = ParagraphStyle('Celula', parent=styles['Normal'], fontSize=9, leading=11)
style_celula_centro = ParagraphStyle('CelulaCentro', parent=style_celula, alignment=TA_CENTER)
style_celula_direita = ParagraphStyle('CelulaDireita', parent=style_celula, alignment=TA_RIGHT)

# Função para formatar valores no padrão brasileiro
def formatar_moeda_pdf(valor):
    if pd.isna(valor) or valor is None: return "R$ 0,00"
    try:
        return f"R$ {float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return str(valor)

# Função para limpar e padronizar textos
def limpar_texto(texto):
    # Se for nulo, retorna o traço
    if pd.isna(texto) or texto is None:
        return "-"
    
    texto_str = str(texto).strip()
    
    # Caça as "sujeiras" que o Pandas ou o extrator geram
    palavras_vazias = ["", "nan", "none", "n/d", "n/a", "null", "<na>", "desconhecido"]
    if texto_str.lower() in palavras_vazias:
        return "-"
        
    # Se for uma UF, deixa tudo maiúsculo. Se for nome, formata as iniciais.
    if len(texto_str) == 2:
        return texto_str.upper()
    elif len(texto_str) > 2:
        # Transforma "BANCO DO BRASIL" em "Banco Do Brasil", por exemplo.
        return texto_str.title()
        
    return texto_str

# Função para adicionar rodapé com data e número da página
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor("#999999"))
    data_str = datetime.now().strftime('%d/%m/%Y %H:%M')
    canvas.drawString(40, 30, f"Gerado em {data_str}")
    canvas.drawRightString(A4[0] - 40, 30, f"Pág. {doc.page}")
    canvas.line(40, 45, A4[0] - 40, 45)
    canvas.restoreState()

# Função para criar gráfico de pizza
def criar_grafico_pizza(df_resumo):
    if df_resumo is None or df_resumo.empty:
        return Spacer(1, 1)

    drawing = Drawing(400, 180)
    
    dados_valor = df_resumo['count'].fillna(0).tolist()
    labels = df_resumo['TIPOLOGIA_ORIGEM'].apply(limpar_texto).tolist()
    
    # Evita quebra se todos os valores forem zero
    if sum(dados_valor) == 0:
        return Spacer(1, 1)
        
    pc = Pie()
    pc.x = 60
    pc.y = 10
    pc.width = 120
    pc.height = 120
    pc.data = dados_valor
    pc.labels = None 
    pc.slices.strokeWidth = 0.5
    pc.slices.strokeColor = white
    
    lista_cores_legenda = []
    
    for i in range(len(dados_valor)):
        cor_atual = CORES["grafico"][i % len(CORES["grafico"])]
        pc.slices[i].fillColor = cor_atual
        if i < len(labels):
            lista_cores_legenda.append((cor_atual, labels[i]))
            
    drawing.add(pc)

    legenda = Legend()
    legenda.x = 210
    legenda.y = 130
    legenda.dx = 8
    legenda.dy = 8
    legenda.fontName = 'Helvetica'
    legenda.fontSize = 9
    legenda.boxAnchor = 'nw'
    legenda.columnMaximum = 8
    legenda.colorNamePairs = lista_cores_legenda

    drawing.add(legenda)
    return drawing

# Função para criar tabela com estilo padrão
def criar_tabela_padrao(dados, col_widths, alinhar_direita=True):
    t = Table(dados, colWidths=col_widths, repeatRows=1)
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), CORES["primaria"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, CORES["secundaria"]]),
        ('GRID', (0, 0), (-1, -1), 0.5, CORES["borda"]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]
    if alinhar_direita:
        estilo.append(('ALIGN', (-1, 1), (-1, -1), 'RIGHT')) 
        estilo.append(('ALIGN', (0, 1), (-2, -1), 'LEFT'))   
    else:
        estilo.append(('ALIGN', (0, 1), (-1, -1), 'CENTER'))

    t.setStyle(TableStyle(estilo))
    return t

# Função principal para gerar o PDF
def gerar_pdf(df_resumo, valor_total, df_bancos=None, df_municipios=None, df_titulares=None, df_estados=None, nome_arquivo="relatorio_suspeitas.pdf"):
    
    doc = SimpleDocTemplate(
        nome_arquivo,
        pagesize=A4,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=50
    )

    elementos = []

    style_titulo = ParagraphStyle('Titulo', parent=styles['Heading1'], fontSize=20, textColor=CORES["primaria"], alignment=TA_CENTER, spaceAfter=10)
    style_h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, spaceBefore=15, spaceAfter=8, textColor=CORES["primaria"])
    style_destaque = ParagraphStyle('Destaque', parent=styles['Normal'], fontSize=10, leading=14, backColor=CORES["secundaria"], borderPadding=10, borderRadius=5, spaceBefore=10, spaceAfter=10, alignment=TA_JUSTIFY)

    # Cabeçalho
    elementos.append(Paragraph("RELATÓRIO DE ANÁLISE FINANCEIRA", style_titulo))
    elementos.append(Paragraph("Monitoramento de Transações Atípicas", ParagraphStyle('Sub', parent=styles['Normal'], alignment=TA_CENTER, fontSize=11)))
    elementos.append(Spacer(1, 15))

    # Resumo
    elementos.append(Paragraph("Resumo Executivo", style_h2))
    
    total_transacoes = df_resumo["count"].sum() if (df_resumo is not None and not df_resumo.empty) else 0
    top_tipo = limpar_texto(df_resumo.iloc[0]["TIPOLOGIA_ORIGEM"]) if (df_resumo is not None and not df_resumo.empty) else "N/A"

    texto_resumo = f"""
    O sistema detectou um total de <b>{total_transacoes}</b> transações suspeitas, movimentando 
    <b>{formatar_moeda_pdf(valor_total)}</b>. A tipologia de maior incidência foi <b>"{top_tipo}"</b>.
    """
    elementos.append(Paragraph(texto_resumo, style_destaque))

    # Gráfico
    if df_resumo is not None and not df_resumo.empty:
        try:
            elementos.append(criar_grafico_pizza(df_resumo))
        except Exception as e:
            print(f"Erro ao gerar gráfico: {e}")
        elementos.append(Spacer(1, 10))
    
    # Tipologia
    elementos.append(Paragraph("Detalhamento por Tipologia", style_h2))
    dados_tip = [["Tipologia", "Qtd.", "Valor Total"]]
    if df_resumo is not None and not df_resumo.empty:
        for _, row in df_resumo.iterrows():
            dados_tip.append([
                Paragraph(limpar_texto(row.get("TIPOLOGIA_ORIGEM")), style_celula),
                Paragraph(str(row.get("count", 0)), style_celula_centro),
                Paragraph(formatar_moeda_pdf(row.get("VALOR_TRANSACAO", 0)), style_celula_direita)
            ])
    t_tip = criar_tabela_padrao(dados_tip, [250, 60, 150], alinhar_direita=True)
    elementos.append(t_tip)

    # Estados
    if df_estados is not None and not df_estados.empty:
        elementos.append(Spacer(1, 15))
        elementos.append(Paragraph("Concentração Geográfica (Estados)", style_h2))
        
        dados_uf = [["Estado (UF)", "Alertas", "% do Total"]]
        total_alertas = df_estados["count"].sum()
        
        for _, row in df_estados.iterrows():
            pct = (row["count"] / total_alertas * 100) if total_alertas > 0 else 0
            dados_uf.append([
                Paragraph(limpar_texto(row.get("UF")), style_celula_centro),
                Paragraph(str(row.get("count", 0)), style_celula_centro),
                Paragraph(f"{pct:.1f}%", style_celula_centro)
            ])
        t_uf = criar_tabela_padrao(dados_uf, [200, 100, 160], alinhar_direita=False)
        elementos.append(t_uf)

    # Bancos
    if df_bancos is not None and not df_bancos.empty:
        elementos.append(Paragraph("Risco Institucional: Top Bancos", style_h2))
        dados_banco = [["Instituição Financeira", "Alertas", "Volume Envolvido"]]
        for _, row in df_bancos.iterrows():
            dados_banco.append([
                Paragraph(limpar_texto(row.get("NOME_BANCO")), style_celula),
                Paragraph(str(row.get("count", 0)), style_celula_centro),
                Paragraph(formatar_moeda_pdf(row.get("VALOR_TRANSACAO", 0)), style_celula_direita)
            ])
        t_banco = criar_tabela_padrao(dados_banco, [230, 80, 150], alinhar_direita=True)
        elementos.append(t_banco)

    elementos.append(Spacer(1, 15))

    # Municípios
    if df_municipios is not None and not df_municipios.empty:
        elementos.append(Paragraph("Top 10 Municípios de Risco", style_h2))
        dados_mun = [["Município", "Valor Total"]]
        for _, row in df_municipios.iterrows():
            dados_mun.append([
                Paragraph(limpar_texto(row.get("CIDADE_LIMPA")), style_celula),
                Paragraph(formatar_moeda_pdf(row.get("VALOR_TRANSACAO", 0)), style_celula_direita)
            ])
        elementos.append(criar_tabela_padrao(dados_mun, [300, 160], alinhar_direita=True))
        elementos.append(Spacer(1, 15))

    # Titulares
    if df_titulares is not None and not df_titulares.empty:
        elementos.append(Paragraph("Top 10 Titulares (Maiores Volumes)", style_h2))
        dados_tit = [["Nome do Titular", "Valor Total"]]
        for _, row in df_titulares.iterrows():
            dados_tit.append([
                Paragraph(limpar_texto(row.get("NOME_TITULAR")), style_celula),
                Paragraph(formatar_moeda_pdf(row.get("VALOR_TRANSACAO", 0)), style_celula_direita)
            ])
        elementos.append(criar_tabela_padrao(dados_tit, [300, 160], alinhar_direita=True))

    try:
        doc.build(elementos, onFirstPage=on_page, onLaterPages=on_page)
        return nome_arquivo
    except Exception as e:
        print(f"Erro PDF: {e}")
        return None