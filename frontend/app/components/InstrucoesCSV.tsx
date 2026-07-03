export default function InstrucoesCSV() {
  return (
    
    <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">

      <h3 className="text-lg font-bold mb-4">Como Preparar o seu Ficheiro CSV para Upload</h3>
      <p className="mb-4">Para garantir que a análise funcione corretamente, o seu ficheiro precisa de seguir algumas regras de formatação.</p>
      
      <h4 className="font-bold mt-4 mb-2">Regras Gerais</h4>
      <ul className="list-decimal pl-5 space-y-1 mb-6">
        <li><strong>Formato do Ficheiro:</strong> O ficheiro deve ser do tipo <strong>CSV (Valores Separados por Ponto e Vírgula)</strong>.</li>
        <li><strong>Separador de Colunas:</strong> Utilize <strong>ponto e vírgula (;)</strong> para separar as colunas.</li>
        <li><strong>Codificação:</strong> O ficheiro deve ser guardado com a codificação <strong>UTF-8</strong>.</li>
        <li><strong>Cabeçalho:</strong> A primeira linha do ficheiro <strong>deve</strong> conter os nomes exatos das colunas.</li>
      </ul>

      <h4 className="font-bold mb-2">Estrutura das Colunas</h4>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2 border">Nome da Coluna</th>
              <th className="p-2 border">Obrigatório?</th>
              <th className="p-2 border">Formato Esperado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border font-mono text-blue-700">VALOR_TRANSACAO</td>
              <td className="p-2 border font-bold text-red-600">Sim</td>
              <td className="p-2 border">Numérico, com vírgula para centavos.</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-blue-700">LOCAL_TRANSACAO</td>
              <td className="p-2 border font-bold text-red-600">Sim</td>
              <td className="p-2 border">Texto (Nome do município).</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">NOME_TITULAR</td>
              <td className="p-2 border font-semibold text-amber-600">Recomendado</td>
              <td className="p-2 border">Texto.</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">CPF_CNPJ_TITULAR</td>
              <td className="p-2 border font-semibold text-amber-600">Recomendado</td>
              <td className="p-2 border">Texto ou Número (sem pontos ou traços).</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">NOME_BANCO</td>
              <td className="p-2 border font-semibold text-amber-600">Recomendado</td>
              <td className="p-2 border">Texto.</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">DATA_TRANSACAO</td>
              <td className="p-2 border font-semibold text-amber-600">Recomendado</td>
              <td className="p-2 border">Data (<code>DD/MM/AAAA</code> ou <code>AAAA-MM-DD</code>).</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">LOCAL_DESTINO</td>
              <td className="p-2 border text-slate-500">Opcional</td>
              <td className="p-2 border">Texto (Nome do município).</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">NUMERO_AGENCIA</td>
              <td className="p-2 border text-slate-500">Opcional</td>
              <td className="p-2 border">Texto ou Número.</td>
            </tr>
            <tr>
              <td className="p-2 border font-mono text-slate-700">NUMERO_CONTA</td>
              <td className="p-2 border text-slate-500">Opcional</td>
              <td className="p-2 border">Texto ou Número.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-bold mb-2">Exemplo de CSV Válido:</h4>
      <div className="bg-slate-900 rounded-md p-4 overflow-x-auto">
        <pre className="text-emerald-400 font-mono text-sm">
          <code>
{`VALOR_TRANSACAO;LOCAL_TRANSACAO;NOME_TITULAR;CPF_CNPJ_TITULAR;NOME_BANCO;DATA_TRANSACAO
150000,50;Parauapebas;JOAO PEREIRA;11122233300;BANCO Y;20/09/2025
75300,00;Ponta Porã;MARIA DA SILVA;22233344400;BANCO X;21/09/2025
31000,25;Foz do Iguaçu;CARLOS ALMEIDA;11122233300;BANCO Z;22/09/2025`}
          </code>
        </pre>
      </div>
    </div>
  );
}