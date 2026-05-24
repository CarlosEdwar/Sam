"use client";

import { useState } from "react";

const sizes = ["PP", "P", "M", "G", "GG", "XGG", "36", "38", "40", "42", "44", "46"];

export default function CriarEtiquetaPage() {
  const [produto, setProduto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      setLoading(false);
      alert("Etiqueta criada com sucesso!");
    }, 1000);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Nova Etiqueta</h3>
          <p className="text-sm text-dark-secondary mt-1">
            Preencha os dados para criar uma nova etiqueta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="produto" className="block text-sm font-medium text-dark mb-2">
                Produto *
              </label>
              <input
                id="produto"
                type="text"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nome do produto"
                required
              />
            </div>

            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-dark mb-2">
                Código
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Código único"
              />
            </div>

            <div>
              <label htmlFor="tamanho" className="block text-sm font-medium text-dark mb-2">
                Tamanho *
              </label>
              <select
                id="tamanho"
                value={tamanho}
                onChange={(e) => setTamanho(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Selecione</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cor" className="block text-sm font-medium text-dark mb-2">
                Cor
              </label>
              <input
                id="cor"
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cor do produto"
              />
            </div>

            <div>
              <label htmlFor="quantidade" className="block text-sm font-medium text-dark mb-2">
                Quantidade *
              </label>
              <input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 bg-dark-bg rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-dark-secondary mb-4">Preview</h4>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 max-w-sm">
              <div className="text-center">
                <p className="text-xs text-dark-secondary uppercase">Sam</p>
                <p className="text-lg font-bold text-dark mt-2">{produto || "Produto"}</p>
                <p className="text-sm text-dark-secondary">{codigo || "Código"}</p>
                <div className="mt-4 inline-block px-4 py-1 bg-gray-100 rounded">
                  <span className="text-lg font-bold text-dark">{tamanho || "--"}</span>
                </div>
                <p className="text-xs text-dark-secondary mt-2">{cor || "Cor"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Etiqueta"}
            </button>
            <button
              type="button"
              className="py-3 px-6 border border-gray-200 text-dark hover:bg-gray-50 font-medium rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}