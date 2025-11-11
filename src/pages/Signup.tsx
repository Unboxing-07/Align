import { Link } from "react-router-dom"
import { Button } from "../components/button"
import { FatInput } from "../components/FatInput"
import { Logo } from "../components/Logo"

export const Signup = () => {
  return (
    <div className="bg-[#999999] w-screen h-screen flex">
      <div className="w-160 h-full bg-white relative flex justify-center items-center">
        <Logo />
        <div className="flex flex-col gap-16 items-center justify-center w-92.5">
          <div className="flex flex-col w-full gap-2">
            <p className="text-2xl">Welcome to Align</p>
            <FatInput placeholder="Email" />
            <FatInput placeholder="Name" />
            <FatInput placeholder="Password" />
          </div>
          <div className="flex flex-col gap-1 items-center justify-center w-92.5">
            <Button size="large" className="w-full">Login</Button>
            <p className="flex gap-1 text-sm text-gray-200">Do you have an account?<Link to={'/login'} className="text-black cursor-pointer">login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
