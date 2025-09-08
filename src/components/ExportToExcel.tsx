import React from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { BsFiletypeXlsx } from 'react-icons/bs'

interface ExportToExcelProps {
  data: any[]
  filename: string
  sheetName: string
  titlePage: string
  imageSrc: string // URL da imagem
  orientation: 'portrait' | 'landscape' // 'retrato' ou 'paisagem'
  scale: number // Escala da folha (por exemplo: 0.8 para 80%)
}

const ExportToExcel: React.FC<ExportToExcelProps> = ({
  data,
  filename,
  sheetName,
  titlePage,
  imageSrc,
  orientation,
  scale
}) => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    // Definir orientação da página
    if (orientation === 'landscape') {
      worksheet.pageSetup.orientation = 'landscape'
    } else {
      worksheet.pageSetup.orientation = 'portrait'
    }

    // Definir escala da folha
    worksheet.pageSetup.scale = scale

    // Definir margens laterais (em polegadas)
    worksheet.pageSetup.margins = {
      top: 0.5,
      bottom: 0.5,
      left: 0.5,
      right: 0.5,
      header: 0.3, // Valor de exemplo para margem de cabeçalho
      footer: 0.3 // Valor de exemplo para margem de rodapé
    }

    // Adicionar imagem no canto superior esquerdo
    const image = await fetch(imageSrc)
    const imageBlob = await image.blob()
    const imageId = workbook.addImage({
      buffer: await (imageBlob as any).arrayBuffer(),
      extension: 'png'
    })
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 }, // Coluna 1 (A) e linha 0 (uma linha abaixo do título, nome da empresa e data)
      ext: { width: 280, height: 100 } // Largura e altura da imagem
    })

    // Adicionar cabeçalhos
    worksheet.getColumn(1).width = 20 // Definir largura da 1 coluna para acomodar a imagem
    worksheet.getColumn(2).width = 16 // Definir largura da 2 coluna para acomodar a imagem
    worksheet.getColumn(3).width = 16 // Definir largura da 3 coluna para acomodar a imagem
    worksheet.getColumn(4).width = 16 // Definir largura da 4 coluna para acomodar a imagem
    worksheet.getColumn(5).width = 28 // Definir largura da 5 coluna para acomodar a imagem
    worksheet.getColumn(6).width = 20 // Definir largura da 6 coluna para acomodar a imagem
    worksheet.getColumn(7).width = 12 // Definir largura da 7 coluna para acomodar a imagem
    worksheet.getColumn(8).width = 16 // Definir largura da 8 coluna para acomodar a imagem
    worksheet.getColumn(9).width = 20 // Definir largura da 8 coluna para acomodar a imagem
    worksheet.getColumn(10).width = 20 // Definir largura da 10 coluna para acomodar a imagem
    worksheet.getColumn(11).width = 20 // Definir largura da 11 coluna para acomodar a imagem
    worksheet.getColumn(12).width = 20 // Definir largura da 12 coluna para acomodar a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem

    // Titulo em baixo do logo
    const nameLogoRow = worksheet.addRow(['Saúde em Casa'])
    nameLogoRow.font = { bold: true, size: 14 }
    nameLogoRow.alignment = { horizontal: 'center' } // Centralizar o texto
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem

    // Adicionar título em negrito
    const titleRow = worksheet.addRow([titlePage])
    titleRow.font = { bold: true, size: 16 }

    // Adicionar data de exportação
    worksheet.addRow(['Data de Exportação: ' + new Date().toLocaleDateString()])
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem
    worksheet.addRow([]) // Adicionar uma linha vazia após a imagem

    // Adicionar cabeçalho da tabela
    const headers = Object.keys(data[0])
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true, size: 10, color: { argb: 'ffffff' } }
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '6e6e6e' } // Cor de fundo
      }
    })

    // Adicionar dados abaixo dos cabeçalhos
    data.forEach((item, index) => {
      const row = headers.map(header => item[header])
      const dataRow = worksheet.addRow(row)

      // Formatação xadrezada
      if (index % 2 === 1) {
        dataRow.eachCell({ includeEmpty: true }, cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3F3F3' } // Cor de fundo
          }
          // Adicionar bordas às células da linha de dados
          // cell.border = {
          //       top: { style: 'thin' },
          //       bottom: { style: 'thin' },
          //       left: { style: 'thin' },
          //       right: { style: 'thin' }
          //     }
        })
      }

      // Adicionar bordas às células da linha de dados
      // dataRow.eachCell(cell => {
      //
      // })

      dataRow.font = { size: 10 }
    })

    // Gerar o arquivo Excel
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, filename + '.xlsx')
  }

  return (
    <button
      onClick={exportToExcel}
      className="py-2 px-4 rounded-lg border-[1px] border-gray-200 dark:border-gray-600 hover:bg-gray-300/20 dark:hover:bg-gray-500/20 active:bg-gray-200 flex flex-row items-center justify-center gap-4 transition-all duration-300"
    >
      <BsFiletypeXlsx />
      {/* <FileDown /> */}
      Exportar .xlsx
    </button>
  )
}

export default ExportToExcel
