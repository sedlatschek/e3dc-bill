import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const LOGIN_ACTION_REGEX = /"loginAction": "(.+)",/;
const REDIRECT_URL_REGEX = /token=(.+)&reAuthToken/;
// eslint-disable-next-line max-len
const ASSERT_ACTION_REGEX = /"samlPost"\s*:\s*\{\s*(?:(?!\}\s*,).)*?"SAMLResponse"\s*:\s*"(?<SAMLResponse>[^"]+)"\s*,\s*"url"\s*:\s*"(?<url>[^"]+)/;

let authClient: AxiosInstance | undefined;
function getAuthClient(): AxiosInstance {
  if (!authClient) {
    const cookieJar = new CookieJar();
    authClient = wrapper(
      axios.create({
        jar: cookieJar,
        withCredentials: true,
      }),
    );
  }
  return authClient;
}

type LoginActionResponse = {
  samlResponse: string;
  assertUrl: string;
}

/**
 * @returns JWT
 */
export async function authenticate(options: {
  username: string;
  password: string;
}): Promise<string> {
  console.log('\x1b[31m%s\x1b[0m', 'Authenticating');

  const loginActionUrl = await getLoginActionUrl();
  const { username, password } = options;
  const {
    samlResponse,
    assertUrl,
  } = await performLoginAction(loginActionUrl, username, password);
  const token = await getToken(samlResponse, assertUrl);

  console.log('\x1b[32m%s\x1b[0m', '🡒 OK');

  return token;
}

async function getLoginActionUrl(): Promise<string> {
  console.log('\x1b[31m%s\x1b[0m', '🡒 Retrieving Login Action URL');

  const response = await getAuthClient()({
    method: 'get',
    url: 'https://e3dc.e3dc.com/auth-saml/service-providers/customer/login?app=e3dc',
    headers: {
      Referer: 'https://my.e3dc.com/',
    },
  });
  if (typeof response.data !== 'string') {
    throw new Error('Unexpected response data type');
  }

  const matches =  response.data.match(LOGIN_ACTION_REGEX);

  if (!matches?.[1]) {
    throw new Error('Login action URL not found');
  }

  return matches[1];
}

async function performLoginAction(
  url: string,
  username: string,
  password: string,
): Promise<LoginActionResponse> {
  console.log('\x1b[31m%s\x1b[0m', '🡒 Performing Login Action');

  const form = new FormData();
  form.append('username', username);
  form.append('password', password);
  form.append('credentialId', '');

  const response = await getAuthClient()({
    method: 'post',
    url,
    data: form,
    headers: {
      Referer: 'https://my.e3dc.com/',
    },
  })

  if (typeof response.data !== 'string') {
    throw new Error('Unexpected response data type');
  }

  const matches = response.data.match(ASSERT_ACTION_REGEX);

  if (!matches?.groups?.SAMLResponse) {
    throw new Error('SAMLResponse not found');
  }

  if (!matches?.groups?.url) {
    throw new Error('Assert URL not found');
  }

  const samlResponse = matches.groups.SAMLResponse;
  const assertUrl = matches.groups.url;

  return {
    samlResponse,
    assertUrl,
  }
}

async function getToken(samlResponse: string, url: string): Promise<string> {
  console.log('\x1b[31m%s\x1b[0m', '🡒 Retrieving Token');

  const form = new FormData();
  form.append('SAMLResponse', samlResponse);

  const response = await getAuthClient()({
    method: 'post',
    url,
    data: form,
    headers: {
      Origin: null,
    },
  });

  const request = response.request as { res: { responseUrl: unknown } };
  const redirectUrl = request.res.responseUrl;

  if (typeof redirectUrl !== 'string') {
    throw new Error('Unexpected responseUrl type');
  }

  const matches = redirectUrl.match(REDIRECT_URL_REGEX);

  if (matches?.length !== 2) {
    throw new Error('Unexpected input for redirectUrl');
  }

  return matches[1];
}
