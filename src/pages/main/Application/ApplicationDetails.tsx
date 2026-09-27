import { useEffect, useState } from 'react'
import {
  useParams
  // useNavigate
} from 'react-router-dom'
import { Spinner } from 'phosphor-react'

// Components do teu projeto (ajusta imports conforme necessário)
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Mail,
  MapPin,
  Phone,
  User,
  FileText,
  Car,
  Map,
  Eye
} from 'lucide-react'
import { useApplicationsViewModel } from '@/viewModels/ApplicationViewModel'
import type { ApplicationInterface } from '@/interfaces/IApplication'
import { formatDateTimeFromFirestore } from '@/utils/date'
import CategoryBadge from '@/components/badge/BadgeCategory'

export function ApplicationViewPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  // const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)

  const { fetchApplicationById } = useApplicationsViewModel()

  // Data
  const [rowDataApplication, setRowDataApplication] =
    useState<ApplicationInterface | null>(null)

  // Function
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      if (!applicationId) {
        alert('Não foi fornecido id do candidato')
        return
      }

      try {
        // Executa ambas as requisições em paralelo
        const [dataApplication] = await Promise.all([
          fetchApplicationById(applicationId)
        ])

        // Lida com Application
        if (!dataApplication) {
          console.error('Erro ao buscar candidatos')
        } else {
          setRowDataApplication(dataApplication)
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green'
      case 'rejected':
        return 'red'
      case 'pending':
        return 'yellow'
      case 'under_review':
        return 'blue'
      default:
        return 'gray'
    }
  }

  // Função para traduzir status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      under_review: 'Em Revisão'
    }
    return statusMap[status] || status
  }

  // Função para traduzir gênero
  const translateGender = (gender: string) => {
    const genderMap: Record<string, string> = {
      male: 'Masculino',
      female: 'Feminino',
      other: 'Outro'
    }
    return genderMap[gender] || gender
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-row items-center justify-center gap-4">
        <span className="text-2xl text-gray-700 dark:text-gray-200">
          Carregando dados do candidato
        </span>
        <Spinner size={36} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!rowDataApplication) {
    return (
      <div className="p-8 text-center text-sm text-gray-600 dark:text-gray-300">
        Candidato não encontrado.
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Header */}
      <div className="w-full flex flex-col gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
        {/* Top Row */}
        <div className="w-full flex items-start justify-between gap-6 max-w-s-640:flex-col max-w-s-640:gap-4">
          {/* Left: Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar
              src={rowDataApplication.photo}
              fallback={rowDataApplication.first_name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
              alt="Application"
              size="xl"
            />

            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {rowDataApplication.first_name} {rowDataApplication.last_name}
                </h1>
                <CategoryBadge
                  color={getStatusColor(rowDataApplication.status)}
                  label={translateStatus(rowDataApplication.status)}
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{rowDataApplication.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>{rowDataApplication.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{rowDataApplication.province}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{translateGender(rowDataApplication.gender)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="flex flex-col items-end gap-2 max-w-s-640:items-start">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
              <span className="font-medium">
                {rowDataApplication.type_candidacy}
              </span>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Data da candidatura:{' '}
              <span className="font-medium">
                {
                  formatDateTimeFromFirestore(
                    rowDataApplication.created_at as any
                  ).date
                }
              </span>
            </div>

            {rowDataApplication.entity_code && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Código: {rowDataApplication.entity_code}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal">
              <div className="flex flex-row gap-2">
                <User size={16} />
                Informações Pessoais
              </div>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <div className="flex flex-row gap-2">
                <FileText size={16} />
                Documentação
              </div>
            </TabsTrigger>
            <TabsTrigger value="vehicle">
              <div className="flex flex-row gap-2">
                <Car size={16} />
                Veículo
              </div>
            </TabsTrigger>
            <TabsTrigger value="areas">
              <div className="flex flex-row gap-2">
                <Map size={16} />
                Áreas de Atuação
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Informações Pessoais */}
          <TabsContent value="personal">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nome Completo
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {rowDataApplication.first_name}{' '}
                    {rowDataApplication.last_name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Gênero
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {translateGender(rowDataApplication.gender)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {rowDataApplication.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Telefone
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {rowDataApplication.phone}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Província
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {rowDataApplication.province}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo de Candidatura
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white">
                    {rowDataApplication.type_candidacy}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documentação */}
          <TabsContent value="documents">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Documentos
              </h3>

              {/* Bilhete de Identidade */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Bilhete de Identidade
                </h4>

                {rowDataApplication.identity_card && (
                  <div className="mb-3">
                    <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <FileText size={24} className="text-primary-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">
                          Bilhete do candidato
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Clique para visualizar ou baixar
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            window.open(
                              rowDataApplication.identity_card,
                              '_blank'
                            )
                          }
                          className="px-4 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Visualizar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {rowDataApplication.identities_card && (
                  <div>
                    <div className="flex flex-col">
                      {rowDataApplication.identities_card.map(
                        (image, index) => (
                          <div key={index} className="mb-3">
                            <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <FileText
                                size={24}
                                className="text-primary-600"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-white">
                                  Bilhete do candidato {index + 1}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Clique para visualizar ou baixar
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => window.open(image, '_blank')}
                                  className="px-4 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-2"
                                >
                                  <Eye size={16} />
                                  Visualizar
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Curriculum Vitae */}
              {rowDataApplication.curriculum && (
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Curriculum Vitae
                  </h4>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <FileText size={24} className="text-primary-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        Curriculum do Candidato
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Clique para visualizar ou baixar
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          window.open(rowDataApplication.curriculum, '_blank')
                        }
                        className="px-4 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Visualizar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Veículo */}
          <TabsContent value="vehicle">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Informações do Veículo
              </h3>

              {/* Documento do Veículo */}
              {rowDataApplication.vehicle_Doc && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Documento do Veículo
                  </h4>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <FileText size={24} className="text-primary-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        Documentação do Veículo
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          window.open(rowDataApplication.vehicle_Doc, '_blank')
                        }
                        className="px-4 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Visualizar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fotos do Veículo */}
              {rowDataApplication.vehicle_photos &&
                rowDataApplication.vehicle_photos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Fotos do Veículo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {rowDataApplication.vehicle_photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Veículo ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={() => window.open(photo, '_blank')}
                              className="p-2 bg-white rounded-full hover:bg-gray-100"
                            >
                              <Eye size={20} color="red" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Documentos do Veículo */}
              {rowDataApplication.vehicle_docs &&
                rowDataApplication.vehicle_docs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Outros Documentos do Veículo
                    </h4>
                    <div className="space-y-3">
                      {rowDataApplication.vehicle_docs.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              Documento {index + 1}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(doc, '_blank')}
                              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </TabsContent>

          {/* Áreas de Atuação */}
          <TabsContent value="areas">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Áreas de Candidatura
              </h3>

              {rowDataApplication.application_areas ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                    {rowDataApplication.application_areas}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma área de atuação especificada
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
