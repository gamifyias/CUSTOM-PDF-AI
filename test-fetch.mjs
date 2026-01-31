
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cwzdqduyotcbwujmrohz.supabase.co'
const supabaseKey = 'sb_publishable_l2dqR-V5py1BmaOiivWAeA_pWtgIadq'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    console.log("Testing connection to:", supabaseUrl);

    // Test 1: Simple fetch from 'books'
    console.log("\nAttempting to fetch 'books'...");
    const { data, error } = await supabase
        .from('books')
        .select('*');

    if (error) {
        console.error("❌ Error fetching books:", error);
    } else {
        console.log(`✅ Success! Found ${data.length} books.`);
        if (data.length > 0) {
            console.log("First book:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("⚠️ Table is empty. Check RLS policies or Insert data.");
        }
    }

    // Test 2: Fetch with relation
    console.log("\nAttempting to fetch 'books' with 'subjects'...");
    const { data: relData, error: relError } = await supabase
        .from('books')
        .select('*, subjects(name)');

    if (relError) {
        console.error("❌ Error with relationship:", relError);
    } else {
        console.log(`✅ Success (Relation)! Found ${relData.length} records.`);
        if (relData.length > 0) {
            console.log("Relation Data Sample:", JSON.stringify(relData[0], null, 2));
        } else {
            console.log("⚠️ Relation data is empty.");
        }
    }
}

testFetch();
