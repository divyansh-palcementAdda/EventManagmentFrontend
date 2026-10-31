import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, ArrowRight, CalendarDays } from "lucide-react"
import toast from "react-hot-toast"
import RuLogo from "../../assets/logo.png"
import authService from "../../Api-Services/authService.js"

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      const response = await authService.login(email, password)
      
      // Store token and user data in session storage
      sessionStorage.setItem("accessToken", response.data.accessToken)
      if (response.data.refreshToken) {
        sessionStorage.setItem("refreshToken", response.data.refreshToken)
      }
      sessionStorage.setItem("tokenType", response.data.tokenType)
      sessionStorage.setItem("userId", response.data.userId)
      sessionStorage.setItem("email", response.data.email)
      sessionStorage.setItem("fullName", response.data.fullName)
      if (response.data.roleId) {
        sessionStorage.setItem("roleId", response.data.roleId)
      }
      if (response.data.roleName) {
        sessionStorage.setItem("roleName", response.data.roleName)
      }
      if (response.data.roles) {
        sessionStorage.setItem("roles", JSON.stringify(response.data.roles))
      }
      sessionStorage.setItem("expiresIn", response.data.expiresIn)
      
      toast.success("Login successful!")
      navigate("/admin")
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Login failed. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-mono">

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-800 items-center justify-center p-12 overflow-hidden">

        <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-32 -left-32" />
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -bottom-32 -right-32" />

        <div className="relative z-10 text-center max-w-lg">
          <div className="bg-white rounded-3xl p-5 inline-block shadow-xl mb-8">
            <img
              src={RuLogo}
              alt="Event Management Logo"
              className="w-48 h-48 object-contain"
            />
          </div>

          <h1 className="text-white text-4xl font-bold mb-4">
            Event Management
          </h1>

          <p className="text-green-100 text-lg leading-relaxed">
            Manage your events, distribute passes, and create
            memorable experiences with ease.
          </p>

          <div className="mt-10 flex justify-center gap-3">
            <span className="w-10 h-1.5 rounded-full bg-white" />
            <span className="w-3 h-1.5 rounded-full bg-white/40" />
            <span className="w-3 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12 bg-gray-50">

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-5">
              <CalendarDays className="w-8 h-8 text-green-800" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              Welcome Back!
            </h2>

            <p className="text-gray-500 mt-3 text-sm">
              Sign in to continue to Event Management
            </p>
          </div>

          {/* Form Heading */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Login to your account
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl outline-none transition-all focus:border-green-800 focus:ring-4 focus:ring-green-800/10 hover:border-green-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl outline-none transition-all focus:border-green-800 focus:ring-4 focus:ring-green-800/10 hover:border-green-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-800 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 text-white py-4 px-5 rounded-xl hover:bg-green-900 transition-all duration-300 font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-800/20 hover:shadow-green-800/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-400">
              © 2026 Event Management. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
