export async function up(pool) {
  console.log("  Running Phase 8: Notifications & Official Notices...");

  // 1. Create notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(160) NOT NULL,
      body VARCHAR(500) NULL,
      link VARCHAR(255) NULL,
      kind ENUM('approval','roster','match','certification','system') NOT NULL DEFAULT 'system',
      read_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_user (user_id, read_at)
    ) ENGINE=InnoDB;
  `);

  // 2. Alter notices table
  const [noticeCols] = await pool.query(`DESCRIBE notices`);
  const noticeColNames = noticeCols.map((c) => c.Field);

  if (!noticeColNames.includes("pinned")) {
    await pool.query(`ALTER TABLE notices ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0`);
    console.log("    + Added notices.pinned");
  }
  if (!noticeColNames.includes("publish_at")) {
    await pool.query(`ALTER TABLE notices ADD COLUMN publish_at DATETIME NULL`);
    console.log("    + Added notices.publish_at");
  }
  if (!noticeColNames.includes("expires_at")) {
    await pool.query(`ALTER TABLE notices ADD COLUMN expires_at DATETIME NULL`);
    console.log("    + Added notices.expires_at");
  }

  // 3. Stored procedures for notifications
  await pool.query(`DROP PROCEDURE IF EXISTS sp_dispatch_notification`);
  await pool.query(`
    CREATE PROCEDURE sp_dispatch_notification(
      IN p_user_id INT,
      IN p_title VARCHAR(160),
      IN p_body VARCHAR(500),
      IN p_link VARCHAR(255),
      IN p_kind VARCHAR(20)
    )
    proc_notif: BEGIN
      INSERT INTO notifications (user_id, title, body, link, kind)
      VALUES (p_user_id, p_title, p_body, p_link, IFNULL(p_kind, 'system'));
    END proc_notif
  `);

  await pool.query(`DROP PROCEDURE IF EXISTS sp_mark_notification_read`);
  await pool.query(`
    CREATE PROCEDURE sp_mark_notification_read(
      IN p_actor_id INT,
      IN p_notif_id INT
    )
    proc_read: BEGIN
      IF p_notif_id IS NULL THEN
        UPDATE notifications SET read_at = NOW() WHERE user_id = p_actor_id AND read_at IS NULL;
      ELSE
        UPDATE notifications SET read_at = NOW() WHERE id = p_notif_id AND user_id = p_actor_id;
      END IF;
    END proc_read
  `);
}
