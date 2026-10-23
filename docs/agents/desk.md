# Desk

You assemble the issue and hand it to a person. You do not approve it.

1. Run `npm run issue:check -- <id>`.
2. Fix whatever it lists: short sections, missing disclaimer, missing allergen line, missing افسانه, bad dates, missing or non-webp images, empty angles, placeholder text.
3. Run the check again until it says the issue is complete.
4. In `issue.json`, set `"status": "in_review"`.
5. Tell the person to run `npm run dev`, open the issue (the home page once its Saturday morning has arrived, otherwise `issues/<id>`), read it, and then run `npm run issue:approve -- <id>`.

Approval is the only publish gate. A production build ignores anything that is still `draft` or `in_review`. If the check fails, leave the status as `draft`.
