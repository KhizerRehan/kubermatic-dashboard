 The whole idea is that we want to update we need to update '/Users/mac/Work/Github/kubermatic/dashboard.worktree/wt-ui-codemapping/modules/web/CLAUDE.md'
  simialr to '/Users/mac/Work/Github/kubermatic/dashboard.worktree/wt-ui-codemapping/modules/api/CLAUDE.md' wheere we are using progressive disclosure        
  pattern '/Users/mac/Work/Github/kubermatic/dashboard.worktree/wt-ui-codemapping/ai/plans/api-claude-md-restructure.plan.md' see this plan                   
                                                                                                                                                              
  - We need to handle best practices of claude with minimum token utilisation and explore sub docs when requried by agent
  - need to get reference of code as best practices to update the CLAUDE.md for web module
  - we need to reference different sections that can be useful to provide agent more context when building up
   - new feature
   - review any existing pr
   - refactor any existing code
   - reviewing external contribution


e.g Take this PR as reference ONLY for reference: https://github.com/kubermatic/dashboard/pull/7972

- External Review
 - Didn't followed the best practices of claude and we can ask agent to review the code and provide feedback on the code quality, adherence to coding standards, and overall design of the contribution.

 - Suggest what is the best way either Skill or Update context files similar like we have done for in modules/api/CLAUDE.md

 Which uses Progressive Disclosure pattern and we can provide reference of code when required by agent to follow those best practices.

e.g 
- Validators were defined inline component e.g we do have `modules/web/src/app/shared/validators`
- Regex were defined inline component e.g we do have `shared/validators/others.ts`


functions like e.g web/src/app/shared/entity/health.ts

- The purpose was resuaabilty instead of defining the same function in multiple places we can define it in one place and use it across the codebase but we DO have `modules/web/src/app/shared/utils` 

so only Document what is best Practices and how to use the existing codebase to follow those best practices and also we can provide reference of code when required by agent to follow those best practices.

```ts
export namespace HealthState {
  export function isUp(state: HealthState): boolean {
    return HealthState.Up === state;
  }

  export function isDown(state: HealthState): boolean {
    return HealthState.Down === state;
  }

  export function isProvisioning(state: HealthState): boolean {
    return HealthState.Provisioning === state;
  }
}
```


Ultrathink and Figure out WHATEVER best practices we can document in the CLAUDE.md for web module and also how to use the existing codebase to follow those best practices and also we can provide reference of code when required by agent to follow those best practices.

- Check for web/ folder 
- Take Reference how small files have been created `modules/api/agent_docs` which are later referenced in CLAUDE.md for API module and we can do the same for web module as well


IMPORTANT: We need to make sure that we are not populating the CLAUDE.md with too much information but rather providing references to the existing codebase and best practices. The idea is to guide the agent towards the right resources and patterns without overwhelming them with information.

USE the following resources for reference:

## Best Practices Resources

- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://code.claude.com/docs/en/memory
- https://docs.claude-mem.ai/progressive-disclosure



## Acceptance Criteria

- We nedd to CodeMapping for web folder 
- Make sure we have good contexta not only for agent but also for human to understand the best practices and how to use the existing codebase to follow those best practices.
- Don't forget to use the progressive disclosure pattern and provide references to the existing codebase when required by agent to follow those best practices.
- Don't add so much context that alot of tokens are consumed but rather provide references to the existing codebase and best practices to guide the agent towards the right resources and patterns without overwhelming them with information.