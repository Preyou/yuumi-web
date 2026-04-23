# P1-DELIVERY-CHECKLIST

Priority: P1
Scope: `**`

## Rule
- 完成开发任务前，应执行最小交付检查。
- 最小必选检查命令为：`bun run type-check`。
- `type-check` 未通过前，变更不视为完成。
- 完成任务时需记录本次执行的检查命令与结果。

## Non-Goals
- 不强制每次变更都触发全量构建。
- 不替代代码评审流程。

## Exceptions
- 紧急修复可缩减检查项，但必须在后续补齐。

## Checks
- 在变更说明中记录 `type-check` 执行结果。
- 若未执行或执行失败，评审直接驳回。
