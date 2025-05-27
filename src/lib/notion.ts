import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Define type for blog posts
export interface NotionBlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: Date;
  lastEdited: Date;
  author: string;
  category: string;
  tags: string[];
  content: string;
}

// Initialize Notion client
const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Helper to safely get property values from Notion results
function getProperty(page: any, propertyName: string) {
  // Try to find the property by name in a case-insensitive way
  const exactMatch = page.properties?.[propertyName];
  if (exactMatch) return exactMatch;
  
  // Try case-insensitive match if properties exist
  if (!page.properties) return null;
  
  const lowerPropertyName = propertyName.toLowerCase();
  const key = Object.keys(page.properties).find(
    k => k.toLowerCase() === lowerPropertyName
  );
  
  return key ? page.properties[key] : null;
}

// Helper to safely extract text from rich_text property
function getRichText(property: any): string {
  if (!property) return '';
  if (!property.rich_text || !Array.isArray(property.rich_text)) return '';
  if (property.rich_text.length === 0) return '';
  return property.rich_text[0]?.plain_text || '';
}

// Helper to safely extract title text
function getTitleText(property: any): string {
  if (!property) return 'Untitled';
  if (!property.title || !Array.isArray(property.title)) return 'Untitled';
  if (property.title.length === 0) return 'Untitled';
  return property.title[0]?.plain_text || 'Untitled';
}

// Helper to get status value regardless of property type
function getStatusValue(property: any): string {
  if (!property) return '';
  
  // Try different property types
  if (property.status?.name) return property.status.name;
  if (property.select?.name) return property.select.name;
  if (property.rich_text?.length > 0) return property.rich_text[0].plain_text;
  if (property.checkbox === true) return 'Published';
  if (property.checkbox === false) return 'Draft';
  if (typeof property.formula?.string === 'string') return property.formula.string;
  
  // Try to convert to string if it's a simple value
  if (typeof property === 'string') return property;
  if (typeof property === 'object' && property !== null) {
    const stringValue = Object.values(property).find(val => typeof val === 'string');
    if (stringValue) return stringValue as string;
  }
  
  return '';
}

// Check if a post should be considered published
function isPublished(page: any): boolean {
  // Check Status property
  const statusProp = getProperty(page, 'Status');
  const statusValue = getStatusValue(statusProp);
  
  if (statusValue.toLowerCase() === 'published') return true;
  
  // Also check for a 'Published' property
  const publishedProp = getProperty(page, 'Published');
  if (publishedProp?.checkbox === true) return true;
  
  return false;
}

// Safely convert Notion page to markdown
async function pageToMarkdown(pageId: string): Promise<string> {
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    if (!mdBlocks || mdBlocks.length === 0) {
      console.log(`No markdown blocks generated for page ${pageId}`);
      return '';
    }
    
    const mdString = n2m.toMarkdownString(mdBlocks);
    return mdString.parent || '';
  } catch (error) {
    console.error(`Error converting page ${pageId} to markdown:`, error);
    return ''; // Return empty string instead of failing
  }
}

// Get database properties to understand structure
async function getDBProperties() {
  try {
    const response = await notion.databases.retrieve({
      database_id: import.meta.env.NOTION_DATABASE_ID,
    });
    console.log('Database properties:', JSON.stringify(response.properties, null, 2));
    return response.properties;
  } catch (error) {
    console.error('Error fetching database properties:', error);
    return null;
  }
}

// Get all blog posts from Notion
export async function getAllBlogPosts(): Promise<NotionBlogPost[]> {
  try {
    // Get database properties first to understand structure
    await getDBProperties();
    
    // Query the database - try without filter first
    const response = await notion.databases.query({
      database_id: import.meta.env.NOTION_DATABASE_ID,
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
    });

    console.log(`Found ${response.results.length} pages in the database`);

    // Log the first result to see its structure
    if (response.results.length > 0) {
      const firstPage = response.results[0] as any;
      if (firstPage.properties) {
        console.log('First page properties:', 
          JSON.stringify(firstPage.properties, null, 2));
      }
    }

    // Map the response to our NotionBlogPost type
    const posts = await Promise.all(
      response.results.map(async (page: any) => {
        try {
          const pageId = page.id;
          console.log(`Processing page: ${pageId}`);
          
          // Skip non-published posts
          if (!isPublished(page)) {
            console.log(`Skipping non-published page: ${pageId}`);
            return null;
          }
          
          // Get title property
          const titleProp = getProperty(page, 'Title') || getProperty(page, 'title');
          const title = getTitleText(titleProp);
          const slug = createSlug(title);
          console.log(`Title: ${title}, Slug: ${slug}`);
          
          // Get description
          const descProp = getProperty(page, 'description') || getProperty(page, 'Description');
          const description = getRichText(descProp);
          
          // Get date
          const dateProp = getProperty(page, 'Published Date') || 
                           getProperty(page, 'published date') || 
                           getProperty(page, 'Date');
          const date = new Date(dateProp?.date?.start || page.created_time);
          
          // Get author
          const authorProp = getProperty(page, 'Author') || getProperty(page, 'author');
          const author = getRichText(authorProp);
          
          // Get category
          const categoryProp = getProperty(page, 'Category') || getProperty(page, 'category');
          const category = categoryProp?.select?.name || '';
          
          // Get tags
          const tagsProp = getProperty(page, 'Tags') || getProperty(page, 'tags');
          const tags = tagsProp?.multi_select?.map((tag: any) => tag.name) || [];
          
          // Get the markdown content for the page
          const content = await pageToMarkdown(pageId);
          
          return {
            id: pageId,
            title,
            slug,
            description,
            date,
            lastEdited: new Date(page.last_edited_time),
            author,
            category,
            tags,
            content,
          };
        } catch (error) {
          console.error('Error processing page:', error, page?.id);
          return null;
        }
      })
    );

    // Filter out null entries (non-published posts)
    const validPosts = posts.filter(post => post !== null) as NotionBlogPost[];
    console.log(`Returning ${validPosts.length} published posts`);
    return validPosts;
  } catch (error) {
    console.error('Error fetching blog posts from Notion:', error);
    return [];
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<NotionBlogPost | null> {
  try {
    const posts = await getAllBlogPosts();
    return posts.find((post) => post.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

// Helper function to create a slug from a title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim(); // Remove whitespace from start and end
} 