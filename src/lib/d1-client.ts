// Cloudflare D1 Database Client for API Routes
// This connects to the remote D1 database via HTTP API
// Updated: Environment variables should be loaded from Vercel

import { Project } from './db';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '4e369248fbb93ecfab45e53137a9980d';
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || '908f42f0-ad4d-4ce0-b3a2-9bb13cf54795';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'NXu3f4s9376pvFJFSUhE8AZ2UtcyFpcEYVZG2NmF';

// Log environment variable status (only first 10 chars of sensitive data for security)
console.log('🔧 D1 Client Configuration:', {
  accountId: CLOUDFLARE_ACCOUNT_ID ? `${CLOUDFLARE_ACCOUNT_ID.substring(0, 10)}...` : '❌ NOT SET',
  databaseId: CLOUDFLARE_DATABASE_ID ? `${CLOUDFLARE_DATABASE_ID.substring(0, 10)}...` : '❌ NOT SET',
  apiToken: CLOUDFLARE_API_TOKEN ? `${CLOUDFLARE_API_TOKEN.substring(0, 10)}...` : '❌ NOT SET',
  allVariablesSet: !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && CLOUDFLARE_DATABASE_ID),
  usingFallback: !process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN
});

// D1 HTTP API client
export async function queryD1(sql: string, params: any[] = []): Promise<any> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('❌ Cloudflare credentials missing:', {
      accountId: !!CLOUDFLARE_ACCOUNT_ID,
      apiToken: !!CLOUDFLARE_API_TOKEN,
      databaseId: !!CLOUDFLARE_DATABASE_ID
    });
    throw new Error('Cloudflare credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.local');
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params
        }),
        cache: 'no-store' // Disable caching
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D1 API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.result[0];
    } else {
      throw new Error(data.errors?.[0]?.message || 'Query failed');
    }
  } catch (error) {
    console.error('D1 HTTP API Error:', error);
    throw error;
  }
}

