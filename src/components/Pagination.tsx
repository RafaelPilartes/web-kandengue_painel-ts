import React from 'react'

interface PaginationProps {
  currentPage: number
  totalDocs: number
  docsPerPage: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalDocs,
  docsPerPage,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalDocs / docsPerPage)
  const windowSize = 4 // Número de páginas a serem exibidas

  // Cálculo das páginas visíveis
  const startPage = Math.max(0, currentPage - Math.floor(windowSize / 2))
  const endPage = Math.min(totalPages, startPage + windowSize)
  const visiblePages = Array.from(
    { length: endPage - startPage },
    (_, index) => startPage + index
  )

  return (
    <div className="flex justify-center items-center">
      {/* Botão Anterior */}
      <button
        className="flex items-center justify-center px-3 h-10 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white disabled:opacity-50"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>

      {/* Botões de Páginas */}
      {visiblePages.map(page => (
        <button
          key={page}
          className={`flex items-center justify-center px-3 h-10 border border-gray-300 ${
            currentPage === page
              ? 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page + 1}
        </button>
      ))}

      {/* Botão Próximo */}
      <button
        className="flex items-center justify-center px-3 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white disabled:opacity-50"
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próximo
      </button>
    </div>
  )
}
