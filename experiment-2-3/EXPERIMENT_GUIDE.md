# 実験2: 独自計画方式によるAI比較実験 - 実験手順書

**実験名**: Independent Planning Experiment
**実験日**: 2025-10-27
**実験者**: Multi-AI Orchestrium Project
**バージョン**: 2.0
**目的**: 各AIの真の総合力（計画力 + 実装力）を公平に評価する

---

## 📋 実験概要

### 実験1（共通計画方式）の問題点

```
問題: Multi-AIが計画を作成 → 全AIが同じ計画で実装
結果: 実装力のみ評価、計画力は未評価
バイアス: Multi-AI有利、他AIの設計思想が評価されない
```

### 実験2（独自計画方式）の改善点

```
改善: 各AIが独自に計画を作成 → 各AIが自分の計画で実装
結果: 計画力 + 実装力 = 真の総合力を評価
公平性: すべてのAIが同じ要件からスタート
```

---

## 🎯 実験の3フェーズ

### Phase 1: 独自計画作成（新規）

**目的**: 各AIの設計思想・優先順位判断を評価

```bash
# 各AIに同じprompt.txtのみを渡す
# AIは独自に実装計画を作成

入力: prompt.txt（要件のみ、実装方法の指示なし）
出力: {AI名}/PLAN.md（独自の実装計画書）
時間: 無制限（ただし記録）
```

**計画に含めるべき内容**:
1. アーキテクチャ設計
2. データモデル設計
3. 実装の優先順位
4. 技術選択の理由
5. セキュリティ・パフォーマンス戦略
6. 開発フロー

### Phase 2: 実装（既存手法）

**目的**: 自分の計画に基づく実装能力を評価

```bash
# 各AIが自分のPLAN.mdを参照して実装

入力: {AI名}/PLAN.md（自分の計画）+ prompt.txt（要件）
出力: {AI名}/output/（index.html, app.js, style.css）
時間: 無制限（ただし記録）
```

### Phase 3: 評価（新規2段階評価）

**Phase 3-1: 計画評価（10点満点）**
- アーキテクチャの質
- セキュリティ設計
- パフォーマンス設計
- 実装可能性
- 革新性

**Phase 3-2: 実装評価（60点満点）**
- セキュリティ: 10点
- パフォーマンス: 10点
- 保守性: 10点
- アクセシビリティ: 10点
- エンタープライズ: 10点
- UX: 10点

**Phase 3-3: 総合評価（70点満点）**
```
総合スコア = 計画評価（10点）× 1.5 + 実装評価（60点）
          = 15点 + 60点 = 75点満点
```

---

## 📁 ディレクトリ構造

```
experiment-2-independent-plans/
├── prompt.txt                      # 共通の要件（全AIに同じ）
├── EXPERIMENT_GUIDE.md             # この手順書
├── PLAN_EVALUATION_CRITERIA.md    # 計画評価基準（詳細）
│
├── 1-claude-independent/
│   ├── PLAN.md                     # Claude独自の計画
│   ├── output/                     # 実装結果
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   └── logs/                       # ログ・メトリクス
│       ├── plan-time.txt           # 計画作成時間
│       ├── implementation-time.txt  # 実装時間
│       └── metrics.json            # その他メトリクス
│
├── 2-gemini-independent/
│   ├── PLAN.md
│   ├── output/
│   └── logs/
│
├── 3-codex-independent/
├── 4-gemini-independent/
├── 5-amp-independent/
├── 6-droid-independent/
├── 7-cursor-independent/
└── 8-qwen-independent/
```

---

## 🚀 実験手順（詳細）

### ステップ1: 環境準備

```bash
cd /home/ryu/projects/comparison-pomodoro-todo

# ディレクトリ確認
ls -la experiment-2-independent-plans/
ls -la experiment-2-independent-plans/*/
```

**確認事項**:
- ✅ 8つのAIディレクトリが存在
- ✅ 各ディレクトリに output/ と logs/ がある
- ✅ prompt.txt が存在（29KB）

---

### ステップ2: Phase 1 - 計画作成

#### 2-1. Claude独自計画

```bash
cd experiment-2-independent-plans/1-claude-independent

# 計画作成開始時刻を記録
date '+%Y-%m-%d %H:%M:%S' > logs/plan-start.txt

# Claudeに計画を作成させる
cat ../prompt.txt | claude --plan-only > PLAN.md

# 計画作成終了時刻を記録
date '+%Y-%m-%d %H:%M:%S' > logs/plan-end.txt

# 所要時間を計算
# （手動またはスクリプトで）
```

