import { Loading } from "../components/Loading"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export const NotFound = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login")
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigate])

  return <Loading />
}
