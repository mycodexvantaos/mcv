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
const regex_table_1 = require("./utils/regex-table");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ArchitectureValidationEngine {
    rootDir;
    errors = [];
    warnings = [];
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    run() {
        console.log('🚀 Starting MyCodeXvantaOS Architecture Validation Engine...');
        this.validateServices();
        this.validatePackages();
        this.validateProviders();
        this.report();
    }
    validateServices() {
        const servicesPath = path.join(this.rootDir, 'services');
        if (!fs.existsSync(servicesPath)) {
            this.warnings.push('No services directory found.');
            return;
        }
        const services = fs.readdirSync(servicesPath).filter(d => fs.statSync(path.join(servicesPath, d)).isDirectory());
        for (const service of services) {
            if (!regex_table_1.RegexTable.SERVICE_ID.test(service)) {
                this.errors.push(`[Service Naming] Invalid service id: ${service}`);
            }
            const servicePath = path.join(servicesPath, service);
            this.checkRequiredFiles(servicePath, ['package.json'], `Service ${service}`);
            const pkgPath = path.join(servicePath, 'package.json');
            if (fs.existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    if (pkg.name !== service && pkg.name !== `@mycodexvantaos/${service.replace('mycodexvantaos-', '')}`) {
                        // Allowing variations, but better enforce the standard package name pattern:
                        if (!regex_table_1.RegexTable.PACKAGE_NAME.test(pkg.name) && pkg.name !== service) {
                            this.warnings.push(`[Package Name] Service ${service} has unexpected package name: ${pkg.name}`);
                        }
                    }
                }
                catch (e) {
                    this.errors.push(`[JSON Parse] Could not parse package.json for service ${service}`);
                }
            }
        }
    }
    validatePackages() {
        const packagesPath = path.join(this.rootDir, 'packages');
        if (!fs.existsSync(packagesPath))
            return;
        const packages = fs.readdirSync(packagesPath).filter(d => fs.statSync(path.join(packagesPath, d)).isDirectory());
        for (const pkg of packages) {
            const pkgDir = path.join(packagesPath, pkg);
            this.checkRequiredFiles(pkgDir, ['package.json', 'src'], `Package ${pkg}`);
        }
    }
    validateProviders() {
        const providersPath = path.join(this.rootDir, 'providers');
        if (!fs.existsSync(providersPath))
            return;
        const files = fs.readdirSync(providersPath).filter(f => f.endsWith('.ts'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(providersPath, file), 'utf8');
            if (!content.includes('class') || !content.includes('implements')) {
                this.warnings.push(`[Provider Implementation] ${file} does not seem to export a class implementing an interface.`);
            }
            // Native Providers should definitely implement Native Fallback
            if (file.includes('native')) {
                if (!content.includes("mode: 'native'")) {
                    this.errors.push(`[Provider Manifest] Native provider ${file} MUST declare mode: 'native' in its manifest.`);
                }
            }
        }
    }
    checkRequiredFiles(dir, required, context) {
        for (const req of required) {
            if (!fs.existsSync(path.join(dir, req))) {
                this.errors.push(`[Missing File] ${context} is missing required file/folder: ${req}`);
            }
        }
    }
    report() {
        console.log(`\n=================================================`);
        console.log(`🔍 Validation Report`);
        console.log(`=================================================`);
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.forEach(w => console.log(`  - ${w}`));
        }
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(e => console.log(`  - ${e}`));
            console.log(`\n💥 Architecture validation FAILED.`);
            process.exit(1);
        }
        else {
            console.log(`\n✅ All architecture checks PASSED! System is robust.`);
        }
    }
}
const engine = new ArchitectureValidationEngine(path.join(__dirname, '..'));
engine.run();
