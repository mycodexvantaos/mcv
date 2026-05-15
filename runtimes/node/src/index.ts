/**
 * @module runtimes/node/src/index
 * @description Node.js runtime package barrel.
 */

export {
  bootstrapNode,
  createNodeServer,
  type NodeBindings,
  type NodeServiceContainer,
} from './bootstrap.js';
