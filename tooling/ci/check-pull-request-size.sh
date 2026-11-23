#!/usr/bin/env bash
set -euo pipefail

base=$1
head=$2

is_phase_pull_request() {
  if [[ -n ${PR_HEAD_REPO:-} ]]; then
    [[ "$PR_HEAD_REPO" == "$GITHUB_REPOSITORY" && "$GITHUB_BASE_REF" == main && "$GITHUB_HEAD_REF" =~ ^phase/[0-9]+$ ]]
    return
  fi

  local base_ref head_ref
  base_ref=$(git rev-parse --symbolic-full-name --verify "$base")
  head_ref=$(git rev-parse --symbolic-full-name --verify "$head")
  [[ "$base_ref" =~ ^refs/(heads|remotes/origin)/main$ && "$head_ref" =~ ^refs/(heads|remotes/origin)/phase/[0-9]+$ ]]
}

if is_phase_pull_request; then
  echo "フェーズ全体を main に入れる PR は行数制限の対象外です。"
  exit 0
fi

counted_from=("$base...$head")
main_in_head=$(git merge-base "$head" refs/remotes/origin/main 2>/dev/null || true)
if [[ -n $main_in_head ]] && ! git merge-base --is-ancestor "$main_in_head" "$base"; then
  fork_point=$(git merge-base "$base" "$head")
  merged=$(git merge-tree --write-tree "$fork_point" "$main_in_head" || true)
  if [[ -n $merged ]]; then
    counted_from=("${merged%%$'\n'*}" "$head")
    echo "main から取り込んだ分は数えません。"
  fi
fi

added=$(git diff --numstat --find-renames "${counted_from[@]}" -- ':/' \
  ':(top,exclude)bun.lock' ':(top,exclude)apps/server/src/db/migrations' |
  awk '{ total += $1 } END { print total + 0 }')
echo "追加 ${added} 行（目安500行・上限800行）"
if (( added > 800 )); then
  echo "${GITHUB_ACTIONS:+::error::}800行以下になるように PR を分けてください。" >&2
  exit 1
elif (( added > 500 )); then
  echo "${GITHUB_ACTIONS:+::notice::}目安の500行を超えています。"
fi
