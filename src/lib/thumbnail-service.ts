// Thumbnail Persistence Service
// Provides database operations for thumbnail management
// Requirements: 1.4, 3.2, 3.3, 1.6

import { queryD1 } from './d1-client';

/**
 * Thumbnail Option Interface
 * Represents a thumbnail option stored in the database
 */
export interface ThumbnailOption {
  id: string;
  project_id: string;
  thumbnail_url: string;
  thumbnail_type: 'custom' | 'video_frame';
  timestamp?: number; // for video frames (in seconds)
  is_active: boolean;
  created_at: string;
}

/**
 * Thumbnail Metadata Interface
 * Represents metadata stored in the projects table
 */
export interface ThumbnailMetadata {
  width?: number;
  height?: number;
  size?: number;
  formats?: string[]; // ['webp', 'jpg']
  variants?: {
    small?: {
      [format: string]: string | number | undefined; // URL for each format, plus width/height
    };
    medium?: {
      [format: string]: string | number | undefined;
    };
    large?: {
      [format: string]: string | number | undefined;
    };
  };
}

/**
 * Thumbnail Data Interface
 * Data required to save a new thumbnail
 */
export interface ThumbnailData {
  thumbnail_url: string;
  thumbnail_type: 'custom' | 'video_frame';
  timestamp?: number;
  metadata?: ThumbnailMetadata;
}

/**
 * Save thumbnail metadata to the database
 * Creates a new thumbnail option and optionally updates the project's active thumbnail
 * 
 * @param projectId - The project ID to associate the thumbnail with
 * @param thumbnailData - The thumbnail data to save
 * @param setAsActive - Whether to set this thumbnail as the active one (default: true)
 * @returns The created thumbnail option
 * 
 * Requirements: 1.4 - Save thumbnail URL to Projects_Table
 */
export async function saveThumbnailMetadata(
  projectId: string,
  thumbnailData: ThumbnailData,
  setAsActive: boolean = true
): Promise<ThumbnailOption> {
  const thumbnailId = crypto.randomUUID();
  
  try {
    // Insert into thumbnail_options table
    await queryD1(
      `INSERT INTO thumbnail_options (
        id, project_id, thumbnail_url, thumbnail_type, timestamp, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        thumbnailId,
        projectId,
        thumbnailData.thumbnail_url,
        thumbnailData.thumbnail_type,
        thumbnailData.timestamp || null,
        setAsActive ? 1 : 0
      ]
    );

    // If setting as active, update the projects table and deactivate other thumbnails
    if (setAsActive) {
      // Deactivate all other thumbnails for this project
      await queryD1(
        `UPDATE thumbnail_options SET is_active = 0 
         WHERE project_id = ? AND id != ?`,
        [projectId, thumbnailId]
      );

      // Update the project's thumbnail fields AND poster_image
      const metadataJson = thumbnailData.metadata 
        ? JSON.stringify(thumbnailData.metadata) 
        : null;

      await queryD1(
        `UPDATE projects SET 
          thumbnail_url = ?,
          thumbnail_type = ?,
          thumbnail_timestamp = ?,
          thumbnail_metadata = ?,
          poster_image = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          thumbnailData.thumbnail_url,
          thumbnailData.thumbnail_type,
          thumbnailData.timestamp || null,
          metadataJson,
          thumbnailData.thumbnail_url, // Also update poster_image
          projectId
        ]
      );
    }

    // Return the created thumbnail option
    const result = await queryD1(
      'SELECT * FROM thumbnail_options WHERE id = ?',
      [thumbnailId]
    );

    if (result && result.results && result.results.length > 0) {
      const row = result.results[0];
      return {
        id: row.id,
        project_id: row.project_id,
        thumbnail_url: row.thumbnail_url,
        thumbnail_type: row.thumbnail_type,
        timestamp: row.timestamp,
        is_active: Boolean(row.is_active),
        created_at: row.created_at
      };
    }

    throw new Error('Failed to retrieve created thumbnail option');
  } catch (error) {
    console.error('Error saving thumbnail metadata:', error);
    throw error;
  }
}

/**
 * Get all thumbnail options for a project
 * 
 * @param projectId - The project ID to get thumbnails for
 * @returns Array of thumbnail options
 * 
 * Requirements: 3.2 - Show all available thumbnail options
 */
