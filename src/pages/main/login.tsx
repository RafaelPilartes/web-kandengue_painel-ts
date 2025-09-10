import { useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { InputFloatingLabel } from '../../components/input/InputFloatingLabel'
import { Mail, Lock } from 'lucide-react'
import { BaseButton } from '../../components/buttons/baseButton'
import { useAdminStore } from '../../stores/userStore'
import { ToastContainer } from 'react-toastify'
import { showToast } from '../../utils/toasts'
import { BeatLoader } from 'react-spinners'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { useAuthViewModel } from '@/viewModels/AuthViewModel'
import type { AdminEntity } from '@/core/entities/Admin'

const loginUserSchema = z.object({
  email: z.string().nonempty('O email é obrigatório!').toLowerCase().trim(),

  password: z
    .string()
    .min(6, 'A palavra-passe tem de no mínimo 6 caracteres')
    .trim()
    .refine(value => value, {
      message: 'Por favor, preencha este campo.'
    })
})

type loginUserType = z.infer<typeof loginUserSchema>

export function Login() {
  const { addAdmin } = useAdminStore()

  const { fetchAllAdminSByField } = useAdminsViewModel()
  const { login, isLoggingIn, loginError } = useAuthViewModel()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<loginUserType>({
    resolver: zodResolver(loginUserSchema)
  })

  async function handleLogin(dataForm: loginUserType) {
    try {
      const authRes = await login({
        email: dataForm.email,
        password: dataForm.password
      })

      if (authRes.user.uid) {
        const response = await fetchAllAdminSByField(
          'email',
          authRes.user.email
        )

        const adminData: AdminEntity | null = response?.data[0] ?? null

        if (adminData) {
          addAdmin(adminData)
          showToast('success', 'Login efetuado com sucesso!')
        } else {
          showToast('error', 'Dados do administrador não encontrados.')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (loginError) {
      showToast('error', loginError.message)
    }
  }, [loginError])

  // const handleCreateAdmin = async () => {
  //   const adminData: Omit<AdminEntity, 'id'> = {
  //     name: 'Admin',
  //     email: 'admin1@gmail.com',
  //     entity_code: 'KDT002',
  //     photo: 'https://i.pravatar.cc/150?img=2',
  //     phone: '+244 923 456 789',
  //     status: 'active',
  //     role: 'manager',
  //     permissions: [
  //       { value: 'manage_users', label: 'Gerenciar Usuários' },
  //       {
  //         value: 'assign_roles_permissions',
  //         label: 'Atribuir Funções e Permissões'
  //       }
  //     ]
  //   }

  //   try {
  //     const admin = await createAdmin.mutateAsync(adminData)
  //     console.log('Admin criado:', admin)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  return (
    <>
      <div className="relative w-screen h-screen flex flex-row justify-center items-center gap-0 bg-white dark:bg-baseBgDark">
        <ToastContainer />

        <div className="font-[sans-serif]">
          <div className="min-h-screen flex fle-col items-center justify-center py-6 md:py-0 px-4 md:px-0">
            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-10">
              {/* Form */}
              <div className="w-full md:w-1/2 xl:px-20 lg:px-8 md:px-4 h-full flex flex-col justify-center items-center ">
                <div className="w-full relative p-8 h-auto dark:text-light bg-white dark:bg-dark rounded-2xl flex flex-col justify-center items-start gap-5 shadow-lg">
                  {/* Logo */}
                  <div className="max-w-[18rem] ">
                    <img
                      src="/logo/logo.png"
                      alt="Logo Kandengue Atrevido"
                      className="w-full max-w-[14rem] min-w-[6rem]"
                    />
                  </div>

                  <h1 className="text-3xl font-bold max-w-s-520:text-3xl max-w-s-900:text-4xl">
                    Bem vindo de volta!
                  </h1>

                  <p className="relative py-2 text-[0.85rem] text-start font-normal max-w-md max-w-s-420:text-base">
                    Insira seu endereço de e-mail válido e senha para acessar a
                    sua conta
                  </p>

                  <form
                    onSubmit={handleSubmit(handleLogin)}
                    className="relative w-full flex flex-col justify-center items-start gap-5 "
                  >
                    <InputFloatingLabel
                      type="email"
                      label="Email"
                      name="email"
                      control={control}
                      error={errors.email}
                      icon={Mail}
                      id="emailId"
                    />

                    <InputFloatingLabel
                      type="password"
                      label="Senha"
                      name="password"
                      control={control}
                      id="passId"
                      icon={Lock}
                      error={errors.password}
                    />

                    {!isLoggingIn && (
                      <BaseButton
                        typeButton="submit"
                        title="Efetuar login"
                        styleBtn="CircleHover"
                      />
                    )}

                    {isLoggingIn && (
                      <button
                        disabled={true}
                        className="w-full text-white bg-primary-200 hover:bg-primary-400 focus:ring-2 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-500 dark:hover:bg-primary-200 dark:focus:ring-primary-bg-primary-400"
                      >
                        <BeatLoader color="white" size={10} />
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Image */}
              <div className="w-1/2  h-screen hidden md:block bg-red-500">
                <img
                  src="/illustration/login_cover.png"
                  className="w-full h-full max-md:w-4/5 mx-auto block object-cover"
                  alt="Imagem de login"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
