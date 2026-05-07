import { msalInstance } from './services/msalConfig';

let initialized = false;

export async function initializeMsal(): Promise<void> {
  if (!msalInstance || initialized) return;

  await msalInstance.initialize();
  initialized = true;

  try {
    const result = await msalInstance.handleRedirectPromise();
    if (result) {
      msalInstance.setActiveAccount(result.account);
      console.log('MSAL redirect handled, account:', result.account?.username);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  } catch (error) {
    console.error('MSAL handleRedirectPromise error:', error);
  }
}
