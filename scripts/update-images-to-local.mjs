import mysql from "mysql2/promise";
import fs from "fs";

// Read .env.local if exists
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  });
} catch (e) {}

const dbConfig = {
  host: process.env.DB_HOST || "srv2213.hstgr.io",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "u229963625_tadminks",
  password: (process.env.DB_PASSWORD || "q$kLQBF4hV;=66y").replace(/^'|'$/g, ""),
  database: process.env.DB_NAME || "u229963625_tadminks",
  ssl: { rejectUnauthorized: false },
};

async function main() {
  console.log("Connecting to MySQL to update image URLs to instant local assets...");
  const conn = await mysql.createConnection(dbConfig);
  console.log("Connected successfully!");

  try {
    // 1. Update news_posts
    console.log("Updating news_posts images...");
    await conn.execute(`
      UPDATE news_posts 
      SET image_url = CASE id
        WHEN 1 THEN '/assets/news/gold-medal.svg'
        WHEN 2 THEN '/assets/news/aatya-paatya.svg'
        WHEN 3 THEN '/assets/news/istaf-referee.svg'
        ELSE '/assets/defaults/fallback.svg'
      END
      WHERE id IN (1, 2, 3)
    `);

    // 2. Update leadership_members
    console.log("Updating leadership_members portraits...");
    await conn.execute(`
      UPDATE leadership_members
      SET photo_url = CASE id
        WHEN 1 THEN '/assets/leadership/tk-singh.svg'
        WHEN 2 THEN '/assets/leadership/jagdish-prajapat.svg'
        WHEN 3 THEN '/assets/leadership/mahendra-sharma.svg'
        WHEN 4 THEN '/assets/leadership/bs-shekhawat.svg'
        ELSE '/assets/defaults/fallback.svg'
      END
      WHERE id IN (1, 2, 3, 4)
    `);

    // 3. Update site_settings hero image
    console.log("Updating site_settings hero image...");
    await conn.execute(`
      UPDATE site_settings
      SET hero_bg_image = '/assets/hero/stadium-court.svg'
      WHERE id = 1
    `);

    // 4. Update players photos
    console.log("Updating players photos...");
    await conn.execute(`
      UPDATE players
      SET photo_url = CASE id
        WHEN 1 THEN '/assets/players/devendra-rathore.svg'
        WHEN 2 THEN '/assets/players/vikramaditya-shekhawat.svg'
        WHEN 3 THEN '/assets/players/pratik-patel.svg'
        WHEN 4 THEN '/assets/players/harshvardhan-vaghela.svg'
        WHEN 7 THEN '/assets/players/kuldeep-bishnoi.svg'
        WHEN 8 THEN '/assets/players/manish-choudhary.svg'
        ELSE photo_url
      END
      WHERE id IN (1, 2, 3, 4, 7, 8)
    `);

    console.log("All database image records updated to local assets successfully!");
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
