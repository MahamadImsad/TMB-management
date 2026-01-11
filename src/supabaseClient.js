// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efoiymlbezmofsyeytzh.supabase.co'
const supabaseKey = 'sb_publishable_jHmFxv8Czrf87EMUBNHjUw_gonFIzSC'

export const supabase = createClient(supabaseUrl, supabaseKey)