import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { Suspense } from "react"
import { Loading } from './components/Loading'

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<Loading />}>
    <RouterProvider router={router} />
  </Suspense>
)
