/**
 * [INPUT]: 依赖 ./space-types 的 Space/SpaceMemberId，./project-types 的 ProjectHostSetup，./repo-types 的 Repo
 * [OUTPUT]: 对外提供 toSpaceMemberId、buildSetupByRepoId、resolveSpaceRepoIds
 * [POS]: Space 成员身份的唯一降级点；project:/repo: 分支只存在于 toSpaceMemberId
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ProjectHostSetup } from './project-types'
import type { Repo } from './repo-types'
import type { Space, SpaceMemberId } from './space-types'

export function buildSetupByRepoId(
  setups: readonly ProjectHostSetup[]
): ReadonlyMap<string, ProjectHostSetup> {
  return new Map(setups.map((setup) => [setup.repoId, setup]))
}

// Why: mirrors getProjectGroupingForRepo's lane identity but ignores its
// `::setup:` split — that is render-time disambiguation, not identity.
export function toSpaceMemberId(
  repoId: string,
  setupByRepoId: ReadonlyMap<string, ProjectHostSetup>
): SpaceMemberId {
  const projectId = setupByRepoId.get(repoId)?.projectId
  return projectId ? `project:${projectId}` : `repo:${repoId}`
}

export function resolveSpaceRepoIds(
  space: Pick<Space, 'memberIds'>,
  repos: readonly Pick<Repo, 'id'>[],
  setupByRepoId: ReadonlyMap<string, ProjectHostSetup>
): ReadonlySet<string> {
  const members = new Set<string>(space.memberIds)
  const repoIds = new Set<string>()
  for (const repo of repos) {
    if (members.has(toSpaceMemberId(repo.id, setupByRepoId))) {
      repoIds.add(repo.id)
    }
  }
  return repoIds
}
