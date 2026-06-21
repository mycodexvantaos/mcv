'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
const engine_1 = require('./engine');
async function main() {
  const engine = new engine_1.ContractEngine();
  const userContext = {
    userId: 'user123',
    intent: 'deploy application to production',
    preferences: {},
  };
  const result = await engine.executeContract('AC-001', userContext);
  console.log('Final Execution Result:', result);
}
if (require.main === module) {
  main().catch(console.error);
}
__exportStar(require('./engine'), exports);
__exportStar(require('./validator'), exports);
__exportStar(require('./types'), exports);
