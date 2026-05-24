'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Card, Badge } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  price?: number;
  valid_until?: string;
}

export default function EtiquetasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);

  // Função de impressão - usando window.print() nativo
  const handlePrint = () => {
    if (!componentRef.current) return;
    
    const printContent = componentRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="width: 200px; height: 120px; font-size: 10px;">
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Recarrega para restaurar eventos
  };

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    
    try {
      // Em produção, isso viria do Supabase
      // Aqui estamos simulando dados para demonstração
      const mockProducts: Product[] = [
        { id: '1', name: 'Hambúrguer Artesanal', sku: 'HB001', stock_qty: 50, price: 29.90 },
        { id: '2', name: 'Batata Frita', sku: 'BF001', stock_qty: 100, price: 15.90 },
        { id: '3', name: 'Refrigerante Lata', sku: 'RC001', stock_qty: 200, price: 6.90 },
        { id: '4', name: 'Cerveja Artesanal', sku: 'CA001', stock_qty: 80, price: 18.90 },
        { id: '5', name: 'Salada Caesar', sku: 'SC001', stock_qty: 30, price: 22.90 },
      ];
      
      setProducts(mockProducts);
    } catch (err) {
      setError('Erro ao carregar produtos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePrintLabel() {
    if (!selectedProduct) {
      setError('Selecione um produto para imprimir');
      return;
    }
    
    if (quantity < 1 || quantity > 100) {
      setError('Quantidade deve ser entre 1 e 100');
      return;
    }

    handlePrint();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Impressão de Etiquetas</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de Produto */}
        <Card title="Selecionar Produto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produto
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um produto...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade de Etiquetas
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button 
              onClick={handlePrintLabel} 
              disabled={!selectedProduct}
              className="w-full"
            >
              Imprimir Etiqueta(s)
            </Button>
          </div>
        </Card>

        {/* Preview da Etiqueta */}
        <Card title="Preview da Etiqueta">
          {selectedProduct ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Visualização de como a etiqueta será impressa (tamanho real pode variar conforme configuração da impressora)
              </p>
              
              {/* Área de impressão - Formato 50mm x 30mm */}
              <div className="border-2 border-dashed border-gray-300 p-4 bg-white">
                <div 
                  ref={componentRef}
                  className="w-[200px] h-[120px] flex flex-col justify-between p-2 text-xs"
                  style={{ fontSize: '10px' }}
                >
                  <div className="text-center border-b pb-1">
                    <h3 className="font-bold" style={{ fontSize: '12px' }}>
                      {selectedProduct.name}
                    </h3>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div><strong>SKU:</strong> {selectedProduct.sku}</div>
                      {selectedProduct.price && (
                        <div><strong>Preço:</strong> R$ {selectedProduct.price.toFixed(2)}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div><strong>Estoque:</strong></div>
                      <div className="font-bold text-lg">{selectedProduct.stock_qty}</div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-1 border-t">
                    <div className="font-mono text-[8px]">
                      *{selectedProduct.sku}*
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                <strong>Dica:</strong> Configure sua impressora térmica para papel 50mm x 30mm 
                e margens mínimas para melhor resultado.
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Selecione um produto para visualizar o preview</p>
            </div>
          )}
        </Card>
      </div>

      {/* Lista de Produtos Disponíveis */}
      <Card title="Produtos Disponíveis">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Carregando...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum produto cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{product.sku}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{product.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {product.price ? `R$ ${product.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{product.stock_qty}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.stock_qty > 20 ? (
                        <Badge variant="success">Em estoque</Badge>
                      ) : product.stock_qty > 5 ? (
                        <Badge variant="warning">Baixo estoque</Badge>
                      ) : (
                        <Badge variant="danger">Crítico</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Instruções de Impressão */}
      <Card title="Configurações de Impressão">
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Tamanho do Papel Recomendado:</strong> 50mm x 30mm (etiqueta térmica)
          </div>
          <div>
            <strong>Configurações da Impressora:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Margens: Mínimas ou Nenhuma</li>
              <li>Escala: 100% (não ajustar)</li>
              <li>Orientação: Paisagem</li>
              <li>Qualidade: Alta</li>
            </ul>
          </div>
          <div>
            <strong>Modelos Compatíveis:</strong> Elgin L42, Zebra GK420d, Brother QL-700, ou qualquer impressora térmica com suporte a etiquetas.
          </div>
        </div>
      </Card>
    </div>
  );
}
