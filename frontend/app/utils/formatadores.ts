// Função para formatar valores numéricos em formato brasileiro (com vírgula como separador decimal e ponto como separador de milhar)
export function formatarValor(valor: number | string | null): string {
    if (valor === null || valor === undefined || valor === "") return "";
    const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
    if (isNaN(num)) return "";
    
    // Utiliza o Intl.NumberFormat para formatar o número de acordo.
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
  }
  
  // Função para remover acentos de uma string
  export function removerAcentos(txt: string): string {
    if (!txt) return txt;
    // Utiliza a normalização Unicode para decompor os caracteres acentuados e remove os diacríticos.
    return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  }