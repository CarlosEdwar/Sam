export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">SaaS Restaurant</h1>
      <p className="text-xl text-gray-600">Sistema de Gestão para Restaurantes</p>
      <div className="mt-8 space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Funcionalidades</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Gestão de Estoque</li>
            <li>Auxiliador de Escalas</li>
            <li>Impressão de Etiquetas</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
