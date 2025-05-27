# Setting Up Notion as a CMS for Your Astro Blog

This guide will walk you through the process of integrating Notion with your Astro blog, allowing you to use Notion as your content management system.

## 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and log in with your Notion account.
2. Click on "+ New integration".
3. Name your integration (e.g., "My Astro Blog") and select the workspace where you'll create your content.
4. Click "Submit" to create the integration.
5. On the next page, you'll see your "Internal Integration Token". Copy this token - it's your `NOTION_API_KEY`.

## 2. Create a Notion Database for Your Blog

1. In Notion, create a new page and add a new database (full page or inline).
2. Your database should have the following properties:
   - Title (title): For your blog post titles
   - Status (select): Options should include "Draft", "In Review", and "Published"
   - Category (select): Categories for your posts (Health, Technology, etc.)
   - Published Date (date): Publication date
   - Author (text): The author of the post
   - Tags (multi-select): Tags for your posts (Health, Lifestyle, Food, etc.)
   - Description (text): Short description or excerpt

## 3. Share Your Database with Your Integration

1. Open your database in Notion.
2. Click on the "..." menu in the top-right corner and select "Add connections".
3. Find your integration in the list and click to add it.
4. The integration now has access to read your database.

## 4. Get Your Database ID

1. Open your database in Notion in a web browser.
2. Look at the URL, which should look something like: `https://notion.so/workspace/1234567890abcdef1234567890abcdef`
3. The 32-character string (after your workspace name and before any query parameters) is your `NOTION_DATABASE_ID`.

## 5. Set Up Environment Variables

Create a `.env` file in the root of your project with the following content:

```
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
```

## 6. Writing Content in Notion

1. Add new entries to your Notion database with the required properties.
2. Set the Status to "Published" when the post is ready to appear on your site.
3. Fill in all fields like Category, Tags, Published Date, Author, and Description.
4. The body content of the Notion page will be used as the blog post content.

## 7. Deploying Your Site

When deploying your site to a hosting platform (like Vercel, Netlify, etc.), make sure to add the environment variables there as well.

## 8. Updating Your Blog

After making changes in Notion, you need to trigger a rebuild of your site for the changes to appear. Most hosting platforms allow you to set up webhooks for this purpose.

## 9. Troubleshooting

- Make sure your integration has access to your database.
- Check that your database has all the required properties with the correct types.
- Verify that your environment variables are correctly set.
- Remember that your site needs to be rebuilt after making changes in Notion.

---

This setup allows you to manage your blog content entirely in Notion, while still leveraging the performance benefits of Astro's static site generation. 