#### 2-2. Multi-AI独自計画

```bash
cd ../1-multi-ai-independent

date '+%Y-%m-%d %H:%M:%S' > logs/plan-start.txt
# Multi-AIは/discuss-beforeと/5ai-orchestrateを使用
cat ../prompt.txt | bash -c "source ~/multi-ai/scripts/orchestrate/orchestrate-multi-ai.sh && multi-ai-discuss-before 'Pomodoro TODO実装計画作成'" > PLAN.md
date '+%Y-%m-%d %H:%M:%S' > logs/plan-end.txt
```

#### 2-3. 同様に他のAIでも実施

```bash
# Claude
cd ../2-claude-independent
cat ../prompt.txt | claude --plan-only > PLAN.md

# Codex
cd ../3-codex-independent
cat ../prompt.txt | codex exec --plan > PLAN.md

# Gemini
cd ../4-gemini-independent
cat ../prompt.txt | gemini -p > PLAN.md

# Amp
cd ../5-amp-independent
cat ../prompt.txt | amp -p > PLAN.md

# Droid
cd ../6-droid-independent
cat ../prompt.txt | droid-agent -p > PLAN.md

# Cursor
cd ../7-cursor-independent
cat ../prompt.txt | cursor-agent -p > PLAN.md

# Qwen
cd ../8-qwen-independent
cat ../prompt.txt | qwen -p > PLAN.md
```

**注意事項**:
- 各AIに「実装計画のみ作成、実装はしない」と明確に指示
- 計画作成時間を正確に記録
- 計画のMD5ハッシュも記録（同一性チェック用）

---

### ステップ3: 計画の検証

```bash
cd /home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans

# すべての計画が作成されたか確認
ls -lh */PLAN.md

# MD5ハッシュで同一性をチェック（すべて異なるはず）
md5sum */PLAN.md

# 各計画の行数を確認
wc -l */PLAN.md
```

**期待される結果**:
- ✅ 8つの PLAN.md が存在
- ✅ すべて異なるMD5ハッシュ（独自計画の証明）
- ✅ 各AIの特徴が反映された計画内容

**もし同一ハッシュが見つかったら**:
- ⚠️ 該当AIの計画を再作成
- ⚠️ 原因を調査（AIが共通計画を参照した可能性）

---

### ステップ4: Phase 2 - 実装

#### 4-1. Claude実装

```bash
cd /home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/1-claude-independent

# 実装開始時刻を記録
date '+%Y-%m-%d %H:%M:%S' > logs/implementation-start.txt

# Claudeに自分の計画で実装させる
cat PLAN.md ../prompt.txt | claude --implement > output/index.html

# または分割して実装
cat PLAN.md | claude "この計画に基づいてindex.htmlを作成" > output/index.html
cat PLAN.md | claude "この計画に基づいてapp.jsを作成" > output/app.js
cat PLAN.md | claude "この計画に基づいてstyle.cssを作成" > output/style.css

# 実装終了時刻を記録
date '+%Y-%m-%d %H:%M:%S' > logs/implementation-end.txt
```

#### 4-2. 同様に他のAIでも実施

```bash
# Gemini
cd ../2-gemini-independent
# ... (同様の手順)

# Amp
cd ../3-amp-independent
# ... (同様の手順)

# Qwen, Droid, Codex, Cursor も同様
```

**注意事項**:
- 各AIは**自分のPLAN.md**のみを参照
- 他のAIの計画や実装は一切見せない
- 実装時間を正確に記録
- 途中でエラーが出たら記録

---

### ステップ5: Phase 3 - 評価

#### 5-1. 計画評価（10点満点）

`PLAN_EVALUATION_CRITERIA.md`を参照して、各AIの計画を評価。

**評価項目**:
1. アーキテクチャ設計（2点）
2. セキュリティ設計（2点）
3. パフォーマンス設計（2点）
4. 実装可能性（2点）
5. 革新性・独自性（2点）

**評価方法**:
- 8AI全員で相互レビュー
- 各AIが他の7つの計画を評価
- 平均スコアを算出

#### 5-2. 実装評価（60点満点）

