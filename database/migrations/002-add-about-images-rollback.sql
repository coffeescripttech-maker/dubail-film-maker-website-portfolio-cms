-- =====================================================
-- Rollback: Remove About Images Table
-- =====================================================

DROP TRIGGER IF EXISTS update_about_images_updated_at;
DROP INDEX IF EXISTS idx_about_images_order;
DROP TABLE IF EXISTS about_images;
