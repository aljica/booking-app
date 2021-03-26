/**
 * @class Assistant
 */
class Assistant {
  constructor(name) {
    this.id = Math.random();
    this.name = name;
    this.sessionID = null;
  }
}

module.exports = Assistant;
