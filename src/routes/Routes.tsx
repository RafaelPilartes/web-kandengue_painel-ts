import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import FourOhFour from '../pages/404'
import Loading from '../pages/loading'

// Layout
import RootLayout from '../layout/RootLayout'
// Data Route
import { routsNameMain } from '../constants/routsName'
// Route
import { Private, PrivateLogin } from './PrivateRoute'

import { Login } from '../pages/main/login'
import { Home } from '@/pages/main/home'
import { AdminPage } from '@/pages/main/Admin'
import { UserPage } from '@/pages/main/Passengers'
import { DriverPage } from '@/pages/main/Drivers'
import { RidesPage } from '@/pages/main/Rides'
import { RealtimePage } from '@/pages/main/Rides/realtime'
import { FinancesPage } from '@/pages/main/Finances'
import { WalletsPage } from '@/pages/main/Finances/wallet'
import { NotificationsPage } from '@/pages/main/Notifications'
import { MetricsPage } from '@/pages/main/Metrics'
import { SettingsPage } from '@/pages/main/Settings'
import { WalletTopupRequestsPage } from '@/pages/main/Finances/walletTopupRequest'
import { DriverViewPage } from '@/pages/main/Drivers/DriverDetails'
import { UserViewPage } from '@/pages/main/Passengers/UserDetails'
import { ApplicationPage } from '@/pages/main/Application'
import { ApplicationViewPage } from '@/pages/main/Application/ApplicationDetails'

// Page

// const Home = React.lazy(() => import('../pages/main/home'))
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Home */}
          <Route
            index
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <Home />
                </Private>
              </React.Suspense>
            }
          />
          {/* Admin */}
          <Route
            path={routsNameMain.users.admins.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <AdminPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Driver */}
          <Route
            path={routsNameMain.users.drivers.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <DriverPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Details */}
          <Route
            path={routsNameMain.users.drivers.view}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <DriverViewPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.users.drivers.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <DriverPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Passenger */}
          <Route
            path={routsNameMain.users.passengers.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <UserPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Details */}
          <Route
            path={routsNameMain.users.passengers.view}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <UserViewPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Application */}
          <Route
            path={routsNameMain.users.applications.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <ApplicationPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Details */}
          <Route
            path={routsNameMain.users.applications.view}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <ApplicationViewPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Rides */}
          <Route
            path={routsNameMain.rides.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <RidesPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.rides.realtime}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <RealtimePage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Finances */}
          <Route
            path={routsNameMain.finance.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <FinancesPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Rides */}
          <Route
            path={routsNameMain.rides.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <RidesPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Wallets */}
          <Route
            path={routsNameMain.finance.wallet}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WalletsPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.finance.walletTopupRequest}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WalletTopupRequestsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Notifications */}
          <Route
            path={routsNameMain.notifications.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <NotificationsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Metrics */}
          <Route
            path={routsNameMain.metrics.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <MetricsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Settings */}
          <Route
            path={routsNameMain.settings.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <SettingsPage />
                </Private>
              </React.Suspense>
            }
          />
        </Route>

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
