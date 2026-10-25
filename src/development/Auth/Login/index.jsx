import React, { useContext, useState, useEffect } from "react";
import { signIn, getCurrentUser } from "aws-amplify/auth";
import { toast } from "react-toastify";
import Context from "../../Context/Context";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";

const AuthPage = () => {
  const { isAuth, getUserData, setLoader, landingPageData, institutionData } = useContext(Context);
  const navigate = useNavigate();

  const theme = landingPageData?.theme || institutionData?.landingPageData?.theme || {};
  const primaryColor = theme.primary || '#4A121B';
  const goldColor = theme.gold || '#D4A574';
  const canvasBg = theme.bg || '#F4EDE3';
  const salonName = landingPageData?.site?.name || institutionData?.companyName || 'Tekkzy Salon';

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, directly navigate to dashboard
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      if (isAuth) {
        const path = window.sessionStorage.getItem("login_redirect");
        window.sessionStorage.removeItem("login_redirect");
        navigate(path || "/dashboard", { replace: true });
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (currentUser && isMounted) {
          if (getUserData) {
            try {
              await getUserData();
            } catch (err) {
              console.error("Error fetching user data on check:", err);
            }
          }
          const path = window.sessionStorage.getItem("login_redirect");
          window.sessionStorage.removeItem("login_redirect");
          navigate(path || "/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        // User is not authenticated, show login form
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, [isAuth, navigate, getUserData]);

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
      setIsSubmitting(true);
      setLoader(true);
      console.log("Attempting to login with:", email);

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password,
      });

      console.log("Login successful", isSignedIn);

      if (isSignedIn) {
        // Load user profile details immediately
        if (getUserData) {
          try {
            await getUserData();
          } catch (err) {
            console.error("Error fetching user data:", err);
          }
        }

        toast.success("Login successful");
        const path = window.sessionStorage.getItem("login_redirect");
        window.sessionStorage.removeItem("login_redirect");
        window.sessionStorage.removeItem("auth_success");

        // Directly navigate to dashboard
        navigate(path || "/dashboard", { replace: true });
      } else {
        console.log("Next step required:", nextStep);
      }
    } catch (e) {
      console.error("Login error", e);
      setLoginError(e.message || "Invalid credentials. Please verify and try again.");

      if (e.name === "NotAuthorizedException") {
        toast.error("Incorrect username or password.");
      } else if (e.name === "UserNotFoundException") {
        toast.error("User does not exist. Please sign up.");
      } else {
        toast.error(e.message || "An error occurred during authentication.");
      }
    } finally {
      setIsSubmitting(false);
      setLoader(false);
    }
  };

  if (isAuth || checkingAuth) {
    return (
      <div
        className="min-h-[calc(100vh-72px)] flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 relative overflow-hidden font-sans select-none"
        style={{ backgroundColor: canvasBg }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={32} className="animate-spin" style={{ color: primaryColor }} />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C524E]">
            {isAuth ? "Redirecting to Dashboard..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-72px)] flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 relative overflow-hidden font-sans select-none"
      style={{ backgroundColor: canvasBg }}
    >
      {/* Ambient background glows matching theme */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div
          className="absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${primaryColor}26` }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${goldColor}33` }}
        />
      </div>

      {/* Luxury Glass Login Card */}
      <div
        className="relative z-10 w-full max-w-[440px] bg-white/90 backdrop-blur-xl border-2 rounded-3xl p-7 sm:p-10 shadow-2xl text-[#191514]"
        style={{ borderColor: `${goldColor}60` }}
      >
        {/* Header */}
        <div className="text-center mb-7">
          <p
            className="text-2xl sm:text-3xl leading-tight mb-1"
            style={{
              fontFamily: "'Alex Brush', 'Great Vibes', cursive",
              color: primaryColor,
            }}
          >
            Welcome to {salonName}
          </p>

          <h1
            className="uppercase font-bold tracking-wider text-2xl sm:text-3xl"
            style={{
              fontFamily: "'Playfair Display', Didot, serif",
              color: primaryColor,
            }}
          >
            Sign In
          </h1>

          <div
            className="w-16 h-[2px] mx-auto my-3"
            style={{
              background: `linear-gradient(90deg, transparent, ${goldColor}, transparent)`,
            }}
          />

          <p className="text-xs sm:text-sm text-[#5C524E]">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2422] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: `${primaryColor}99` }}
              />
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all shadow-sm"
                style={{
                  borderColor: `${goldColor}60`,
                  color: '#191514',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = goldColor;
                  e.target.style.boxShadow = `0 0 0 3px ${goldColor}25`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${goldColor}60`;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2422] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: `${primaryColor}99` }}
              />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all shadow-sm"
                style={{
                  borderColor: `${goldColor}60`,
                  color: '#191514',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = goldColor;
                  e.target.style.boxShadow = `0 0 0 3px ${goldColor}25`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${goldColor}60`;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#5C524E] hover:text-[#191514] transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 leading-relaxed animate-fadeIn">
              {loginError}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: primaryColor }}
            className="w-full text-[#F6EFE5] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] py-3 sm:py-3.5 rounded-xl transition-all duration-300 hover:opacity-90 hover:shadow-xl active:scale-98 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#F6EFE5]" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Return to website link */}
        <div className="mt-6 pt-5 border-t border-black/5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
            style={{ color: primaryColor }}
          >
            <ArrowLeft size={13} />
            <span>Return to Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
