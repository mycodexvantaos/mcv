"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeObservabilityProvider = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class NativeObservabilityProvider {
    manifest = { capability: 'observability', provider: 'native-console', mode: 'native' };
    async initialize() { }
    async healthCheck() { return { status: 'healthy' }; }
    async shutdown() { }
    log(level, msg) { console.log(`[${level.toUpperCase()}] ${msg}`); }
    async publishMetrics(id, metrics) {
        console.log(`[Metrics] Delegating publication for ${id} to publish-metrics.py...`);
        const tempFile = path.join(process.cwd(), `.temp-metrics-${id}.json`);
        fs.writeFileSync(tempFile, JSON.stringify(metrics, null, 2), 'utf8');
        const scriptPath = path.join(process.cwd(), 'vector-store', 'retrieval-pipelines', 'src', 'publish-metrics.py');
        (0, child_process_1.exec)(`python3 "${scriptPath}" --execution-id="${id}" --state-file="${tempFile}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Metrics Error] Failed to run publish-metrics.py: ${error.message}`);
                return;
            }
            if (stderr)
                console.error(`[Metrics Stderr] ${stderr}`);
            console.log(stdout.trim());
            try {
                fs.unlinkSync(tempFile);
            }
            catch (e) { }
        });
    }
}
exports.NativeObservabilityProvider = NativeObservabilityProvider;