// Helper functions for common operations
export async function getAllProjects(): Promise<Project[]> {
  try {
    const result = await queryD1(
      'SELECT * FROM projects ORDER BY order_index ASC, created_at DESC'
    );
    

    // console.log({result});
    if (result && result.results) {
      return result.results.map((row: any) => ({
        ...row,
        credits: row.credits ? JSON.parse(row.credits) : [],
        chapters: row.chapters ? JSON.parse(row.chapters) : null,
        is_featured: Boolean(row.is_featured),
        is_published: Boolean(row.is_published)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const result = await queryD1(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    
    if (result && result.results && result.results.length > 0) {
      const row = result.results[0];
      return {
        ...row,
        credits: row.credits ? JSON.parse(row.credits) : [],
        chapters: row.chapters ? JSON.parse(row.chapters) : null,
        is_featured: Boolean(row.is_featured),
        is_published: Boolean(row.is_published)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  const id = crypto.randomUUID();
  const creditsJson = JSON.stringify(project.credits || []);
  const chaptersJson = project.chapters ? JSON.stringify(project.chapters) : null;
  
  try {
    await queryD1(
      `INSERT INTO projects (
        id, title, client, client_short, category, data_cat, languages, classification,
        vimeo_id, video_url, video_url_arabic, video_url_full_arabic, video_thumbnail_url_arabic,
        poster_image, poster_image_srcset, credits, chapters,
        order_index, is_featured, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        project.title,
        project.client,
        project.client_short || null,
        project.category,
        project.data_cat,
        project.languages,
        project.classification,
        project.vimeo_id,
        project.video_url,
        project.video_url_arabic || null,
        project.video_url_full_arabic || null,
        project.video_thumbnail_url_arabic || null,
        project.poster_image,
        project.poster_image_srcset,
        creditsJson,
        chaptersJson,
        project.order_index,
        project.is_featured ? 1 : 0,
        project.is_published ? 1 : 0
      ]
    );
    
    return {
      ...project,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    // First check if project exists
    const existing = await getProjectById(id);
    if (!existing) {
      return null;
    }

    // Build dynamic UPDATE query with only provided fields
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.client !== undefined) {
      fields.push('client = ?');
      values.push(updates.client);
    }
    if (updates.client_short !== undefined) {
      fields.push('client_short = ?');
      values.push(updates.client_short);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.data_cat !== undefined) {
      fields.push('data_cat = ?');
      values.push(updates.data_cat);
    }
    if (updates.languages !== undefined) {
      fields.push('languages = ?');
      values.push(updates.languages);
    }
    if (updates.classification !== undefined) {
      fields.push('classification = ?');
      values.push(updates.classification);
    }
    if (updates.vimeo_id !== undefined) {
      fields.push('vimeo_id = ?');
      values.push(updates.vimeo_id);
    }
    if (updates.video_url !== undefined) {
      fields.push('video_url = ?');
      values.push(updates.video_url);
    }
    if (updates.video_thumbnail_url !== undefined) {
      fields.push('video_thumbnail_url = ?');
      values.push(updates.video_thumbnail_url);
    }
    if (updates.video_url_arabic !== undefined) {
      fields.push('video_url_arabic = ?');
      values.push(updates.video_url_arabic);
    }
    if (updates.video_url_full_arabic !== undefined) {
      fields.push('video_url_full_arabic = ?');
      values.push(updates.video_url_full_arabic);
    }
    if (updates.video_thumbnail_url_arabic !== undefined) {
      fields.push('video_thumbnail_url_arabic = ?');
      values.push(updates.video_thumbnail_url_arabic);
    }
    if (updates.poster_image !== undefined) {
      fields.push('poster_image = ?');
      values.push(updates.poster_image);
    }
    if (updates.poster_image_srcset !== undefined) {
      fields.push('poster_image_srcset = ?');
      values.push(updates.poster_image_srcset);
    }
    if (updates.credits !== undefined) {
      fields.push('credits = ?');
      values.push(JSON.stringify(updates.credits));
    }
    if (updates.chapters !== undefined) {
      fields.push('chapters = ?');
      values.push(updates.chapters ? JSON.stringify(updates.chapters) : null);
    }
    if (updates.order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(updates.order_index);
    }
    if (updates.is_featured !== undefined) {
      fields.push('is_featured = ?');
      values.push(updates.is_featured ? 1 : 0);
    }
    if (updates.is_published !== undefined) {
      fields.push('is_published = ?');
      values.push(updates.is_published ? 1 : 0);
    }

    // Always update the timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');

    // Add the ID for WHERE clause
    values.push(id);

    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
    
    await queryD1(sql, values);
    
    return await getProjectById(id);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await queryD1('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export async function batchUpdateProjectOrder(updates: Array<{ projectId: string; orderIndex: number }>): Promise<Project[]> {
  try {
    // First, validate all project IDs exist
    const projectIds = updates.map(u => u.projectId);
    const placeholders = projectIds.map(() => '?').join(',');
    const existingResult = await queryD1(
      `SELECT id FROM projects WHERE id IN (${placeholders})`,
      projectIds
    );
    
    const existingIds = new Set(existingResult.results.map((row: any) => row.id));
    const missingIds = projectIds.filter(id => !existingIds.has(id));
    
    if (missingIds.length > 0) {
      throw new Error(`Projects not found: ${missingIds.join(', ')}`);
    }

    // Perform batch update using individual UPDATE statements
    // D1 doesn't support multi-statement transactions via HTTP API, but we can execute them sequentially
    for (const update of updates) {
      await queryD1(
        'UPDATE projects SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [update.orderIndex, update.projectId]
      );
    }

    // Return updated projects
    const updatedResult = await queryD1(
      `SELECT * FROM projects WHERE id IN (${placeholders}) ORDER BY order_index ASC`,
      projectIds
    );

    if (updatedResult && updatedResult.results) {
      return updatedResult.results.map((row: any) => ({
        ...row,
        credits: row.credits ? JSON.parse(row.credits) : [],
        chapters: row.chapters ? JSON.parse(row.chapters) : null,
        is_featured: Boolean(row.is_featured),
        is_published: Boolean(row.is_published)
      }));
    }

    return [];
  } catch (error) {
    console.error('Error batch updating project order:', error);
    throw error;
  }
}

// Film Preset Types
export interface FilmPreset {
  id: string;
  name: string;
  description?: string;
  order_config: Array<{ projectId: string; orderIndex: number }>;
  created_at: string;
  updated_at: string;
}

// Film Preset Functions
export async function createFilmPreset(
  name: string,
  description: string | undefined,
  orderConfig: Array<{ projectId: string; orderIndex: number }>
): Promise<FilmPreset> {
  const id = crypto.randomUUID();
  const orderConfigJson = JSON.stringify(orderConfig);
  
  try {
    await queryD1(
      `INSERT INTO film_presets (id, name, description, order_config) VALUES (?, ?, ?, ?)`,
      [id, name, description || null, orderConfigJson]
    );
    
    return {
      id,
      name,
      description,
      order_config: orderConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating film preset:', error);
    throw error;
  }
}

export async function getAllFilmPresets(): Promise<FilmPreset[]> {
  try {
    const result = await queryD1(
      'SELECT * FROM film_presets ORDER BY created_at DESC'
    );
    
    if (result && result.results) {
      return result.results.map((row: any) => ({
        ...row,
        order_config: row.order_config ? JSON.parse(row.order_config) : []
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching film presets:', error);
    return [];
  }
}

export async function getFilmPresetById(id: string): Promise<FilmPreset | null> {
  try {
    const result = await queryD1(
      'SELECT * FROM film_presets WHERE id = ?',
      [id]
    );
    
    if (result && result.results && result.results.length > 0) {
      const row = result.results[0];
      return {
        ...row,
        order_config: row.order_config ? JSON.parse(row.order_config) : []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching film preset:', error);
    return null;
  }
}

export async function deleteFilmPreset(id: string): Promise<boolean> {
  try {
    await queryD1('DELETE FROM film_presets WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting film preset:', error);
    return false;
  }
}