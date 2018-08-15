export default class RestApi {

  constructor(params = {}) {
    this.authToken = params.authToken;
    this.host = params.host;
    this.namespace = params.namespace;
  }

  get(path, queryParams) {
    return this._fetch(path, { method: 'GET' });
  }

  post(path, data = {}) {
    return this._fetch(path, { method: 'POST', body: JSON.stringify(data) });
  }

  put(path, data = {}) {
    return this._fetch(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(path) {
    return this._fetch(path, { method: 'DELETE' });
  }

  /**
    * @private
  */
  _fetch(path, params) {
    const url = this._buildUrl(path);
    const requestParams = this._buildRequestParams(params);
    return fetch(url, requestParams).then((response) => {
      return response.json().then((json) => {
        return { response: response, body: json };
      });
    });
  }

  /**
    * @private
  */
  _buildUrl(path, queryParams = {}) {
    const url = [ this.host, this.namespace, path ].join('/');
    const q = Object.keys(queryParams).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    if (q) {
      return url + '?' + q;
    } else {
      return url;
    }
  }

  /**
    * @private
  */
  _buildRequestParams(params) {
    const defaultParams = {
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token="${this.authToken}"`
      }
    };
    return Object.assign({}, defaultParams, params);
  }
}
