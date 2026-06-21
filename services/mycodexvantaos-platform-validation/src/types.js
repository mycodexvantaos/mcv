'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ValidationSeverity = exports.ValidationStatus = exports.ValidationLayer = void 0;
var ValidationLayer;
(function (ValidationLayer) {
  ValidationLayer['L_A_INTENT'] = 'L-A-Intent-Validation';
  ValidationLayer['L_B_SECURITY'] = 'L-B-Security-Validation';
  ValidationLayer['L_C_COMPLIANCE'] = 'L-C-Compliance-Validation';
  ValidationLayer['L_D_RESOURCE'] = 'L-D-Resource-Validation';
  ValidationLayer['L_E_BEHAVIORAL'] = 'L-E-Behavioral-Validation';
  ValidationLayer['L_F_QUALITY'] = 'L-F-Quality-Validation';
})(ValidationLayer || (exports.ValidationLayer = ValidationLayer = {}));
var ValidationStatus;
(function (ValidationStatus) {
  ValidationStatus['PASSED'] = 'passed';
  ValidationStatus['FAILED'] = 'failed';
  ValidationStatus['WARNING'] = 'warning';
  ValidationStatus['TIMEOUT'] = 'timeout';
  ValidationStatus['ERROR'] = 'error';
})(ValidationStatus || (exports.ValidationStatus = ValidationStatus = {}));
var ValidationSeverity;
(function (ValidationSeverity) {
  ValidationSeverity['CRITICAL'] = 'critical';
  ValidationSeverity['HIGH'] = 'high';
  ValidationSeverity['MEDIUM'] = 'medium';
  ValidationSeverity['LOW'] = 'low';
  ValidationSeverity['INFO'] = 'info';
})(ValidationSeverity || (exports.ValidationSeverity = ValidationSeverity = {}));
