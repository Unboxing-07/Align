import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/Button"
import { FatInput } from "../components/FatInput"
import { Logo } from "../components/Logo"
import { authService } from "../services/auth"

export const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await authService.login({ email, password })
      navigate("/workspace")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#999999] w-screen h-screen flex">
      <div className="w-160 h-full bg-white relative flex justify-center items-center">
        <Logo absolute />
        <form onSubmit={handleSubmit} className="flex flex-col gap-16 items-center justify-center w-92.5">
          <div className="flex flex-col w-full gap-2">
            <p className="text-2xl">Welcome back to Align</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <FatInput
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FatInput
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1 items-center justify-center w-92.5">
            <Button size="large" className="w-full" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="flex gap-1 text-sm text-gray-200">Don't have an account?<Link to={'/signup'} className="text-black cursor-pointer">sign up</Link></p>
          </div>
        </form>
      </div>
    </div>
  )
}
