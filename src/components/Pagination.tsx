import React from 'react'

interface PaginationProps {
  currentPage: number // página atual (0-based)
  totalDocs: number // total de registros
  docsPerPage: number // limite por página
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalDocs,
  docsPerPage,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalDocs / docsPerPage)
  const windowSize = 4 // número de páginas visíveis na navegação

  // 🔹 Cálculo do range de páginas visíveis
  let startPage = Math.max(0, currentPage - Math.floor(windowSize / 2))
  let endPage = startPage + windowSize

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(0, endPage - windowSize)
  }

  const visiblePages = Array.from(
    { length: endPage - startPage },
    (_, index) => startPage + index
  )

  return (
    <div className="flex justify-center items-center space-x-1">
      {/* Botão Anterior */}
      <button
        className="px-3 h-10 rounded-s-lg border border-gray-300 text-gray-500 bg-white hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>

      {/* Botões de Página */}
      {visiblePages.map(page => (
        <button
          key={page}
          className={`px-3 h-10 border border-gray-300 
            ${
              currentPage === page
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            }`}
          onClick={() => onPageChange(page)}
        >
          {page + 1}
        </button>
      ))}

      {/* Botão Próximo */}
      <button
        className="px-3 h-10 rounded-e-lg border border-gray-300 text-gray-500 bg-white hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
        disabled={currentPage >= totalPages - 1 || totalDocs === 0}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próximo
      </button>
    </div>
  )
}
