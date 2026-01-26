-- =====================================================
-- Migration: Add About Images Table
-- Description: Create table for managing about page images
-- =====================================================

-- Create about_images table
CREATE TABLE IF NOT EXISTS about_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_about_images_order ON about_images(order_index);

-- Create trigger for auto-update timestamps
CREATE TRIGGER IF NOT EXISTS update_about_images_updated_at 
  AFTER UPDATE ON about_images
  FOR EACH ROW
  BEGIN
    UPDATE about_images SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Insert default images from existing about.json
INSERT OR IGNORE INTO about_images (id, url, alt, order_index) VALUES
  ('about-img-1', 'media/pages/about/6f8ea45b91-1724948873/adv-architecture-et-agencement-advstudio-1.jpg', 'DXP Studio Image 1', 1),
  ('about-img-2', 'media/pages/about/9a13aa90ff-1724948879/adv-architecture-et-agencement-advstudio-2.jpg', 'DXP Studio Image 2', 2),
  ('about-img-3', 'media/pages/about/570a1d755d-1724948885/adv-architecture-et-agencement-advstudio-3.jpg', 'DXP Studio Image 3', 3),
  ('about-img-4', 'media/pages/about/fe3e83c953-1724948891/adv-architecture-et-agencement-advstudio.jpg', 'DXP Studio Image 4', 4);
