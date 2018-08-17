export type LeadSelectionMethod = 'list' | 'queue';

/**
  * The configuration parameters to pass into a Client. */
export interface ConfigParams {

  /** The host of the MonsterConnect API, usually https://app.monsterconnect.com. */
  host?: string;

  /** The namespace of the MonsterConnect API (for versioning purposes). Defaults to 'api/v1'. */
  namespace?: string;

  /** The secure authorization token that identifies a MonsterConnect user account. */
  authToken?: string;

  /** Specifies how the leads are to be selected within a call session. */
  leadSelectionMethod?: LeadSelectionMethod;

  /** Specifies whether or not debug logging is enabled or not. Defaults to false. */
  debug?: boolean;
}

/** The default configuration parameters */
export class Config implements ConfigParams {
  host: string = 'https://app.monsterconnect.com';
  namespace: string = 'api/v1';
  authToken: string;
  leadSelectionMethod: LeadSelectionMethod = 'list';
  debug: boolean = false;
  [key: string]: any;

  constructor(params: ConfigParams) {
    this.assign(params);
  }

  assign(params: ConfigParams) {
    if (params.hasOwnProperty('host')) { this.host = params.host }
    if (params.hasOwnProperty('namespace')) { this.namespace = params.namespace }
    if (params.hasOwnProperty('authToken')) { this.authToken = params.authToken }
    if (params.hasOwnProperty('leadSelectionMethod')) { this.leadSelectionMethod = params.leadSelectionMethod }
    if (params.hasOwnProperty('debug')) { this.debug = params.debug }
  }

}
