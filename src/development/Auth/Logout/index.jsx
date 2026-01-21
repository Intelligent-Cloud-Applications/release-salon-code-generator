import { signOut } from "aws-amplify/auth";
import React, { useEffect } from "react";
import institutionData from "../../../constants";

const Logout = () => {
  useEffect(() => {
    const onLoad = async () => {
      const domain =
        import.meta.env.VITE_APP_STAGE === "PROD"
          ? institutionData.BETA_DOMAIN
          : institutionData.BETA_DOMAIN;

      const client_id =
        import.meta.env.VITE_APP_STAGE === "PROD"
          ? import.meta.env.VITE_APP_PROD_CLIENT_ID
          : import.meta.env.VITE_APP_DEV_CLIENT_ID;

      const redirect =
        import.meta.env.NODE_ENV === "development"
          ? "http://localhost:3000/login"
          : import.meta.env.VITE_APP_STAGE === "PROD"
            ? `${institutionData.PROD_DOMAIN}/login`
            : `${institutionData.BETA_DOMAIN}/login`;

      try {
        await signOut();

        if (!domain.includes(".")) {
          console.error("Domain appears invalid:", domain);
          window.location.replace("/login");
          return;
        }

        const logoutUrl = `https://${domain}/logout?client_id=${client_id}&logout_uri=${encodeURIComponent(redirect)}`;

        window.location.replace(logoutUrl);
      } catch (e) {
        console.error("Logout error:", e);
        window.location.replace("/login");
      }
    };

    onLoad();
  }, []);

  return <div>Logging out...</div>;
};

export default Logout;
