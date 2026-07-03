# LocalidadeRisco — Análise de Transações Suspeitas por Localidade de Risco

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-Interface-61DAFB?logo=react&logoColor=black)
![Pandas](https://img.shields.io/badge/Pandas-Data_Analysis-150458?logo=pandas&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-Tracking-0194E2)

Aplicação para análise de transações financeiras suspeitas com foco em **localidades de risco**, **tipologias territoriais**, **rotas críticas**, **scoring de suspeição**, **mapas**, **grafos relacionais**, **gestão de casos** e **exportação de relatórios**.

O projeto combina um backend em **FastAPI/Python** com um frontend em **Next.js/React**, permitindo carregar arquivos CSV, processar dados transacionais, classificar localidades, calcular indicadores, visualizar redes, gerar scores e exportar resultados operacionais.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Estrutura Recomendada do Projeto](#estrutura-recomendada-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Formato do CSV](#formato-do-csv)
- [Instalação](#instalação)
- [Executando a Aplicação](#executando-a-aplicação)
- [Modo Desktop](#modo-desktop)
- [Scoring de Suspeição](#scoring-de-suspeição)
- [Mapas e Grafos](#mapas-e-grafos)
- [Gestão de Casos](#gestão-de-casos)
- [Exportações](#exportações)
- [MLflow](#mlflow)
- [Solução de Problemas](#solução-de-problemas)
- [Autor](#autor)

---

## Visão Geral

O **LocalidadeRisco** foi desenvolvido para apoiar análises de prevenção à lavagem de dinheiro e investigação financeira, relacionando movimentações financeiras com localidades classificadas por risco.

A aplicação processa transações e identifica suspeitas a partir de critérios como:

- localidade de origem da transação;
- valor movimentado;
- frequência de operações por titular;
- tipologia territorial;
- recência da operação;
- rotas de risco e regiões sensíveis.

O resultado é apresentado em dashboards, tabelas paginadas, mapas interativos, grafo relacional, matriz de scoring, gestão de casos e relatórios exportáveis.

---

## Funcionalidades

### Upload e processamento de CSV

- Upload de arquivo CSV contendo transações financeiras.
- Detecção automática de separador `;` ou `,`.
- Normalização de nomes de colunas para maiúsculas.
- Conversão de valores monetários para formato numérico.
- Tratamento de datas em padrão brasileiro.
- Limpeza de nomes de municípios e localidades.
- Validação de colunas obrigatórias.

### Classificação territorial

Classificação das transações conforme listas e rotas de risco:

- **Região de Fronteira**
- **Região de Mineração**
- **Outra Região de Risco**
- **Rota Caipira**
- **Rota do Solimões**

### Indicadores e rankings

- Total de transações suspeitas.
- Valor total movimentado.
- Ticket médio.
- Ranking de tipologias.
- Ranking de municípios.
- Ranking de titulares.
- Ranking de bancos.
- Contagem de cidades afetadas.

### Scoring de suspeição

Cálculo de uma pontuação de risco para priorização operacional, considerando pesos ajustáveis para:

- valor;
- frequência;
- tipologia;
- recência;
- comportamento incomum.

### Mapas

- Mapa de tipologias por cidade.
- Mapa de conexões entre localidades.
- Destaque visual para rotas críticas.
- Visualização com marcadores, linhas e legenda por tipologia.

### Grafos

- Grafo de relacionamento entre tipologias e titulares.
- Nós coloridos por tipologia.
- Tamanho dos nós proporcional ao volume de transações.

### Gestão de casos

- Agrupamento de suspeitas por titular e CPF/CNPJ.
- Status de análise por caso.
- Campo de comentários.
- Persistência local de auditoria.
- Exportação de casos selecionados ou base completa.

### Exportações

- PDF analítico.
- CSV filtrado.
- CSV de titulares suspeitos.
- CSV de casos.
- CSV de scores.

### MLflow

- Registro de parâmetros.
- Registro de métricas.
- Registro de amostras de dados.
- Registro de artefatos.
- Hash do arquivo analisado.
- Organização por runs do pipeline.

---

## Arquitetura

A aplicação é composta por duas camadas principais:

```text
Frontend Next.js/React
        │
        │ HTTP / JSON
        ▼
Backend FastAPI/Python
        │
        ├── Processamento com pandas
        ├── Classificação de tipologias
        ├── Scoring de suspeição
        ├── Geração de mapas e grafos
        ├── Exportação PDF/CSV
        └── Registro MLflow
```

---

## Tecnologias Utilizadas

### Backend

- Python
- FastAPI
- Uvicorn
- Pandas
- NumPy
- NetworkX
- Geopy
- Folium
- ReportLab
- MLflow
- Pydantic

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Leaflet
- Vis Network / visualização de grafos

### Execução desktop

- PyWebView
- Uvicorn

---

## Formato do CSV

O arquivo deve preferencialmente estar em CSV com separador `;` e codificação UTF-8.

### Colunas obrigatórias

| Coluna | Obrigatória | Descrição |
|---|---:|---|
| `LOCAL_TRANSACAO` | Sim | Local ou município onde ocorreu a transação. |
| `VALOR_TRANSACAO` | Sim | Valor financeiro da transação. |

### Colunas recomendadas

| Coluna | Descrição |
|---|---|
| `DATA_TRANSACAO` | Data da operação, preferencialmente em formato brasileiro. |
| `LOCAL_DESTINO` | Localidade de destino, quando aplicável. |
| `NOME_TITULAR` | Nome do titular da transação. |
| `CPF_CNPJ_TITULAR` | Documento do titular. |
| `NOME_BANCO` | Banco ou instituição financeira associada. |

### Exemplo

```csv
DATA_TRANSACAO;NOME_TITULAR;CPF_CNPJ_TITULAR;VALOR_TRANSACAO;LOCAL_TRANSACAO;LOCAL_DESTINO;NOME_BANCO
10/01/2026;LUDOVICA BELLUCCI;2020522144;578000,00;CORUMBA MS;CAMPO GRANDE MS;Banco Exemplo
11/01/2026;VINCENTIO BRUNELLESCHI;18746927000130;260000,00;TABATINGA AM;MANAUS AM;Banco Exemplo
```

---

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/LocalidadeRisco.git
cd LocalidadeRisco
```

### 2. Criar ambiente virtual Python

No Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

No Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependências do backend

```bash
pip install -r requirements.txt
```

### 4. Instalar dependências do frontend

```bash
cd frontend
npm install
```

---

## Executando a Aplicação

A aplicação pode ser executada em modo desenvolvimento com backend e frontend separados.

### 1. Rodar o backend

Em um terminal:

```bash
cd backend/main
python main.py
```

### 2. Rodar o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

---

## Modo Desktop

O projeto também pode ser executado como uma janela local usando PyWebView.

```bash
python desktop.py
```

Esse modo:

1. inicia o backend FastAPI localmente;
2. aguarda a porta `8000` ficar disponível;
3. abre uma janela desktop apontando para `http://127.0.0.1:8000`.

## Scoring de Suspeição

O scoring atribui uma nota para priorização das transações suspeitas.

A fórmula conceitual é:

```text
SCORE = w_valor × Valor
      + w_freq × Frequência
      + w_tipologia × Tipologia
      + w_recencia × Recência
      + w_unusual × Incomum
```

Pesos padrão:

| Peso | Valor padrão | Significado |
|---|---:|---|
| `w_valor` | `0.40` | Peso do valor financeiro. |
| `w_freq` | `0.20` | Peso da frequência por titular. |
| `w_tipologia` | `0.25` | Peso da tipologia territorial. |
| `w_recencia` | `0.10` | Peso da recência da transação. |
| `w_unusual` | `0.05` | Peso de comportamento incomum. |

---

## Mapas e Grafos

### Mapa de tipologias

Apresenta cidades classificadas por tipo de risco:

- fronteira;
- mineração;
- outras regiões de risco;
- rotas caipira e solimões;

### Mapa de conexões

Constrói conexões entre cidades de uma mesma tipologia, permitindo visualizar rotas e agrupamentos geográficos.

### Grafo relacional

Representa visualmente:

- tipologias como nós centrais;
- titulares como entidades relacionadas;
- transações ou agregações como conexões;
- cores por tipologia;
- tamanhos proporcionais a volume ou relevância.

---

## Gestão de Casos

A gestão de casos permite acompanhar a análise operacional de titulares suspeitos.

Cada caso pode conter:

- nome do titular;
- CPF/CNPJ;
- valor total movimentado;
- quantidade de transações;
- status de análise;
- comentários do analista.

Status:

- `Pendente`
- `Em Análise`
- `Concluído`
- `Descartado`

As alterações são salvas localmente.

---

## Exportações

A aplicação permite exportar informações para uso operacional e documental.

### Tipos disponíveis

| Exportação |
|---|---|
| Relatório PDF |
| Base filtrada |
| Matriz de scores |
| Titulares suspeitos |
| Casos selecionados |
| Base completa de casos |

Por padrão, os arquivos salvos pelo backend são gravados na pasta **Downloads** do usuário.

---

## MLflow

O MLflow é utilizado para registrar a rastreabilidade do pipeline analítico.

São registrados:

- nome do arquivo processado;
- hash do arquivo;
- quantidade de registros;
- parâmetros de scoring;
- métricas de suspeição;
- amostras de bases processadas;
- amostras de bases suspeitas;
- artefatos auxiliares;
- exceções do pipeline.

Para abrir a interface do MLflow, use:

```bash
mlflow ui --host 127.0.0.1 --port 5000
```

A interface ficará disponível em:

```text
http://127.0.0.1:5000
```

---

## Solução de Problemas

### CSV rejeitado no upload

Verifique se o arquivo contém as colunas obrigatórias:

```text
LOCAL_TRANSACAO
VALOR_TRANSACAO
```

Também confirme se o arquivo está salvo como CSV e se os valores monetários usam formato esperado.

### Mapa demora para carregar

A geocodificação pode depender de consultas externas e cache local. Se muitas cidades novas forem processadas, a primeira execução pode ser mais lenta.

### Warnings de dependências

Avisos como `RequestsDependencyWarning` ou warnings do Pydantic podem não impedir a execução, mas devem ser revisados com atualização de dependências.

---

## Segurança e Privacidade

Este projeto pode processar dados sensíveis, como nomes, documentos e transações financeiras.

Recomendações:

- não versionar arquivos CSV reais;
- não subir `.env`;
- não subir bancos locais como `mlflow.db`;
- anonimizar dados antes de demonstrações públicas;
- revisar permissões do repositório;
- usar repositório privado para dados ou código sensível.

---

## Autor

**Victor Cauã**  
Projeto acadêmico de análise de transações suspeitas por localidade de risco.

---
