import { Link } from 'react-router-dom'

function AlignLogo() {
  return (
    <div className="flex items-center gap-1">
      <img src="/align-logo.svg" alt="Align Logo" className="w-6 h-6" />
      <p className="text-lg font-medium text-[#101010]">Align</p>
    </div>
  )
}

export default function Signup() {
  return (
    <div className="relative w-full h-screen bg-[#999999]">
      {/* Left Panel - Signup Form */}
      <div className="absolute left-0 top-0 w-[640px] h-[900px] bg-white overflow-hidden">
        {/* Logo */}
        <div className="absolute left-6 top-12">
          <AlignLogo />
        </div>

        {/* Form Container */}
        <div className="absolute left-[135px] top-[280px] w-[370px]">
          {/* Form Fields */}
          <div className="flex flex-col gap-16">
            {/* Title and Inputs */}
            <div className="relative">
              {/* Title */}
              <h1 className="text-2xl font-medium text-black mb-9">
                Create your{' '}
                <span className="bg-gradient-to-r from-[#2b34d9] from-60% to-[#153243] bg-clip-text text-transparent">
                  Align
                </span>
                {' '}account
              </h1>

              {/* Name Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full h-12 px-3.5 border border-[#d9d9d9] rounded-lg text-sm text-[#828282] placeholder:text-[#828282] focus:outline-none focus:border-[#2b34d9]"
                />
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full h-12 px-3.5 border border-[#d9d9d9] rounded-lg text-sm text-[#828282] placeholder:text-[#828282] focus:outline-none focus:border-[#2b34d9]"
                />
              </div>

              {/* Password Input */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full h-12 px-3.5 border border-[#d9d9d9] rounded-lg text-sm text-[#828282] placeholder:text-[#828282] focus:outline-none focus:border-[#2b34d9]"
                />
              </div>
            </div>

            {/* Button and Login link */}
            <div className="flex flex-col gap-1 items-center w-full">
              {/* Sign Up Button */}
              <button className="w-full bg-[#101010] text-white py-3 px-4 rounded-lg text-base hover:bg-[#2b34d9] transition-colors">
                Create Account
              </button>

              {/* Login link */}
              <div className="flex items-center gap-1 text-sm">
                <span className="text-[#828282]">Already have an account?</span>
                <Link to="/login" className="text-[#101010] hover:text-[#2b34d9]">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Principle Text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-black whitespace-pre">
        <p className="text-xl leading-10 font-serif mb-0">Our 3N Principle</p>
        <p className="text-2xl leading-10 font-serif font-bold">
          No Communication & No Chaos & No Management
        </p>
      </div>
    </div>
  )
}
