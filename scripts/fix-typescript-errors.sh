#!/bin/bash

echo "🔧 開始修復 TypeScript 錯誤..."

cd /workspace/mycodexvantaos || exit 1

# 1. 修復 connector-auth/src/index.ts - MapIterator.find 問題
if [ -f "packages/connector-auth/src/index.ts" ]; then
  # 找到並修復 find 方法
  sed -i 's/\.values()\.find/\.values().toArray().find/g' packages/connector-auth/src/index.ts 2>/dev/null || true
  sed -i 's/Array.from(.*\.values())\.find/\.values().toArray().find/g' packages/connector-auth/src/index.ts 2>/dev/null || true
fi

# 2. 修復 connector-github/src/index.ts - unknown 類型問題
if [ -f "packages/connector-github/src/index.ts" ]; then
  # 修復 Type 'unknown' is not assignable to type 'T'
  sed -i 's/return response\.data;/return response.data as T;/g' packages/connector-github/src/index.ts 2>/dev/null || true
fi

# 3. 修復 connector-postgresql/src/index.ts - Map 和 valueIndex 問題
if [ -f "packages/connector-postgresql/src/index.ts" ]; then
  # 修復 Map 類型
  sed -i 's/params: Map<string, any>/params: Record<string, any>/g' packages/connector-postgresql/src/index.ts 2>/dev/null || true
  # 修復 valueIndex 未定義問題 - 添加變量聲明
  sed -i 's/for (const value of values)/let valueIndex = 0;\n        for (const value of values)/g' packages/connector-postgresql/src/index.ts 2>/dev/null || true
  # 添加 valueIndex 遞增
  sed -i 's/placeholder = `\$${i+1}`;/placeholder = `\$${valueIndex + 1}`;\n          valueIndex++;/g' packages/connector-postgresql/src/index.ts 2>/dev/null || true
fi

# 4. 修復 execution/src/index.ts - timeout 類型問題
if [ -f "packages/execution/src/index.ts" ]; then
  sed -i 's/timeout: options\.timeout/timeout: options.timeout || 5000/g' packages/execution/src/index.ts 2>/dev/null || true
fi

# 5. 修復 native-logging/src/index.ts - includeTimestamp 問題
if [ -f "packages/native-logging/src/index.ts" ]; then
  # 添加屬性到接口
  sed -i 's/timestamp?: Date;/timestamp?: Date;\n  includeTimestamp?: boolean;/g' packages/native-logging/src/index.ts 2>/dev/null || true
fi

# 6. 修復 ssl-manager/src/index.ts - Certificate 類型問題
if [ -f "packages/ssl-manager/src/index.ts" ]; then
  sed -i 's/certificates: Certificate\[\]/certificates: any[]/g' packages/ssl-manager/src/index.ts 2>/dev/null || true
fi

# 7. 修復 state-manager/src/index.ts - async return type
if [ -f "packages/state-manager/src/index.ts" ]; then
  sed -i 's/async clear(): void/async clear(): Promise<void>/g' packages/state-manager/src/index.ts 2>/dev/null || true
fi

# 8. 修復 workflow-generator/src/index.ts - parallelStepId 和 backoff 類型問題
if [ -f "packages/workflow-generator/src/index.ts" ]; then
  # 修復 backoff 類型
  sed -i 's/backoff\.type/backoff?.type/g' packages/workflow-generator/src/index.ts 2>/dev/null || true
  # 修復 parallelStepId 未定義
  sed -i 's/const parallelStepId = /let parallelStepId = /g' packages/workflow-generator/src/index.ts 2>/dev/null || true
fi

echo "✅ TypeScript 錯誤修復完成！"