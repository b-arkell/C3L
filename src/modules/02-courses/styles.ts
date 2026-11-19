// styles.ts
// All the CSS for module 2 lives here as one big string.
// The layout function in views.ts drops this into a <style> tag on every page,
// so I don't have to keep importing a .css file or mess with static routes.

export const CSS = `
  body {
    font-family: system-ui, Arial, sans-serif;
    margin: 40px;
    max-width: 800px;
    color: #222;
  }

  /* small breadcrumb link at the top of every page */
  .crumbs {
    margin-bottom: 1rem;
  }

  /* row of action buttons on the dashboard */
  .actions {
    display: flex;
    gap: .5rem;
  }

  .btn {
    display: inline-block;
    padding: .4rem .8rem;
    background: #2563eb;
    color: #fff;
    text-decoration: none;
    border-radius: 4px;
  }

  /* each course on the dashboard is wrapped in this */
  .card {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
  }

  /* basic form styling. nothing fancy, just enough so it doesn't look broken */
  form label {
    display: block;
    margin-bottom: 12px;
  }
  form input,
  form textarea,
  form select {
    width: 100%;
    padding: 6px;
    box-sizing: border-box;
  }

  /* the instructor picker sits under the edit form, so give it some room */
  .assign-form {
    margin-top: 8px;
  }
  form button {
    padding: .5rem 1rem;
  }

  /* archived course styling - dimmed with a small badge */
  .card.archived {
    opacity: 0.6;
    border-style: dashed;
  }
  .badge {
    background: #666;
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 3px;
    vertical-align: middle;
    margin-left: 6px;
  }
  /* form that only holds a button should sit inline, not block */
  .inline-form {
    display: inline;
    margin: 0;
  }
  .inline-form button {
    padding: 2px 8px;
    font-size: 0.85rem;
  }
`