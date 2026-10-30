/** @type {import('tailwindcss').Config} */
module.exports = {
  /*
   * Por omissao o Tailwind usa `media`, e entao todos os utilitarios `dark:`
   * seguem o `prefers-color-scheme` do sistema. Este painel tem um
   * alternador de tema (`useColorMode`) que liga a classe `dark` ao `body` —
   * e essa classe nao afectava nenhum dos 173 utilitarios `dark:` compilados.
   * Carregar no interruptor mudava o fundo do body e os widgets do flowbite,
   * e mais nada; e quem tivesse o sistema em escuro via a aplicacao escura
   * mesmo com o interruptor em claro.
   */
  darkMode: 'class',
  // O `flowbite-react` saiu: nao era usado em `src`, e este glob punha o
  // Tailwind a varrer o pacote inteiro dentro de node_modules a cada build.
  // O plugin `flowbite` (mais abaixo) continua, e esse e usado.
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '574px',
      sm: '640px',
      md: '768px',
      lg: '960px',
      xl: '1200px',
      'min-w-s-1390': '1390px',
      'min-w-s-1120': '1120px',
      'min-w-s-1030': '1030px',
      'min-w-s-640': '640px',
      'min-w-s-900': '900px',
      'min-w-s-520': '520px',

      'max-w-s-1535': { max: '1535px' },
      'max-w-s-1120': { max: '1120px' },
      'max-w-s-1030': { max: '1030px' },
      'max-w-s-960': { max: '960px' },
      'max-w-s-900': { max: '900px' },
      'max-w-s-840': { max: '840px' },
      'max-w-s-740': { max: '740px' },
      'max-w-s-640': { max: '640px' },
      'max-w-s-570': { max: '570px' },
      'max-w-s-520': { max: '520px' },
      'max-w-s-420': { max: '420px' },
      // => @media (max-width: 1535px) { ... }

      'min-w-768-max-w-s-1023': { min: '768px', max: '1023px' },
      // => @media (min-width: 768px and max-width: 1023px) { ... }

      'min-h-800': { raw: '(min-height: 800px)' }
      // => @media (min-height: 800px) { ... }
    },
    extend: {
      colors: {
        baseText: '#022147',
        baseDark: '#000F21',
        baseTextWhite: '#ffffff',
        baseTextGray: 'rgb(209 213 219)',

        baseTxtLight: '#FFFFFF',
        baseTxtDark: '#111827',
        baseBgLight: '#F1F5F9',
        baseBgDark: '#1A222C',
        light: '#FFFFFF',
        dark: '#24303F',

        primary: {
          50: '#fadee0',
          100: '#f5babe',
          200: '#e0212d',
          300: '#ca1e29',
          400: '#b31a24',
          500: '#a81922',
          600: '#86141b',
          700: '#650f14',
          800: '#4e0c10',
          900: '#35070A'
        },
        secondary: {
          50: '#d9e2ef',
          100: '#b0c2de',
          200: '#003b93',
          300: '#003584',
          400: '#002f76',
          500: '#002c6e',
          600: '#002358',
          700: '#002358',
          800: '#001b42',
          900: '#001533'
        },
        // secondary: {
        //   50: '#d9f2ef',
        //   100: '#b0e4dd ',
        //   200: '#00a991',
        //   300: '#009883',
        //   400: '#008774',
        //   500: '#007f6d',
        //   600: '#006557',
        //   700: '#004c41',
        //   800: '#003b33',
        //   900: '#012D27'
        // },
        // primary: {
        //   50: '#e1f9fd',
        //   100: '#c0f2fb ',
        //   200: '#34d4f1',
        //   300: '#2fbfd9',
        //   400: '#2aaac1',
        //   500: '#279fb5',
        //   600: '#1f7f91',
        //   700: '#175f6c',
        //   800: '#124a54',
        //   900: '#0E3D45'
        // },
        accent: '#F13024'
      },
      boxShadow: {
        '3xl': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        '4xl': '0 10px 40px -15px rgba(0, 0, 0, 0.2)'
      },
      backgroundImage: {
        // login: 'url("/background/login-bg.jpg")',
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite'
      }
    },
    // Barlow is the brand's body face (the public site uses it too); it is
    // self-hosted from @fontsource in main.tsx. This replaces Tailwind's
    // families, so `mono` has to be declared here as well.
    fontFamily: {
      sans: [
        'Barlow',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif'
      ],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Consolas',
        'Liberation Mono',
        'monospace'
      ]
    }
  },
  plugins: [require('flowbite/plugin')]
}
