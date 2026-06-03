/**
 * commitlint 配置 — 遵循 Conventional Commits
 * 启用：npm i -D @commitlint/cli @commitlint/config-conventional husky
 * 启用 hook：npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",      // 新功能
        "fix",       // bug 修复
        "docs",      // 文档
        "style",     // 代码风格（不影响逻辑）
        "refactor",  // 重构（不改功能也不修 bug）
        "perf",      // 性能优化
        "test",      // 测试相关
        "build",     // 构建系统 / 外部依赖
        "ci",        // CI 配置
        "chore",     // 杂项
        "revert",    // 回滚
        "brand",     // 派生品牌相关变更
      ],
    ],
    "subject-case": [0],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
