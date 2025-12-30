import { useContext, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { get } from "aws-amplify/api";
import { toast } from "react-toastify";
import Context from "../../Context/Context";
import { useNavigate } from "react-router-dom";
import institutionData from "../../../operation/data.json";

const Redirect = () => {
  const { setLoader, setUserData } = useContext(Context);
  const { institutionId } = institutionData;
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      setLoader(true);

      const authSuccess = window.sessionStorage.getItem("auth_success");

      if (!authSuccess) {
        toast.error("Authentication failed");
        setLoader(false);
        navigate("/");
        return;
      }

      try {
        window.sessionStorage.removeItem("auth_success");

        // CHANGE 1: getCurrentUser replaces Auth.currentAuthenticatedUser
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          throw new Error("No authenticated user found");
        }

        // CHANGE 2: API.get replaced with get() logic
        const restOperation = get({
          apiName: "main",
          path: `/auth/${institutionId}/user-data`,
        });

        const { body } = await restOperation.response;
        const userdata = await body.json();

        setUserData(userdata);
        toast.success("Login successful");

        const path = window.sessionStorage.getItem("login_redirect");
        window.sessionStorage.removeItem("login_redirect");

        navigate(path || "/dashboard/billing", { replace: true });
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
  }, [navigate, setLoader, setUserData, institutionId]);

  return null;
};

export default Redirect;
