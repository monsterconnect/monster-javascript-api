import { Config } from './config';

interface RestApiParams {
  authToken: string;
  host: string;
  namespace: string;
}

interface QueryParams {
  [key: string]: any;
}

interface RequestBody {
  [key: string]: any;
}

export class FetchResult {
  response: Response;
  body: any;
}

export class RestApi {

  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  get(path: string, queryParams: QueryParams = null): Promise<FetchResult> {
    let p = path;
    const qp = this.serializeQueryParams(queryParams);
    if (qp) {
      p = p + '?' + qp;
    }
    return this._fetch(p, { method: 'GET' });
  }

  post(path: string, data: RequestBody = {}): Promise<FetchResult> {
    return this._fetch(path, { method: 'POST', body: JSON.stringify(data) });
  }

  put(path: string, data: RequestBody = {}): Promise<FetchResult> {
    return this._fetch(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(path: string): Promise<FetchResult> {
    return this._fetch(path, { method: 'DELETE' });
  }

  serializeQueryParams(params: QueryParams): string {
    if (params) {
      return Object.keys(params).map((k) => this.serializeQueryParam(k, params[k])).join('&');
    } else {
      return '';
    }
  }

  serializeQueryParam(key: string, value: any): string {
    const k = encodeURIComponent(key);
    const v = encodeURIComponent(value);
    return k + '=' + v;
  }

  protected _fetch(path: string, params: {}): Promise<FetchResult> {
    const url = this._buildUrl(path);
    const requestParams = this._buildRequestParams(params);
    return fetch(url, <any>requestParams).then((response) => {
      return response.json().then((json) => {
        const result = new FetchResult();
        result.response = response;
        result.body = json;
        return result;
      });
    });
  }

  protected _buildUrl(path: string): string {
    return [ this.config.host, this.config.namespace, path ].join('/');
  }

  protected _buildRequestParams(params: {} = {}): {} {
    const defaultParams = {
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token="${this.config.authToken}"`
      }
    };
    return Object.assign({}, defaultParams, params);
  }
}
