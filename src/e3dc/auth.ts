
import axios, { AxiosInstance } from 'axios';
import { JSDOM } from 'jsdom';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

let authClient: AxiosInstance | undefined;
function getAuthClient(): AxiosInstance
{
  if (!authClient) {
    const cookieJar = new CookieJar();
    authClient = wrapper(axios.create({
      jar: cookieJar,
      withCredentials: true,
    }));
  }
  return authClient;
}

/**
 * @returns JWT
 */
export async function authenticate(
  options: {
    username: string,
    password: string,
  },
): Promise<string> {
  const { username, password } = options;
  const authState = await getAuthState();
  const samlResponse = await getSAMLResponse({
    username,
    password,
    authState});
  return getToken(samlResponse);
}

function throwHtmlErrorIfExists(dom: JSDOM): void {
  const errorMessage = dom.window.document.querySelector('div.error-message > div.body2');
  if (errorMessage) {
    throw new Error(errorMessage.innerHTML.trim());
  }
}

async function getAuthState(): Promise<string> {
  console.log('Pinging login page to retrieve AuthState...');

  const response = await getAuthClient()({
    method: 'get',
    url: 'https://e3dc.e3dc.com/auth-saml/service-providers/customer/login?app=e3dc',
    withCredentials: true,
  });

  if (typeof response.data !== 'string') {
    throw new Error('Unexpected response data type');
  }

  const dom = new JSDOM(response.data);
  throwHtmlErrorIfExists(dom);

  const authStateInput = dom.window.document.querySelector('input[name="AuthState"]');
  if (!authStateInput) {
    throw new Error('AuthState input not found');
  }

  const authState = authStateInput.getAttribute('value');
  if (!authState) {
    throw new Error('AuthState is not set');
  }

  return authState;
}

async function getSAMLResponse(
  options: {
    username: string,
    password: string,
    authState: string,
  },
): Promise<string> {
  console.log('Sending login request...');

  const { username, password, authState } = options;

  const form = new FormData();
  form.append('username', username);
  form.append('password', password);
  form.append('AuthState', authState);

  const response = await getAuthClient()({
    method: 'post',
    url: 'https://customer.sso.e3dc.com/module.php/core/loginuserpass.php',
    withCredentials: true,
    data: form,
    headers: {
      Origin: 'https://customer.sso.e3dc.com',
    },
  });


  if (typeof response.data !== 'string') {
    throw new Error('Unexpected response data type');
  }

  const dom = new JSDOM(response.data);
  throwHtmlErrorIfExists(dom);

  const samlResponseInput = dom.window.document.querySelector('input[name="SAMLResponse"]');
  if (!samlResponseInput) {
    throw new Error('SAMLResponse input not found');
  }

  const samlResponse = samlResponseInput.getAttribute('value');
  if (!samlResponse) {
    throw new Error('SAMLResponse is not set');
  }

  return samlResponse;
}

async function getToken(samlResponse: string): Promise<string> {
  console.log('Retrieving Api authentication token...');

  const form = new FormData();
  form.append('SAMLResponse', samlResponse);

  const response = await getAuthClient()({
    method: 'post',
    url: 'https://e3dc.e3dc.com/auth-saml/service-providers/customer/assert',
    headers: {
      Origin: 'https://customer.sso.e3dc.com',
      Referer: 'https://customer.sso.e3dc.com',
    },
    data: form,
  });

  const request = response.request as { res: { responseUrl: unknown }};
  const redirectUrl = request.res.responseUrl;

  if (typeof redirectUrl !== 'string') {
    throw new Error('Unexpected responseUrl type');
  }

  const matches = redirectUrl.match(/token=(.+)&reAuthToken/);

  if (matches?.length !== 2) {
    throw new Error('Unexpected input for redirectUrl');
  }

  return matches[1];
}
