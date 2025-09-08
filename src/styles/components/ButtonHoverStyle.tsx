import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/tailwind-merge'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export const ButtonCenterHover = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'relative w-full py-3 px-4 rounded-md flex flex-row justify-center items-center gap-2 overflow-hidden bg-primary-200 border border-primary-200 text-white shadow-md transition-all duration-200 before:absolute before:bottom-0 before:left-0 before:right-0 before:top-0 before:m-auto before:h-8 before:w-0 before:rounded-md before:bg-primary-400 before:duration-300 before:ease-out hover:shadow-primary-200 hover:before:h-[80%] hover:before:w-[94%] hover:before:opacity-80 disabled:opacity-50 active:scale-90',
        className
      )}
      {...props}
    >
      {/* 'py-3 px-4 rounded-lg flex justify-center items-center gap-2 bg-primary-200 text-white hover:bg-white hover:text-primary-200 transition-all  duration-400 disabled:opacity-50 active:scale-90', */}
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

export const ButtonCenterHoverReverse = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'relative w-full py-3 px-4 rounded-md flex flex-row justify-center items-center gap-2 overflow-hidden border border-primary-200 text-white shadow-md transition-all duration-300 before:absolute before:bottom-0 before:left-0 before:right-0 before:top-0 before:m-auto before:h-[100%] before:w-[100%] before:rounded-md before:bg-primary-200 before:duration-300 before:ease-out hover:text-primary-200 hover:shadow-primary-200 hover:before:h-0 hover:before:w-0 hover:before:opacity-80 disabled:opacity-50 active:scale-90',
        className
      )}
      {...props}
    >
      {/* 'py-3 px-4 rounded-lg flex justify-center items-center gap-2 bg-accent text-white hover:bg-white hover:text-accent transition-all  duration-400 disabled:opacity-50 active:scale-90', */}
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* SlideTop */
export const SlideTop = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="before:ease rounded-md before:rounded-md relative h-12 w-40 overflow-hidden border border-primary-200 text-primary-200 shadow-md before:absolute before:left-0 before:-ml-2 before:h-48 before:w-48 before:origin-top-right before:-translate-x-full before:translate-y-12 before:-rotate-90 before:bg-primary-200 before:transition-all before:duration-300 hover:text-white hover:shadow-primary-200 hover:before:-rotate-180 active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* SkewCurtain */
export const SkewCurtain = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="before:ease relative h-12 w-40 overflow-hidden border border-primary-200 text-primary-200 shadow-md transition-all before:absolute before:top-1/2 before:h-0 before:w-64 before:origin-center before:-translate-x-20 before:rotate-45 before:bg-primary-200 before:duration-300 hover:text-white hover:shadow-primary-200 hover:before:h-64 hover:before:-translate-y-32 active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* ShineLight */
export const ShineLight = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="before:ease w-full rounded-md before:rounded-md relative h-12 px-4 overflow-hidden border border-primary-200 bg-primary-200 text-white shadow-md transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-primary-200 hover:before:-translate-x-60 active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* LeftToRight */
export const LeftToRight = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="text-primary hover:before:bg-primary-200 relative h-[50px] w-full overflow-hidden border border-primary-200 bg-white px-3 text-primary-200 shadow-md transition-all before:absolute rounded-md before:rounded-md before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-primary-200 before:transition-all before:duration-200 hover:text-white hover:shadow-primary-200 hover:before:left-0 hover:before:w-full active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* CurtainWindow */
export const CurtainWindow = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      className="relative h-[50px] w-40 overflow-hidden border border-primary-200 bg-white text-primary-200 shadow-md transition-all before:absolute before:left-0 before:top-0 before:h-full before:w-0 before:duration-500 after:absolute after:right-0 after:top-0 after:h-full after:w-0 after:duration-500 hover:text-white hover:shadow-primary-200 hover:before:w-2/4 hover:before:bg-primary-200 hover:after:w-2/4 hover:after:bg-primary-200 active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* SmoochTopAndDown */
export const SmoochTopAndDown = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      className="relative h-[50px] w-40 overflow-hidden border border-primary-200 bg-white text-primary-200 shadow-md transition-all before:absolute before:left-0 before:right-0 before:top-0 before:h-0 before:w-full before:bg-primary-200 before:duration-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0 after:w-full after:bg-primary-200 after:duration-500 hover:text-white hover:shadow-primary-200 hover:before:h-2/4 hover:after:h-2/4 active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}

/* Alternate */
export const Alternate = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="group relative rounded-md min-h-[50px] w-40 overflow-hidden border border-primary-200 bg-white text-primary-200 shadow-md transition-all before:absolute before:left-0 before:top-0 before:h-0 before:w-1/4 before:bg-primary-200 before:duration-500 after:absolute after:bottom-0 after:right-0 after:h-0 after:w-1/4 after:bg-primary-200 after:duration-500 hover:text-white hover:before:h-full hover:after:h-full active:scale-90"
    >
      <span className="top-0 flex h-full w-full items-center justify-center before:absolute before:bottom-0 before:left-1/4 before:z-0 before:h-0 before:w-1/4 before:bg-primary-200 before:duration-500 after:absolute after:right-1/4 after:top-0 after:z-0 after:h-0 after:w-1/4 after:bg-primary-200 after:duration-500 hover:text-white group-hover:before:h-full group-hover:after:h-full"></span>
      <span className="absolute bottom-0 left-0 right-0 top-0 z-[2] flex h-full w-full items-center justify-center group-hover:text-white">
        {children}
      </span>
    </button>
  )
}

/* CircleHover */
export const CircleHover = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="relative w-full flex h-[50px] px-2 rounded-md items-center justify-center overflow-hidden bg-primary-200 text-white shadow-md transition-all before:absolute before:h-0 before:w-0 before:bg-primary-600 before:duration-500 before:ease-out hover:shadow-primary-600 hover:before:h-[100%] hover:before:w-[100%] active:scale-90"
    >
      <span className="relative flex flex-row justify-center items-center gap-2 z-[2]">
        {children}
      </span>
    </button>
  )
}
