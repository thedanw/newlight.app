import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import ErrorPage from '@/core/errors/ErrorPage'
import { AppShell } from '@/core/ui'
import StyleguideApp from '@/styleguide/App'
import { peopleRoutes } from '@/modules/people/routes'
import { coreRoutes } from '@/core/routes'

const FormPublicPage = lazy(() => import('@/modules/people/pages/FormPublicPage'))

export const router = createBrowserRouter([
  {
    // Single shared app shell (Sidebar + PagePanel + ErrorBoundary + Suspense)
    // for every authenticated surface: the styleguide, module dashboards, and
    // settings. Public/unauthenticated routes live outside this shell.
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <StyleguideApp /> },
      { path: 'people', children: peopleRoutes },
      { path: 'settings', children: coreRoutes },
    ],
  },
  {
    path: '/forms/:formId',
    element: <FormPublicPage />,
    errorElement: <ErrorPage />,
  },
])
