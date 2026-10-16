import blob1 from '@/assets/blob-1-opacity-79.gif'
import blob3 from '@/assets/blob-2-opacity-33.gif'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-20">
      <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
        <img
          src={blob3}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-20 scale-110"
        />
        <img src={blob1} alt="Estado vacío" className="relative w-full h-full object-contain" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        ¡Todo está muy tranquilo por aquí!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Usa el buscador para obtener resultados.
      </p>
    </div>
  )
}
