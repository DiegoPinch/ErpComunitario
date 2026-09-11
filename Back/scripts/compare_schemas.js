const fs = require('fs');
const extractTables = (sql) => {
  const matches = sql.match(/CREATE TABLE [\s\S]*?;/g) || [];
  return matches.map(m => m.replace(/AUTO_INCREMENT=\d+ /g, ''));
};
const devTables = extractTables(fs.readFileSync('schema_dev.sql', 'utf8'));
const prodTables = extractTables(fs.readFileSync('schema_prod.sql', 'utf8'));
devTables.forEach((devTable) => {
  const tableNameMatch = devTable.match(/CREATE TABLE `([^`]+)`/);
  if (!tableNameMatch) return;
  const tableName = tableNameMatch[1];
  const prodTable = prodTables.find(p => p.includes('CREATE TABLE `' + tableName + '`'));
  if (!prodTable) {
    console.log('NEW TABLE:', tableName);
  } else if (devTable !== prodTable) {
    console.log('\n--- CHANGED TABLE:', tableName, '---');
    console.log('DEV:\n', devTable);
    console.log('\nPROD:\n', prodTable);
  }
});
