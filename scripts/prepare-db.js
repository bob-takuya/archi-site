const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// データベースファイルのパス
const dbPath = path.join(__dirname, '../Archimap_database.sqlite');
// 出力ディレクトリ
const outputDir = path.join(__dirname, '../dist/db');

// チャンクサイズ (512KB)
const CHUNK_SIZE = 512 * 1024;

async function main() {
  // 出力ディレクトリが存在しない場合は作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // データベースファイルを読み込む
  const dbBuffer = fs.readFileSync(dbPath);
  const fileSize = dbBuffer.length;
  
  console.log(`Database size: ${fileSize} bytes`);
  
  // メタデータ作成
  const metadata = {
    serverMode: "chunked",
    requestChunkSize: CHUNK_SIZE,
    databaseLengthBytes: fileSize
  };
  
  // メタデータをJSONファイルに書き込む
  fs.writeFileSync(
    path.join(outputDir, 'db-metadata.json'), 
    JSON.stringify(metadata, null, 2)
  );

  // チャンク分割
  const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);
  console.log(`Splitting database into ${chunkCount} chunks...`);
  
  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunkBuffer = dbBuffer.slice(start, end);
    
    // チャンクファイルに書き込み
    fs.writeFileSync(
      path.join(outputDir, `db-${i}.chunk`), 
      chunkBuffer
    );
    
    console.log(`Chunk ${i} written: ${chunkBuffer.length} bytes`);
  }

  console.log('Database chunks created successfully!');
}

main().catch(err => {
  console.error('Error creating database chunks:', err);
  process.exit(1);
}); 