import { Auth } from 'aws-amplify'
import React, { useEffect } from 'react'
import institutionData from "../../../constants";

const Logout = () => {
  useEffect(() => {
    const onLoad = async () => {
      // Log the values to understand what we're working with
      console.log("BETA_DOMAIN:", institutionData.BETA_DOMAIN);
      
      const domain = import.meta.env.VITE_APP_STAGE === 'PROD' ?
        institutionData.BETA_DOMAIN : institutionData.BETA_DOMAIN;
      console.log("Domain being used:", domain);
      
      const client_id = import.meta.env.VITE_APP_STAGE === 'PROD' ?
        import.meta.env.VITE_APP_PROD_CLIENT_ID : import.meta.env.VITE_APP_DEV_CLIENT_ID;
      console.log("Client ID:", client_id);
      
      const redirect = import.meta.env.NODE_ENV === 'development' ?
        'http://localhost:3000/login' : import.meta.env.VITE_APP_STAGE === 'PROD' ?
          `${institutionData.PROD_DOMAIN}/login` : `${institutionData.BETA_DOMAIN}/login`;
      console.log("Redirect URL:", redirect);

      try {
        // Sign out from Amplify first
        await Auth.signOut();
        
        // Check if domain looks like a full domain or just a path
        if (!domain.includes('.')) {
          console.error("Domain appears invalid:", domain);
          // Use a fallback approach
          window.location.replace('/login');
          return;
        }
        
        // Explicitly format the full Cognito logout URL with the https protocol
        const logoutUrl = `https://${domain}/logout?client_id=${client_id}&logout_uri=${encodeURIComponent(redirect)}`;
        console.log("Full logout URL:", logoutUrl);
        
        // Use replace for cleaner history
        window.location.replace(logoutUrl);
      } catch (e) {
        console.error("Logout error:", e);
        window.location.replace('/login');
      }
    }

    onLoad();
  }, [])

  return <div>Logging out...</div>
}

export default Logout