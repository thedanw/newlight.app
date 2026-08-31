import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import ErrorPage from '@/core/errors/ErrorPage'
import StyleguideApp from '@/styleguide/App'
import { peopleRoutes } from '@/modules/people/routes'
import { coreRoutes } from '@/core/routes'

const FormPublicPage = lazy(() => import('@/modules/people/pages/FormPublicPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StyleguideApp />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/people',
    children: peopleRoutes,
    errorElement: <ErrorPage />,
  },
  {
    path: '/forms/:formId',
    element: <FormPublicPage />,
    errorElement: <ErrorPage />,
  },
  ...coreRoutes,
])
