import { createRoot } from "react-dom/client";
import { Amplify } from 'aws-amplify';
import App from "./App.tsx";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    }
  }
});
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
