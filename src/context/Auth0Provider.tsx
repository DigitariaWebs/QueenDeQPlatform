import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from '../config/auth0';

interface Auth0ProviderWithConfigProps {
  children: React.ReactNode;
}

export function Auth0ProviderWithConfig({ children }: Auth0ProviderWithConfigProps) {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={auth0Config.authorizationParams}
    >
      {children}
    </Auth0Provider>
  );
}
