
import { createClient } from '@supabase/supabase-js';

const url1 = 'https://cwzdqduyotcbwujmrohz.supabase.co';
const key1 = 'sb_publishable_l2dqR-V5py1BmaOiivWAeA_pWtgIadq';

const url2 = 'https://whlrurmpfsubcqjydxea.supabase.co';
// I need the key for url2 from memory.
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobHJ1cm1wZnN1YmNxanlkeGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODgzNjcsImV4cCI6MjA3ODI2NDM2N30.GbdVS7ZjfOEy0vXa4FnTaQVzFxgGZMaCy4FC_pwRmxE';

async function testFetch(name, url, key) {
    console.log(`Testing ${name} (${url})...`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase.from('books').select('*').limit(5);
        if (error) {
            console.error(`Error fetching from ${name}:`, error.message, error.details, error.hint);
        } else {
            console.log(`Success fetching from ${name}. Found ${data.length} books.`);
            if (data.length > 0) {
                console.log('Sample book:', JSON.stringify(data[0], null, 2));
            } else {
                console.log('No books found in table.');
            }
        }
    } catch (err) {
        console.error(`Exception testing ${name}:`, err);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

async function testWithJoin(name, url, key) {
    console.log(`\nTesting Join fetch on ${name}...`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*, subjects(name)')
            .limit(1);

        if (error) {
            console.error(`Error fetching join from ${name}:`, error.message);
        } else {
            console.log(`Success fetching join from ${name}. Found ${data.length} items.`);
        }
    } catch (err) {
        console.error(`Exception testing join on ${name}:`, err);
    }
}

async function testSubjects(name, url, key) {
    console.log(`\nTesting Subjects fetch on ${name}...`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase.from('subjects').select('*').limit(1);
        if (error) {
            console.error(`Error fetching subjects from ${name}:`, error.message);
        } else {
            console.log(`Success fetching subjects from ${name}. Found ${data.length} items.`);
        }
    } catch (err) {
        console.error(`Exception testing subjects on ${name}:`, err);
    }
}

async function testWithActive(name, url, key) {
    console.log(`\nTesting Active fetch on ${name}...`);
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error(`Error fetching active from ${name}:`, error.message);
        } else {
            console.log(`Success fetching active from ${name}. Found ${data.length} items.`);
        }
    } catch (err) {
        console.error(`Exception testing active on ${name}:`, err);
    }
}

async function main() {
    await testFetch('Current Config', url1, key1);
    await testWithJoin('Current Config', url1, key1);
    await testWithActive('Current Config', url1, key1);
}

main();