export async function getThumbnailOptions(projectId: string): Promise<ThumbnailOption[]> {
  try {
    const result = await queryD1(
      `SELECT * FROM thumbnail_options 
       WHERE project_id = ? 
       ORDER BY is_active DESC, created_at DESC`,
      [projectId]
    );

    if (result && result.results) {
      return result.results.map((row: any) => ({
        id: row.id,
        project_id: row.project_id,
        thumbnail_url: row.thumbnail_url,
        thumbnail_type: row.thumbnail_type,
        timestamp: row.timestamp,
        is_active: Boolean(row.is_active),
        created_at: row.created_at
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching thumbnail options:', error);
    return [];
  }
}

/**
 * Set a thumbnail as the active thumbnail for a project
 * Deactivates all other thumbnails and updates the project's thumbnail fields
 * 
 * @param thumbnailId - The thumbnail ID to activate
 * @returns The updated thumbnail option
 * 
 * Requirements: 3.3 - Mark selected thumbnail as active
 */
export async function setActiveThumbnail(thumbnailId: string): Promise<ThumbnailOption | null> {
  try {
    // First, get the thumbnail to activate
    const thumbnailResult = await queryD1(
      'SELECT * FROM thumbnail_options WHERE id = ?',
      [thumbnailId]
    );

    if (!thumbnailResult || !thumbnailResult.results || thumbnailResult.results.length === 0) {
      throw new Error('Thumbnail not found');
    }

    const thumbnail = thumbnailResult.results[0];
    const projectId = thumbnail.project_id;

    // Deactivate all thumbnails for this project
    await queryD1(
      'UPDATE thumbnail_options SET is_active = 0 WHERE project_id = ?',
      [projectId]
    );

    // Activate the selected thumbnail
    await queryD1(
      'UPDATE thumbnail_options SET is_active = 1 WHERE id = ?',
      [thumbnailId]
    );

    // Update the project's thumbnail fields AND poster_image
    await queryD1(
      `UPDATE projects SET 
        thumbnail_url = ?,
        thumbnail_type = ?,
        thumbnail_timestamp = ?,
        poster_image = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        thumbnail.thumbnail_url,
        thumbnail.thumbnail_type,
        thumbnail.timestamp || null,
        thumbnail.thumbnail_url, // Also update poster_image
        projectId
      ]
    );

    // Return the updated thumbnail option
    const updatedResult = await queryD1(
      'SELECT * FROM thumbnail_options WHERE id = ?',
      [thumbnailId]
    );

    if (updatedResult && updatedResult.results && updatedResult.results.length > 0) {
      const row = updatedResult.results[0];
      return {
        id: row.id,
        project_id: row.project_id,
        thumbnail_url: row.thumbnail_url,
        thumbnail_type: row.thumbnail_type,
        timestamp: row.timestamp,
        is_active: Boolean(row.is_active),
        created_at: row.created_at
      };
    }

    return null;
  } catch (error) {
    console.error('Error setting active thumbnail:', error);
    throw error;
  }
}

/**
 * Delete a thumbnail option
 * Removes the thumbnail from the database and optionally from R2 storage
 * If the deleted thumbnail was active, clears the project's thumbnail fields
 * 
 * @param thumbnailId - The thumbnail ID to delete
 * @returns True if deletion was successful
 * 
 * Requirements: 1.6 - Delete thumbnail from database and storage
 */
export async function deleteThumbnail(thumbnailId: string): Promise<boolean> {
  try {
    // First, get the thumbnail to check if it's active
    const thumbnailResult = await queryD1(
      'SELECT * FROM thumbnail_options WHERE id = ?',
      [thumbnailId]
    );

    if (!thumbnailResult || !thumbnailResult.results || thumbnailResult.results.length === 0) {
      throw new Error('Thumbnail not found');
    }

    const thumbnail = thumbnailResult.results[0];
    const projectId = thumbnail.project_id;
    const wasActive = Boolean(thumbnail.is_active);

    // Delete the thumbnail option
    await queryD1(
      'DELETE FROM thumbnail_options WHERE id = ?',
      [thumbnailId]
    );

    // If the deleted thumbnail was active, clear the project's thumbnail fields AND poster_image
    if (wasActive) {
      await queryD1(
        `UPDATE projects SET 
          thumbnail_url = NULL,
          thumbnail_type = NULL,
          thumbnail_timestamp = NULL,
          thumbnail_metadata = NULL,
          poster_image = NULL,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [projectId]
      );
    }

    return true;
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return false;
  }
}
