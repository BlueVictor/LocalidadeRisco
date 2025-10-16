# Relatório de Transações Suspeitas por localidade de risco
# 🚨 Relatório de Transações Suspeitas — Análise por Localidade de Risco (Tipologia 7A-7B-7C)

![Streamlit](https://img.shields.io/badge/Streamlit-App-red?logo=streamlit)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)
![License](https://img.shields.io/badge/license-MIT-green)

Aplicativo interativo desenvolvido em **Python + Streamlit** para análise de transações financeiras suspeitas, com base em **localidades sensíveis** (fronteira, mineração e outras regiões de risco) e **valores mínimos configuráveis**.

---

## ✨ Funcionalidades

- 📤 **Upload de CSV** com separador `;`
- 🧹 **Limpeza automática** de nomes de cidades (remoção de acentos e padronização)
- 📍 **Classificação** por tipologia de risco:
  - Região de Fronteira
  - Região de Mineração
  - Outra Região de Risco
  - Baixo Risco
- 💵 **Filtro interativo** de valor mínimo para considerar suspeita
- 🔎 **Filtros adicionais** por local de origem e/ou destino
- 📊 **Resumo estatístico** e gráfico de barras das tipologias mais comuns
- 🔗 **Grafo interativo** mostrando conexões entre tipologias e localidades
- 📄 **Exportação**:
  - CSV filtrado
  - PDF com resumo por tipologia

---

## 🖼️ Demonstração

> <img width="2489" height="1325" alt="image" src="https://github.com/user-attachments/assets/44c888b6-cdf6-44c7-a413-a6dc00d11613" />

---

## 📦 Instalação

### 1️⃣ Clonar o repositório

git clone https://github.com/seu-usuario/LocalidadeRisco.git

cd LocalidadeRisco

### 2️⃣ Instalar as dependências

executar no terminal o comando: 

pip install requeriments.txt

### 3️⃣ Rodando a aplicação

executar no terminal o comando: 

python -m streamlit run LocalidadeRisco.py
