export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          QR Code inválido
        </h1>
        <p className="text-sm text-gray-600">
          Este link de avaliação não existe ou está desativado.
        </p>
      </div>
    </main>
  )
}
