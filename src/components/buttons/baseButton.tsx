import type { ElementType } from 'react'
import {
  Alternate,
  ButtonCenterHover,
  ButtonCenterHoverReverse,
  CircleHover,
  CurtainWindow,
  LeftToRight,
  ShineLight,
  SkewCurtain,
  SlideTop,
  SmoochTopAndDown
} from '../../styles/components/ButtonHoverStyle'

interface baseButtonProps {
  icon?: ElementType
  iconRight?: ElementType
  typeButton?: 'submit' | 'reset' | 'button'
  onclickBtn?: () => void
  styleBtn?:
    | 'ShadowCenter'
    | 'Inside'
    | 'SlideTop'
    | 'SkewCurtain'
    | 'ShineLight'
    | 'LeftToRight'
    | 'CurtainWindow'
    | 'SmoochTopAndDown'
    | 'Alternate'
    | 'CircleHover'
  title: string
}

export function BaseButton({
  icon: Icon,
  iconRight: IconRight,
  typeButton,
  onclickBtn,
  styleBtn,
  title
}: baseButtonProps) {
  switch (styleBtn) {
    case 'ShadowCenter':
      return (
        <ButtonCenterHover type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </ButtonCenterHover>
      )
      break

    case 'Inside':
      return (
        <ButtonCenterHoverReverse type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </ButtonCenterHoverReverse>
      )
      break
    case 'SlideTop':
      return (
        <SlideTop type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </SlideTop>
      )
      break
    case 'SkewCurtain':
      return (
        <SkewCurtain type={typeButton}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </SkewCurtain>
      )
      break
    case 'ShineLight':
      return (
        <ShineLight type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </ShineLight>
      )
      break
    case 'LeftToRight':
      return (
        <LeftToRight type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </LeftToRight>
      )
      break
    case 'CurtainWindow':
      return (
        <CurtainWindow type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </CurtainWindow>
      )
      break
    case 'SmoochTopAndDown':
      return (
        <SmoochTopAndDown type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </SmoochTopAndDown>
      )
      break
    case 'Alternate':
      return (
        <Alternate type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </Alternate>
      )
      break
    case 'CircleHover':
      return (
        <CircleHover type={typeButton} onClick={onclickBtn}>
          {Icon && <Icon size={18} />}
          <span> {title} </span>
          {IconRight && <IconRight size={18} />}
        </CircleHover>
      )
      break

    default:
      return (
        <ButtonCenterHover type={typeButton} onClick={onclickBtn}>
          <span>{Icon && <Icon size={18} />}</span>
          <span> {title} </span>
          <span>{IconRight && <IconRight size={18} />}</span>
        </ButtonCenterHover>
      )
      break
  }
}
