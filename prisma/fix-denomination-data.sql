-- Fix double-encoded JSON in preferredDenomination field
-- This field should be a simple string, not a JSON array

DO $$
DECLARE
    pref_record RECORD;
    cleaned_value TEXT;
BEGIN
    -- Process each record with non-null preferredDenomination
    FOR pref_record IN 
        SELECT id, "preferredDenomination"
        FROM "user_preferences" 
        WHERE "preferredDenomination" IS NOT NULL
    LOOP
        BEGIN
            -- Handle different cases of double-encoded JSON
            cleaned_value := pref_record."preferredDenomination";
            
            -- Remove outer quotes if present (handles "[\\"PENTECOSTAL\\"]")
            IF cleaned_value LIKE '"%"' THEN
                cleaned_value := substring(cleaned_value from 2 for length(cleaned_value) - 2);
            END IF;
            
            -- If it's a JSON array, extract the first element
            IF cleaned_value LIKE '[%]' THEN
                -- Parse as JSON array and get first element
                cleaned_value := (cleaned_value::jsonb->>0);
            END IF;
            
            -- Remove any remaining quotes
            cleaned_value := replace(cleaned_value, '"', '');
            
            -- Validate that it's a valid denomination
            IF cleaned_value NOT IN ('BAPTIST', 'METHODIST', 'PRESBYTERIAN', 'PENTECOSTAL', 'CATHOLIC', 'ORTHODOX', 'ANGLICAN', 'LUTHERAN', 'ASSEMBLIES_OF_GOD', 'SEVENTH_DAY_ADVENTIST', 'OTHER') THEN
                cleaned_value := 'OTHER';
            END IF;
            
            -- Update the record
            UPDATE "user_preferences" 
            SET "preferredDenomination" = cleaned_value
            WHERE id = pref_record.id;
            
            RAISE NOTICE 'Fixed user_preferences ID %: "%s" -> "%s"', 
                pref_record.id, pref_record."preferredDenomination", cleaned_value;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing user_preferences ID %: %', pref_record.id, SQLERRM;
            -- Set to OTHER as fallback
            UPDATE "user_preferences" 
            SET "preferredDenomination" = 'OTHER'
            WHERE id = pref_record.id;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verify the results
SELECT id, "preferredDenomination" FROM "user_preferences" WHERE "preferredDenomination" IS NOT NULL;