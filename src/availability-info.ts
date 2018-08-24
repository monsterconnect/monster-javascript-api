/** Describes the current availability of the MonsterConnect platform */
export default class AvailabilityInfo {

  /**
    * A value that indicates the level of agent availability on the MonsterConnect platform.
    * The higher the value, the more agents that are availabile.
  */
  metric: number;

  constructor(params: any = {}) {
    this.metric = params.metric;
  }
}
