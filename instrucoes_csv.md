### Como Preparar seu Arquivo CSV para o Upload

Para garantir que a análise funcione corretamente, seu arquivo precisa seguir algumas regras de formatação.

#### **Regras Gerais**
1.  **Formato do Arquivo:** O arquivo deve ser do tipo **CSV (Valores Separados por Ponto e Vírgula)**.
2.  **Separador de Colunas:** Utilize **ponto e vírgula (`;`)** para separar as colunas. Este é o padrão ao salvar como "CSV" em versões do Excel em português.
3.  **Codificação:** O arquivo deve ser salvo com a codificação **UTF-8** para garantir que acentos e caracteres especiais (como `Ç` e `Ã`) sejam lidos corretamente.
4.  **Cabeçalho:** A primeira linha do arquivo **deve** conter os nomes exatos das colunas.

---

#### **Estrutura das Colunas**

| Nome da Coluna | Obrigatório? | Formato Esperado | Exemplo |
| :--- | :--- | :--- | :--- |
| **`VALOR_TRANSACAO`** | **Sim** | Numérico, com vírgula para centavos. | `150000,50` |
| **`LOCAL_TRANSACAO`** | **Sim** | Texto (Nome do município). | `Foz do Iguaçu` |
| **`NOME_TITULAR`** | Recomendado | Texto. | `Maria da Silva` |
| **`CPF_CNPJ_TITULAR`** | Recomendado | Texto ou Número (sem pontos ou traços). | `12345678900` |
| **`NOME_BANCO`** | Recomendado | Texto. | `Banco do Brasil S.A` |
| **`DATA_TRANSACAO`** | Recomendado | Data (`DD/MM/AAAA` ou `AAAA-MM-DD`). | `25/12/2024` |
| **`LOCAL_DESTINO`** | Opcional | Texto (Nome do município). | `São Paulo` |
| **`NUMERO_AGENCIA`** | Opcional | Texto ou Número. | `0123-4` |
| **`NUMERO_CONTA`** | Opcional | Texto ou Número. | `54321-0` |

---

#### **Exemplo de CSV Válido:**

```csv
VALOR_TRANSACAO;LOCAL_TRANSACAO;NOME_TITULAR;CPF_CNPJ_TITULAR;NOME_BANCO;DATA_TRANSACAO
150000,50;Parauapebas;JOAO PEREIRA;11122233300;BANCO Y;20/09/2025
75300,00;Ponta Porã;MARIA DA SILVA;22233344400;BANCO X;21/09/2025
31000,25;Foz do Iguaçu;CARLOS ALMEIDA;11122233300;BANCO Z;22/09/2025