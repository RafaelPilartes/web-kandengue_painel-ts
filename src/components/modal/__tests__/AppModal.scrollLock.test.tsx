// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

/*
 * `AppModal` calls `ReactModal.setAppElement('#root')` at import time. The
 * element has to exist before the import, otherwise react-modal warns on
 * every open and `aria-hidden` never lands anywhere.
 */
let AppModal: typeof import('../AppModal').AppModal
let resetScrollLockForTests: typeof import('../AppModal').resetScrollLockForTests

beforeAll(async () => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
  const mod = await import('../AppModal')
  AppModal = mod.AppModal
  resetScrollLockForTests = mod.resetScrollLockForTests
})

const BODY_OPEN_CLASS = 'ReactModal__Body--open'

function isScrollLocked() {
  return document.body.classList.contains(BODY_OPEN_CLASS)
}

afterEach(() => {
  cleanup()
  resetScrollLockForTests()
})

/** One modal, mounted only while open — the shape every page in the panel uses. */
function OneModal() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        abrir
      </button>
      {open && (
        <AppModal isOpen onClose={() => setOpen(false)} title="Um modal">
          <p>conteúdo</p>
        </AppModal>
      )}
    </>
  )
}

/** Two modals, the second opened from inside the first. */
function StackedModals() {
  const [first, setFirst] = useState(false)
  const [second, setSecond] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setFirst(true)}>
        abrir primeiro
      </button>
      {first && (
        <AppModal isOpen onClose={() => setFirst(false)} title="Primeiro">
          <button type="button" onClick={() => setSecond(true)}>
            abrir segundo
          </button>
        </AppModal>
      )}
      {second && (
        <AppModal isOpen onClose={() => setSecond(false)} title="Segundo">
          <p>o de cima</p>
        </AppModal>
      )}
    </>
  )
}

/*
 * Everything runs inside `StrictMode` because `main.tsx` does, and the bug this
 * file exists for only shows up there: StrictMode mounts, unmounts and mounts
 * again, and react-modal's own `bodyOpenClassName` counter does not give the
 * first reference back. Without the wrapper these cases all pass over the
 * broken code.
 */
function renderStrict(ui: React.ReactElement) {
  return render(<StrictMode>{ui}</StrictMode>)
}

describe('AppModal scroll lock', () => {
  it('locks the page while open and releases it on the close button', () => {
    renderStrict(<OneModal />)
    expect(isScrollLocked()).toBe(false)

    fireEvent.click(screen.getByText('abrir'))
    expect(isScrollLocked()).toBe(true)

    fireEvent.click(screen.getByLabelText('Fechar'))
    expect(isScrollLocked()).toBe(false)
  })

  it('releases the page when closed with Esc', () => {
    renderStrict(<OneModal />)
    fireEvent.click(screen.getByText('abrir'))
    expect(isScrollLocked()).toBe(true)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', keyCode: 27 })
    expect(isScrollLocked()).toBe(false)
  })

  it('releases the page when closed by clicking the backdrop', () => {
    renderStrict(<OneModal />)
    fireEvent.click(screen.getByText('abrir'))
    expect(isScrollLocked()).toBe(true)

    const overlay = document.querySelector('.modal-overlay')
    if (!overlay) throw new Error('overlay not rendered')
    fireEvent.mouseDown(overlay)
    fireEvent.click(overlay)
    expect(isScrollLocked()).toBe(false)
  })

  it('keeps the page locked until the LAST of two stacked modals closes', () => {
    renderStrict(<StackedModals />)
    fireEvent.click(screen.getByText('abrir primeiro'))
    fireEvent.click(screen.getByText('abrir segundo'))
    expect(isScrollLocked()).toBe(true)

    // Only the top one closes: the first is still open, so the page stays put.
    fireEvent.click(screen.getAllByLabelText('Fechar')[1])
    expect(isScrollLocked()).toBe(true)

    fireEvent.click(screen.getAllByLabelText('Fechar')[0])
    expect(isScrollLocked()).toBe(false)
  })

  it('releases the page when the modal unmounts while still open', () => {
    const { unmount } = renderStrict(
      <AppModal isOpen onClose={() => {}} title="Um modal">
        <p>conteúdo</p>
      </AppModal>
    )
    expect(isScrollLocked()).toBe(true)

    unmount()
    expect(isScrollLocked()).toBe(false)
  })

  it('releases the page after opening and closing twice in a row', () => {
    renderStrict(<OneModal />)
    for (let round = 0; round < 2; round += 1) {
      fireEvent.click(screen.getByText('abrir'))
      expect(isScrollLocked()).toBe(true)
      fireEvent.click(screen.getByLabelText('Fechar'))
      expect(isScrollLocked()).toBe(false)
    }
  })
})
