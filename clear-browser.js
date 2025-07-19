// Clear ALL browser storage for the yoga planner app
// Run this in the browser console for complete reset

console.log('🧹 COMPLETE STORAGE RESET - Clearing everything...');

// Clear all localStorage (everything)
console.log('📂 Clearing localStorage...');
Object.keys(localStorage).forEach(key => {
  if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {
    localStorage.removeItem(key);
    console.log('Removed localStorage:', key);
  }
});

// Clear all sessionStorage 
console.log('📂 Clearing sessionStorage...');
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {
    sessionStorage.removeItem(key);
    console.log('Removed sessionStorage:', key);
  }
});

// Clear indexedDB
if ('indexedDB' in window) {
  console.log('📂 Clearing IndexedDB...');
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && (db.name.includes('yoga') || db.name.includes('canvas') || db.name.includes('supabase') || db.name.includes('tldraw'))) {
        console.log('Deleting database:', db.name);
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

// Clear all cookies related to the app
console.log('🍪 Clearing cookies...');
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  if (name.includes('supabase') || name.includes('yoga') || name.includes('canvas')) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    console.log('Cleared cookie:', name);
  }
});

console.log('✅ Complete reset finished! Refresh the page to start fresh.');
console.log('🔄 After refresh, you should see a clean default canvas created.'); 