実験1と同じ評価基準を使用：
- セキュリティ: 10点
- パフォーマンス: 10点
- 保守性: 10点
- アクセシビリティ: 10点
- エンタープライズ: 10点
- UX: 10点

**評価方法**:
- コードレビュー
- セキュリティスキャン（XSS, OWASP Top 10）
- パフォーマンステスト（Lighthouse）
- アクセシビリティテスト（axe DevTools）

#### 5-3. 総合評価（75点満点）

```
総合スコア = 計画評価（10点）× 1.5 + 実装評価（60点）
```

**例（Droid）**:
```
計画評価: 9/10点
実装評価: 52/60点
総合: 9 × 1.5 + 52 = 13.5 + 52 = 65.5/75点
```

---

## 📊 期待される結果

### 実験1 vs 実験2 比較

| AI | 実験1（共通計画） | 実験2予測（独自計画） | 変化 |
|----|-----------------|---------------------|------|
| Droid | 52/60点 | 65-68/75点 | +13-16点 |
| Multi-AI | 48/60点 | 60-63/75点 | +12-15点 |
| Codex | 47/60点 | 58-61/75点 | +11-14点 |
| Amp | 43/60点 | 56-59/75点 | +13-16点 |
| Gemini | 25/60点 | 50-55/75点 | +25-30点（セキュリティ設計） |

**予測の根拠**:
- Droid: エンタープライズ設計思想で計画が高評価
- Gemini: セキュリティファースト設計でXSS回避
- Amp: UX最優先設計で計画が高評価
- Qwen: ミニマル設計+高速実装で効率的

---

## ⚠️ 注意事項とトラブルシューティング

### 注意事項

1. **独立性の確保**
   - 各AIは他のAIの計画・実装を見ない
   - 評価者も事前に内容を見ない（ブラインド評価）

2. **時間の記録**
   - 計画作成時間
   - 実装時間
   - 合計時間

3. **バージョン管理**
   - すべての成果物をgitで管理
   - コミットメッセージに時刻を含める

### トラブルシューティング

#### 問題: AIが計画を作成せず、直接実装を開始

**対処法**:
```bash
# プロンプトを明確にする
echo "以下の要件に基づいて、実装計画のみを作成してください。実装はしないでください。" | cat - prompt.txt | AI名
```

#### 問題: 計画のMD5ハッシュが重複

**対処法**:
1. 計画内容を目視確認
2. 本当に同じ内容なら、AIに再生成を依頼
3. シード値やプロンプトを微調整

#### 問題: AIが要件を誤解

**対処法**:
1. prompt.txtを明確化
2. 具体例を追加
3. 評価基準を事前に提示

---

## 📦 成果物チェックリスト

### Phase 1完了時

- [ ] 8つの PLAN.md が存在
- [ ] すべて異なるMD5ハッシュ
- [ ] 各計画に必要な項目が含まれている
- [ ] 計画作成時間が記録されている

### Phase 2完了時

- [ ] 8つの output/ ディレクトリに3ファイルずつ
- [ ] すべてのHTMLがブラウザで正常に表示
- [ ] 実装時間が記録されている

### Phase 3完了時

- [ ] 計画評価スコア（8AI × 10点）
- [ ] 実装評価スコア（8AI × 60点）
- [ ] 総合評価スコア（8AI × 75点）
- [ ] 比較レポート作成

---

## 🎯 次のステップ

### 実験実施後

1. **結果の分析**
   - 実験1と実験2の比較
   - 各AIの特性の明確化
   - バイアスの影響評価

2. **レポート作成**
   - `EXPERIMENT_2_RESULTS.md`
   - `EXPERIMENT_1_VS_2_COMPARISON.md`
   - `FINAL_AI_RANKING.md`（真の総合力）

3. **論文化（オプション）**
   - 実験設計の妥当性
   - バイアスの影響
   - AI開発手法の比較

---

## 📚 関連ドキュメント

- `EXPERIMENTAL_DESIGN_ANALYSIS.md` - 実験1の問題点分析
- `PLAN_EVALUATION_CRITERIA.md` - 計画評価の詳細基準
- `prompt.txt` - 共通の要件定義
- `../README.md` - プロジェクト全体の説明

---

**実験成功を祈ります！** 🎉

このガイドに従えば、各AIの真の総合力を公平に評価できます。

**作成者**: Claude 4
**最終更新**: 2025-10-27
**バージョン**: 2.0
**ステータス**: ✅ Ready for Experiment
