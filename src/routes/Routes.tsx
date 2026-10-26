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
import { FinancePage } from '@/pages/main/Finance'
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
import { MissionsPage } from '@/pages/main/Missions'
import { AuditLogsPage } from '@/pages/main/AuditLogs'
import { PromotionsPage } from '@/pages/main/Promotions'
import { PromotionFormPage } from '@/pages/main/Promotions/PromotionForm'
import { PromotionDetailsPage } from '@/pages/main/Promotions/PromotionDetails'
import { WithdrawalsPage } from '@/pages/main/Referral/Withdrawals'
import { WithdrawalDetailsPage } from '@/pages/main/Referral/WithdrawalDetails'
import { PricingProfilesPage } from '@/pages/main/Pricing'
import { PricingProfileFormPage } from '@/pages/main/Pricing/ProfileForm'
import { PricingRulesPage } from '@/pages/main/Pricing/RulesPage'
import { PricingRuleFormPage } from '@/pages/main/Pricing/RuleForm'
import { VehiclesPage } from '@/pages/main/Vehicles'
import { FareReviewPage } from '@/pages/main/Rides/FareReview'
import { WeatherPage } from '@/pages/main/Pricing/Weather'
import { BalancesPage } from '@/pages/main/Finances/Balances'
import { SimulatorPage } from '@/pages/main/Pricing/Simulator'
import { DepartmentsPage } from '@/pages/main/Departments'
import { WorkTasksPage } from '@/pages/main/Work/Tasks'
import { WorkProjectsPage } from '@/pages/main/Work/Projects'
import { WorkCalendarPage } from '@/pages/main/Work/Calendar'
import { WorkReportsPage } from '@/pages/main/Work/Reports'

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
          {/* Work */}
          <Route
            path={routsNameMain.work.tasks}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WorkTasksPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.work.projects}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WorkProjectsPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.work.calendar}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WorkCalendarPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.work.reports}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WorkReportsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Departments */}
          <Route
            path={routsNameMain.departments.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <DepartmentsPage />
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
          {/* Simulador de tarifas */}
          <Route
            path={routsNameMain.pricing.simulator}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <SimulatorPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Saldos abaixo do mínimo */}
          <Route
            path={routsNameMain.finance.balances}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <BalancesPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Chuva manual */}
          <Route
            path={routsNameMain.pricing.weather}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WeatherPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Revisão de tarifas */}
          <Route
            path={routsNameMain.rides.fareReview}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <FareReviewPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Viaturas — fila de validação */}
          <Route
            path={routsNameMain.vehicles.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <VehiclesPage />
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
            path={routsNameMain.finance.reports.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <FinancePage />
                </Private>
              </React.Suspense>
            }
          />
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
          {/* Preços: perfis por corrida × veículo e regras de acréscimo */}
          {[
            { path: routsNameMain.pricing.profiles, element: <PricingProfilesPage /> },
            { path: routsNameMain.pricing.profileCreate, element: <PricingProfileFormPage /> },
            { path: routsNameMain.pricing.profileEdit, element: <PricingProfileFormPage /> },
            { path: routsNameMain.pricing.rules, element: <PricingRulesPage /> },
            { path: routsNameMain.pricing.ruleCreate, element: <PricingRuleFormPage /> },
            { path: routsNameMain.pricing.ruleEdit, element: <PricingRuleFormPage /> }
          ].map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <React.Suspense fallback={<Loading />}>
                  <Private>{element}</Private>
                </React.Suspense>
              }
            />
          ))}
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
          {/* Missions */}
          <Route
            path={routsNameMain.missions.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <MissionsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Audit Logs */}
          <Route
            path={routsNameMain.logs.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <AuditLogsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Promotions */}
          <Route
            path={routsNameMain.promotions.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <PromotionsPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.promotions.create}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <PromotionFormPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.promotions.edit}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <PromotionFormPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.promotions.view}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <PromotionDetailsPage />
                </Private>
              </React.Suspense>
            }
          />
          {/* Referral withdrawals */}
          <Route
            path={routsNameMain.referral.withdrawals.index}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WithdrawalsPage />
                </Private>
              </React.Suspense>
            }
          />
          <Route
            path={routsNameMain.referral.withdrawals.view}
            element={
              <React.Suspense fallback={<Loading />}>
                <Private>
                  <WithdrawalDetailsPage />
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
