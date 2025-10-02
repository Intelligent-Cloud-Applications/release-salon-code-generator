import {useContext, useEffect} from "react";
import {API, Auth} from "aws-amplify";
import {toast} from "react-toastify";
import Context from "../../Context/Context";
import {useNavigate} from "react-router-dom";
import institutionData from "../../../operation/data.json";

const Redirect = () => {
  const { setLoader, setUserData } = useContext(Context);
  const { institutionId } = institutionData;
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      setLoader(true);

      // Check if auth was successful in the previous step
      const authSuccess = window.sessionStorage.getItem('auth_success');

      if (!authSuccess) {
        toast.error('Authentication failed');
        setLoader(false);
        navigate('/');
        return;
      }

      try {
        // Clear the auth success flag
        window.sessionStorage.removeItem('auth_success');

        // Get the current authenticated user
        const currentUser = await Auth.currentAuthenticatedUser();

        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Fetch user data
        const userdata = await API.get(
          'main',
          `/auth/${institutionId}/user-data`,
          {}
        );

        setUserData(userdata);
        toast.success('Login successful');

        // Get redirect path or use default
        const path = window.sessionStorage.getItem('login_redirect');
        window.sessionStorage.removeItem('login_redirect');

        navigate(path || '/dashboard/billing', { replace: true });
      } catch (e) {
        console.error("Redirect error:", e);
        toast.error(e.message || 'Authentication failed');
        setLoader(false);
        navigate('/');
      } finally {
        setLoader(false);
      }
    }

    redirect();
  }, [navigate, setLoader, setUserData, institutionId]);

  return null; // No UI needed for this component
}

export default Redirect;