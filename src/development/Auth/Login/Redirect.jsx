import { useContext, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { get } from "aws-amplify/api";
import { toast } from "react-toastify";
import Context from "../../Context/Context";
import { useNavigate } from "react-router-dom";
import institutionData from "../../../operation/data.json";

const Redirect = () => {
  const { setLoader, setUserData, setIsAuth } = useContext(Context);
  const { institutionId } = institutionData;
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      setLoader(true);

      try {
        window.sessionStorage.removeItem("auth_success");

        // getCurrentUser verifies user authentication
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          throw new Error("No authenticated user found");
        }

        // Fetch authenticated user profile data
        const restOperation = get({
          apiName: "main",
          path: `/auth/${institutionId}/user-data`,
        });

        const { body } = await restOperation.response;
        const userdata = await body.json();

        setUserData(userdata);
        if (setIsAuth) setIsAuth(true);
        toast.success("Login successful");

        const path = window.sessionStorage.getItem("login_redirect");
        window.sessionStorage.removeItem("login_redirect");

        navigate(path || "/dashboard", { replace: true });
      } catch (e) {
        console.error("Redirect error:", e);
        toast.error(e.message || "Authentication failed");
        setLoader(false);
        navigate("/");
      } finally {
        setLoader(false);
      }
    };

    redirect();
  }, [navigate, setLoader, setUserData, setIsAuth, institutionId]);

  return null;
};

export default Redirect;
