import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import FourOhFour from '../pages/404'
import Loading from '../pages/loading'

// Layout
import RootLayout from '../layout/RootLayout'
// Data Route
import { routsNameMain } from '../data/routsName'
// Route
import { Private, PrivateLogin } from './PrivateRoute'

import { Login } from '../pages/main/login'

// Page

// const Home = React.lazy(() => import('../pages/main/home'))
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path={routsNameMain.login}
          element={
            <React.Suspense fallback={<Loading />}>
              <PrivateLogin>
                <Login />
              </PrivateLogin>
            </React.Suspense>
          }
        />

        <Route
          path="*"
          element={
            <React.Suspense fallback={<Loading />}>
              <FourOhFour />
            </React.Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
