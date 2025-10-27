const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    if (!this.global.window) {
      const { window } = new (require('jsdom').JSDOM)('', { url: 'http://localhost' });
      this.global.window = window;
      this.global.document = window.document;
    }
  }
}

module.exports = CustomEnvironment;
