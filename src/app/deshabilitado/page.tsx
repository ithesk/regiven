export default function DisabledPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">re</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-black mb-4">
            Portal temporalmente deshabilitado
          </h1>

          {/* Message */}
          <p className="text-gray-500 mb-8">
            El portal de ofrendas no está disponible en este momento. Por favor,
            intenta nuevamente más tarde.
          </p>

          {/* Info Card */}
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-sm text-gray-600">
              Si tienes alguna pregunta, contacta a tu líder de iglesia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
