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
  form textarea {
    width: 100%;
    padding: 6px;
    box-sizing: border-box;
  }
  form button {
    padding: .5rem 1rem;
  }
`