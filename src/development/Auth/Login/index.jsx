import { useContext, useState } from "react";
import { Auth } from 'aws-amplify';
import { toast } from "react-toastify";
import Context from "../../Context/Context";
import { Link, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const { setLoader, setUserData } = useContext(Context);
  const { institutionData } = useContext(Context);
  const primaryColor = institutionData.PrimaryColor;
  const secondaryColor = institutionData.SecondaryColor;
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError(null);

    const email = event.target.email.value;
    const password = event.target.password.value;
    
    if (!email || !password) {
      toast.error("Email and Password are required.");
      return;
    }
    
    try {
      setLoader(true); // Show loader only right before the API call
      console.log("Attempting to login with:", email);
      const user = await Auth.signIn(email, password);
      console.log("Login successful", user);
      
      // Store authentication success in session storage
      window.sessionStorage.setItem('auth_success', 'true');
      navigate('/redirect');
    } catch (e) {
      console.error("Login error", e);
      setLoader(false); // Hide loader immediately when error occurs
      setLoginError(e.message || "Login failed");
      
      if (e.name === 'NotAuthorizedException') {
        toast.error('Incorrect username or password.');
      } else if (e.name === 'UserNotFoundException') {
        toast.error('User does not exist. Please sign up.');
        navigate('/signup');
      } else {
        toast.error('An error occurred. Please try again later.');
      }
    }
  };

  return (
    <>
      <style>
        {`
          .login-container {
            min-height: 100vh;
            background-color: #f5f5f5;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          
          .background-shapes::before,
          .background-shapes::after,
          .background-shapes span {
            content: '';
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.4;
            animation: moveAround 20s infinite alternate;
          }
        

          .background-shapes span {
            background-color: #000;
            width: 250px;
            height: 250px;
            bottom: 20%;
            right: 35%;
            animation-delay: -7s;
          }
          
          @keyframes moveAround {
            0% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(-50px, 30px) scale(1.1); }
            50% { transform: translate(50px, -30px) scale(0.9); }
            75% { transform: translate(30px, 50px) scale(1.05); }
            100% { transform: translate(0, 0) scale(1); }
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
            padding: 2rem;
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
          }
          
          .input-field {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .input-field:focus {
            border-color: ${primaryColor};
            box-shadow: 0 0 0 3px ${primaryColor}20;
            outline: none;
          }
          
          .login-btn {
            background: ${primaryColor} !important;
            transition: all 0.3s ease;
          }
          
          .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px ${primaryColor}40;
          }
          
          .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #666;
            transition: color 0.2s;
          }
          
          .password-toggle:hover {
            color: ${primaryColor};
          }
          
          .error-message {
            color: #e53e3e;
            margin-top: 8px;
            font-size: 14px;
          }
        `}
      </style>
      <div className="login-container">
        <div className="background-shapes">
          <span></span>
        </div>
        <div className="glass-card">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>Welcome</h1>
            <p className="text-gray-600">Please Login to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="input-field w-full px-4 py-3 rounded-lg transition-all duration-200"
                placeholder="Enter your email"
                required 
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password" 
                  name="password" 
                  className="input-field w-full px-4 py-3 rounded-lg transition-all duration-200"
                  placeholder="Enter your password"
                  required 
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
            </div>
            
            {/* <div className="flex items-center justify-between mb-6">
              <Link 
                to="/forgot-password" 
                className="text-sm hover:underline"
                style={{ color: primaryColor }}
              >
                Forgot password?
              </Link>
            </div> */}
            
            <button 
              type="submit" 
              className="login-btn w-full py-3 rounded-lg font-semibold text-white transition-all duration-200"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AuthPage;