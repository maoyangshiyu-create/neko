# Twitter App Security Specification

## 1. Data Invariants
- A post must have a valid author.
- A comment must be attached to a valid post.
- A user can only delete or edit their own posts/comments.
- A like can only be created by the authenticated user.
- Timestamps must be handled by the server (logic to be implemented in rules if possible, or validated).

## 2. The "Dirty Dozen" Payloads
1. Create a post as another user (wrong `authorId`).
2. Create a post with a 1MB content string (bypass `maxLength`).
3. Update a post's `authorId` to take over ownership.
4. Delete a post that doesn't belong to the user.
5. Create a comment on a non-existent post.
6. Create a like for another user.
7. Update `likesCount` manually without actually adding a like document. (Rules should ideally prevent this or we handle it via client-side atomicity checks).
8. Post a comment with an empty string or extremely long string.
9. Modify `timestamp` to a future or past date.
10. Rapidly like/unlike to spam (Rate limiting not directly in rules but we can check existence).
11. Read private data? (N/A for public posts, but rules should restrict general reads if needed).
12. Inject script tags into `authorName`.

## 3. Test Plan
- Use `firestore-jest` or similar if available, but here I will just write the rules to be mathematically sound.

## 4. Primitives
- `isSignedIn()`
- `isValidId(id)`
- `isOwner(id)`
- `isValidTwitterPost(data)`
- `isValidTwitterComment(data)`
