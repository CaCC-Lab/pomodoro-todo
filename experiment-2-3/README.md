# 実験2: 独自計画方式によるAI比較実験

**実験タイプ**: Independent Planning Experiment
**実験日**: 2025-10-27~
**ステータス**: 🚀 準備完了 - 実行可能

---

## 📋 実験概要

### 実験の目的

各AIの**真の総合力（計画力 + 実装力）**を公平に評価する。

### 実験1との違い

| 項目 | 実験1（共通計画） | 実験2（独自計画） |
|-----|-----------------|-----------------|
| **計画作成** | Multi-AIのみ | 各AI独自に作成 |
| **実装** | 同じ計画で実装 | 自分の計画で実装 |
| **評価対象** | 実装力のみ | 計画力 + 実装力 |
| **バイアス** | Multi-AI有利 | 公平 |
| **満点** | 60点 | 75点（計画15点+実装60点） |

---

## 🎯 実験の3フェーズ

### Phase 1: 独自計画作成
- 各AIが `prompt.txt` から独自の実装計画を作成
- 出力: `{AI名}/PLAN.md`

### Phase 2: 実装
- 各AIが自分の `PLAN.md` に基づいて実装
- 出力: `{AI名}/output/（index.html, app.js, style.css）`

### Phase 3: 評価
- **Phase 3-1**: 計画評価（10点満点 → 15点換算）
- **Phase 3-2**: 実装評価（60点満点）
- **Phase 3-3**: 総合評価（75点満点）

---

## 📁 ディレクトリ構造

```
experiment-2-independent-plans/
├── README.md                    # このファイル
├── EXPERIMENT_GUIDE.md          # 詳細手順書
├── PLAN_EVALUATION_CRITERIA.md # 計画評価基準
├── prompt.txt                   # 共通要件（29KB）
│
├── 1-multi-ai-independent/
│   ├── PLAN.md                  # ✅ 作成待ち
│   ├── output/                  # ✅ 作成待ち
│   └── logs/
│
├── 2-claude-independent/
├── 3-codex-independent/
├── 4-gemini-independent/
├── 5-amp-independent/
├── 6-droid-independent/
├── 7-cursor-independent/
└── 8-qwen-independent/
```

---

## 🚀 クイックスタート

### ステップ1: 手順書を確認

```bash
cat EXPERIMENT_GUIDE.md
```

### ステップ2: Phase 1 - 計画作成

```bash
# 例: Claudeの計画作成
cd 1-claude-independent
cat ../prompt.txt | claude --plan-only > PLAN.md

# すべてのAIで同様に実施
```

### ステップ3: 計画の検証

```bash
cd ..
md5sum */PLAN.md  # すべて異なるはず
```

### ステップ4: Phase 2 - 実装

```bash
# 例: Claudeの実装
cd 1-claude-independent
cat PLAN.md | claude "この計画で実装してください" > output/
```

### ステップ5: Phase 3 - 評価

詳細は `EXPERIMENT_GUIDE.md` と `PLAN_EVALUATION_CRITERIA.md` を参照。

---

## 📊 予測される結果

### 実験1 vs 実験2 比較（予測）

| AI | 実験1 | 実験2予測 | 変化 | 理由 |
|----|-------|----------|------|------|
| Droid | 52/60 | 65-68/75 | +13-16 | エンタープライズ設計で計画高評価 |
| Multi-AI | 48/60 | 60-63/75 | +12-15 | バランス型設計 |
| Codex | 47/60 | 58-61/75 | +11-14 | パフォーマンス重視設計 |
| Amp | 43/60 | 56-59/75 | +13-16 | UX最優先設計で計画高評価 |
| Gemini | 25/60 | 50-55/75 | +25-30 | セキュリティ設計でXSS回避 |

**注**: 実験2では満点が75点なので、スコアが高くなるのは当然。重要なのは**相対的な順位変動**。

---

## 📚 ドキュメント

### 必読

1. **EXPERIMENT_GUIDE.md** - 実験の詳細手順
2. **PLAN_EVALUATION_CRITERIA.md** - 計画評価の基準

### 参考

3. **prompt.txt** - 共通要件（29KB）
4. **../EXPERIMENTAL_DESIGN_ANALYSIS.md** - 実験1の問題点分析
5. **../README.md** - プロジェクト全体の説明

---

## ⚠️ 重要な注意事項

### 独立性の確保

- 各AIは**他のAIの計画・実装を見ない**
- 評価も**ブラインド**で実施

### 時間の記録

- 計画作成時間
- 実装時間
- すべて記録してlogs/に保存

### MD5ハッシュチェック

```bash
# 計画が本当に独自かチェック
md5sum */PLAN.md

# すべて異なるハッシュであることを確認
```

---

## 🎯 次のステップ

### 実験実施

1. ✅ Phase 1: 計画作成（8AI × 各自）
2. ✅ Phase 2: 実装（8AI × 各自）
3. ✅ Phase 3: 評価（計画10点 + 実装60点）

### 結果分析

4. 実験1と実験2の比較
5. 各AIの特性の明確化
6. 真の総合力ランキング作成

### 成果物

7. `EXPERIMENT_2_RESULTS.md` - 結果レポート
8. `EXPERIMENT_1_VS_2_COMPARISON.md` - 比較分析
9. `FINAL_AI_RANKING.md` - 最終ランキング

---

## 📞 サポート

問題が発生したら `EXPERIMENT_GUIDE.md` のトラブルシューティングセクションを参照してください。

---

**準備完了！実験を開始できます。** 🎉

**作成者**: Claude 4
**最終更新**: 2025-10-27
**ステータス**: ✅ Ready for Experiment
