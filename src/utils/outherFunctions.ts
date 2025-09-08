// // Pagination
// async function handleLoadPage(page: number, numDocsPerPage?: number) {
//   let numDocsPerPageOn = numDocsPerPage ? numDocsPerPage : docsPerPage
//   try {
//     await getDocsInPage(
//       numDocsPerPageOn,
//       entryPoint as entryPointType,
//       workplaceId,
//       lastDocument,
//       page
//     )
//       .then(result => {
//         console.log(result)
//         setDataEmployees(result.data)
//         setLastDocument(result.lastDocumentData)
//         setCurrentPage(page)
//       })
//       .catch(err => console.log(err))
//   } catch (error) {
//     console.error('Erro ao buscar dados:', error)
//   }
//   setLoadingDocuments(false)
// }

// const renderPagination = () => {
//   const pages = []
//   for (let page = 1; page <= totalPages; page++) {
//     pages.push(
//       <button
//         key={page}
//         onClick={() => handleLoadPage(page)}
//         disabled={loadingPagination}
//       >
//         {page}
//       </button>
//     )
//   }
//   return pages
// }
