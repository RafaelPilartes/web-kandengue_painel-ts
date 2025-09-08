import Aos from 'aos'
import { useEffect } from 'react'

function FourOhFour() {
  useEffect(() => {
    Aos.init({ duration: 1500 })
  }, [])

  return (
    <>
      <section className="w-full bg-white dark:bg-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-28 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
              404
            </h1>
            <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
              Algo está faltando.
            </p>
            <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
              Desculpe, não conseguimos encontrar essa página. Você encontrará
              muito para explorar na página inicial.{' '}
            </p>
            <a
              href="/"
              className="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4"
            >
              Voltar para a página inicial
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export default FourOhFour
