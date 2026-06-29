# Quiz content

The quiz catalog lives here as one JSON file per quiz in [`quizzes/`](quizzes/).
These files are the **source of truth** for catalog content; the database is loaded
from them.

## File format

```jsonc
{
  "slug": "grand-canyon",        // unique; the URL is /quiz/<slug>
  "title": "Grand Canyon Trivia",
  "difficulty": "easy",
  "questions": [                  // exactly 20
    {
      "id": "gc-1",              // unique within the quiz
      "prompt": "…?",
      "options": ["…", "…", "…", "…"],   // exactly 4
      "correct_index": 1          // integer 0–3
    }
  ]
}
```

## Workflow

```bash
# 1. Validate everything (no DB needed)
node scripts/load-quizzes.mjs --dry-run

# 2. (optional) Redistribute answer positions so the correct option isn't
#    always in the same slot. Deterministic + idempotent.
node scripts/shuffle-options.mjs

# 3. Load into Supabase (upsert by slug). Needs SUPABASE_SERVICE_ROLE_KEY.
node --env-file=.env.local scripts/load-quizzes.mjs
```

The loader upserts by `slug`, so re-running updates existing quizzes in place and
adds new ones — safe to run repeatedly as the catalog grows toward all 63 parks.
