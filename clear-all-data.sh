#!/bin/bash

echo "🧹 COMPLETE YOGA PLANNER RESET"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 This script will completely reset:${NC}"
echo "  • Supabase database (all users, canvases, folders)"
echo "  • Browser storage (localStorage, sessionStorage, indexedDB)"
echo "  • Auth sessions and cookies"
echo ""

read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Reset cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🗄️ Step 1: Resetting Supabase database...${NC}"

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Supabase not running, starting first...${NC}"
    supabase start
fi

# Reset the database
echo -e "${BLUE}🔄 Resetting database...${NC}"
supabase db reset

echo -e "${GREEN}✅ Database reset complete${NC}"
echo ""

echo -e "${BLUE}🌐 Step 2: Browser storage cleanup...${NC}"
echo ""
echo -e "${YELLOW}📋 Copy and run this script in your browser console:${NC}"
echo ""
echo -e "${BLUE}// ========================================"
echo "// BROWSER STORAGE RESET"
echo "// Copy this entire block and run in console"
echo "// ========================================"
echo ""
echo "console.log('🧹 COMPLETE STORAGE RESET - Clearing everything...');"
echo ""
echo "// Clear localStorage"
echo "console.log('📂 Clearing localStorage...');"
echo "Object.keys(localStorage).forEach(key => {"
echo "  if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {"
echo "    localStorage.removeItem(key);"
echo "    console.log('Removed localStorage:', key);"
echo "  }"
echo "});"
echo ""
echo "// Clear sessionStorage"
echo "console.log('📂 Clearing sessionStorage...');"
echo "Object.keys(sessionStorage).forEach(key => {"
echo "  if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {"
echo "    sessionStorage.removeItem(key);"
echo "    console.log('Removed sessionStorage:', key);"
echo "  }"
echo "});"
echo ""
echo "// Clear indexedDB"
echo "if ('indexedDB' in window) {"
echo "  console.log('📂 Clearing IndexedDB...');"
echo "  indexedDB.databases().then(databases => {"
echo "    databases.forEach(db => {"
echo "      if (db.name && (db.name.includes('yoga') || db.name.includes('canvas') || db.name.includes('supabase') || db.name.includes('tldraw'))) {"
echo "        console.log('Deleting database:', db.name);"
echo "        indexedDB.deleteDatabase(db.name);"
echo "      }"
echo "    });"
echo "  });"
echo "}"
echo ""
echo "// Clear cookies"
echo "console.log('🍪 Clearing cookies...');"
echo "document.cookie.split(';').forEach(cookie => {"
echo "  const eqPos = cookie.indexOf('=');"
echo "  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();"
echo "  if (name.includes('supabase') || name.includes('yoga') || name.includes('canvas')) {"
echo "    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';"
echo "    console.log('Cleared cookie:', name);"
echo "  }"
echo "});"
echo ""
echo "console.log('✅ Complete browser reset finished! Refresh the page.');"
echo "// ========================================"
echo -e "${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Manual steps:${NC}"
echo "  1. Copy the above browser script"
echo "  2. Open browser dev tools (F12)"
echo "  3. Go to Console tab"
echo "  4. Paste and run the script"
echo "  5. Refresh the page"
echo ""

echo -e "${GREEN}🎉 Database reset complete!${NC}"
echo -e "${YELLOW}⏳ Don't forget to run the browser script and refresh!${NC}"
echo ""
echo -e "${BLUE}🔄 Expected result after refresh:${NC}"
echo "  • Clean app with new default canvas"
echo "  • Fresh user signup flow"
echo "  • Auto-save working correctly"
echo "  • All persistence features working" 