## Development Workflow (Trunk-Based)

Since we are a small team with tight deadlines, we will be following the trunk-based development practice.  
This means everyone will be working directly with the `main` branch with a few rules to keep things stable.

## Rules
1. Commit small & often 
   - Do NOT sit on code for days. Push small updates frequently as much as possible.

2. Keep `main` working 
   - Never push broken code that crashes the app.  
   - If a feature IS NOT ready, wrap it in a feature flag or comment it out.

3. ALWAYS Pull BEFORE and AFTER you code
   - Avoids conflicts with your local copies

4. Communicate with the team
   - Announce in the group chat what you will be pushing (feature, fix, etc.) so no one overwrites each other.

5. Feature flags for unfinished work
   - Use simple flags (e.g. `if (FEATURE_FLAG)`) to hide incomplete features.  
   - This keeps `main` demo-ready.

6. Temporary branches (if needed)
   - If you are working on a BIG feature/s, make a short-lived branch.  
   - Merge it back to `main` WHEN it is working.

