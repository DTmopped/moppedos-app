

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "order_guide_system";


ALTER SCHEMA "order_guide_system" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."_og_status_autocreate_for_location"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.order_guide_status (item_id, location_id, on_hand, par_level)
  values (new.id, '00fe305a-6b02-4eaa-9bfe-cbc2d46d9e17'::uuid, 0, 0)
  on conflict (item_id, location_id) do nothing;
  return new;
end $$;


ALTER FUNCTION "public"."_og_status_autocreate_for_location"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_all_order_guide_items"("location_uuid" "uuid") RETURNS TABLE("status" "text", "activated_count" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_count INT := 0;
BEGIN
  -- Update all items to be active
  UPDATE order_guide_items
  SET active = true
  WHERE 
    location_id = location_uuid
    AND (active = false OR active IS NULL);
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Items activated successfully' as status,
    updated_count as activated_count;
END;
$$;


ALTER FUNCTION "public"."activate_all_order_guide_items"("location_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_category_keywords"("p_category_id" integer, "p_keywords" "text"[]) RETURNS TABLE("category_id" integer, "category_name" "text", "keyword" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if category exists
    IF NOT EXISTS (SELECT 1 FROM order_guide_categories WHERE id = p_category_id) THEN
        RAISE EXCEPTION 'Category with ID % does not exist', p_category_id;
    END IF;

    -- Insert new keywords
    INSERT INTO order_guide_category_keywords (category_id, keyword)
    SELECT p_category_id, k
    FROM unnest(p_keywords) AS k
    ON CONFLICT (category_id, keyword) DO NOTHING;
    
    -- Return all keywords for this category
    RETURN QUERY
    SELECT 
        k.category_id,
        c.name AS category_name,
        k.keyword
    FROM 
        order_guide_category_keywords k
    JOIN
        order_guide_categories c ON k.category_id = c.id
    WHERE 
        k.category_id = p_category_id
    ORDER BY 
        k.keyword;
END;
$$;


ALTER FUNCTION "public"."add_category_keywords"("p_category_id" integer, "p_keywords" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_category_keywords"("p_category_id" bigint, "p_keywords" "text"[]) RETURNS TABLE("inserted_keywords" integer, "category_name" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    inserted_count INTEGER := 0;
    v_category_name TEXT;
BEGIN
    -- Get category name
    SELECT name INTO v_category_name FROM order_guide_categories WHERE id = p_category_id;
    
    -- Insert new keywords, skipping duplicates
    INSERT INTO order_guide_category_keywords (category_id, keyword)
    SELECT p_category_id, keyword
    FROM unnest(p_keywords) AS keyword
    WHERE NOT EXISTS (
        SELECT 1 FROM order_guide_category_keywords
        WHERE category_id = p_category_id AND keyword = unnest.keyword
    );
    
    -- Count number of inserted records
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN QUERY SELECT inserted_count, v_category_name;
END;
$$;


ALTER FUNCTION "public"."add_category_keywords"("p_category_id" bigint, "p_keywords" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_keyword"("p_category_name" "text", "p_new_keyword" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_cat_id integer;
BEGIN
  -- Find the category ID
  SELECT id INTO v_cat_id 
  FROM order_guide_categories 
  WHERE category_name = p_category_name 
  LIMIT 1;
  
  -- If category exists, insert the keyword
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO order_guide_category_keywords (category_id, keyword)
    VALUES (v_cat_id, p_new_keyword)
    ON CONFLICT (category_id, keyword) DO NOTHING;
    RETURN TRUE;
  ELSE
    RETURN FALSE; -- Category not found
  END IF;
END;
$$;


ALTER FUNCTION "public"."add_keyword"("p_category_name" "text", "p_new_keyword" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_og_keyword"("category_name" "text", "keyword" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cat_id INTEGER;
BEGIN
  SELECT id INTO cat_id FROM og_categories WHERE name = category_name;

  IF cat_id IS NULL THEN
    INSERT INTO og_categories (name) VALUES (category_name)
    RETURNING id INTO cat_id;
  END IF;

  INSERT INTO order_guide_category_keywords (category_id, keyword)
  VALUES (cat_id, keyword)
  ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."add_og_keyword"("category_name" "text", "keyword" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  v_item_id INTEGER;
BEGIN
  INSERT INTO public.order_guide_items (category_id, item_name, unit)
  VALUES (p_category_id, p_item_name, p_unit)
  ON CONFLICT (item_name, category_id) DO UPDATE SET unit = EXCLUDED.unit
  RETURNING id INTO v_item_id;

  INSERT INTO public.order_guide_status (item_id, location_id, on_hand, par_level)
  VALUES (v_item_id, p_location, 0, 0)
  ON CONFLICT (item_id, location_id) DO NOTHING;

  RETURN v_item_id;
END;
$$;


ALTER FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" "text", "p_item_name" "text", "p_unit" "text", "p_location" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_category_id integer;
  v_item_id uuid;
BEGIN
  -- Convert the category ID from UUID string to integer if needed
  BEGIN
    -- Try to convert directly to integer if it's already a number
    v_category_id := p_category_id::integer;
  EXCEPTION WHEN others THEN
    -- If it fails, it might be a UUID so let's extract a number from it
    -- This is a simplified conversion - adjust based on your actual needs
    v_category_id := ('x' || substring(p_category_id::text, 1, 8))::bit(32)::integer;
  END;
  
  -- Insert the new item
  INSERT INTO order_guide_items (item_name, category_id, unit)
  VALUES (p_item_name, v_category_id, p_unit)
  RETURNING id INTO v_item_id;
  
  -- Add to location relationship
  INSERT INTO order_guide_location_items (location_id, item_id)
  VALUES (p_location, v_item_id);
  
  RETURN v_item_id;
END;
$$;


ALTER FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" "text", "p_item_name" "text", "p_unit" "text", "p_location" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_order_guide_item_for_location_int"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_item_id uuid;
BEGIN
  -- Insert the new item
  INSERT INTO order_guide_items (item_name, category_id, unit)
  VALUES (p_item_name, p_category_id, p_unit)
  RETURNING id INTO v_item_id;
  
  -- Add to location relationship
  INSERT INTO order_guide_location_items (location_id, item_id)
  VALUES (p_location, v_item_id);
  
  RETURN v_item_id;
END;
$$;


ALTER FUNCTION "public"."add_order_guide_item_for_location_int"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_missing_categories"("location_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("status" "text", "updated_count" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated INT := 0;
  default_category_id UUID;
BEGIN
  -- Get a default category ID (you might want to change this)
  SELECT id INTO default_category_id FROM order_guide_categories LIMIT 1;
  
  -- Only proceed if we have a default category
  IF default_category_id IS NOT NULL THEN
    -- Update items with NULL category_id
    UPDATE order_guide_items
    SET 
      category_id = default_category_id,
      category = (SELECT category_name FROM order_guide_categories WHERE id = default_category_id)
    WHERE 
      category_id IS NULL
      AND (location_uuid IS NULL OR location_id = location_uuid);
      
    GET DIAGNOSTICS updated = ROW_COUNT;
  END IF;
  
  RETURN QUERY SELECT 
    'Uncategorized items assigned to default category' as status,
    updated as updated_count;
END;
$$;


ALTER FUNCTION "public"."assign_missing_categories"("location_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_categorize_item"("p_item_id" "uuid") RETURNS TABLE("success" boolean, "item_id" "uuid", "item_name" "text", "assigned_category_id" bigint, "assigned_category_name" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_item_name TEXT;
    v_best_category_id BIGINT;
    v_best_category_name TEXT;
    v_best_match_count INTEGER := 0;
    v_category_id BIGINT;
    v_category_name TEXT;
    v_match_count INTEGER;
    v_success BOOLEAN := FALSE;
BEGIN
    -- Get the item name
    SELECT name INTO v_item_name
    FROM order_guide_items
    WHERE id = p_item_id;
    
    -- If item doesn't exist, return with success = false
    IF v_item_name IS NULL THEN
        success := FALSE;
        item_id := p_item_id;
        item_name := NULL;
        assigned_category_id := NULL;
        assigned_category_name := NULL;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Find the best category match
    FOR v_category_id, v_category_name, v_match_count IN
        SELECT 
            c.id, 
            c.category_name, 
            COUNT(*) as matches
        FROM 
            order_guide_categories c
        JOIN 
            order_guide_category_keywords k ON c.id = k.category_id
        WHERE 
            v_item_name ILIKE '%' || k.keyword || '%'
        GROUP BY 
            c.id, c.category_name
        ORDER BY 
            matches DESC
        LIMIT 5
    LOOP
        -- Take the first (best) match
        IF v_best_category_id IS NULL OR v_match_count > v_best_match_count THEN
            v_best_category_id := v_category_id;
            v_best_category_name := v_category_name;
            v_best_match_count := v_match_count;
        END IF;
    END LOOP;
    
    -- If we found a match, update the item
    IF v_best_category_id IS NOT NULL THEN
        -- Remove updated_at since it doesn't exist in the table
        UPDATE order_guide_items
        SET category_id = v_best_category_id
        WHERE id = p_item_id;
        
        IF FOUND THEN
            v_success := TRUE;
        END IF;
    END IF;
    
    -- Return the results
    success := v_success;
    item_id := p_item_id;
    item_name := v_item_name;
    assigned_category_id := v_best_category_id;
    assigned_category_name := v_best_category_name;
    
    RETURN NEXT;
    RETURN;
END;
$$;


ALTER FUNCTION "public"."auto_categorize_item"("p_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_categorize_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_category_id INTEGER;
    v_category_name TEXT;
    v_description TEXT;
    v_vendor TEXT;
    v_search_text TEXT;
BEGIN
    -- Normalize the search text for better matching
    v_description := LOWER(COALESCE(NEW.description, ''));
    v_vendor := LOWER(COALESCE(NEW.vendor, ''));
    v_search_text := v_description || ' ' || v_vendor;
    
    -- Find matching category based on keywords
    SELECT ogc.id, ogc.category_name 
    INTO v_category_id, v_category_name
    FROM order_guide_categories ogc
    JOIN order_guide_category_keywords ogck ON ogc.id = ogck.category_id
    WHERE v_search_text LIKE '%' || LOWER(ogck.keyword) || '%'
    LIMIT 1;
    
    -- Update the order with the found category
    IF v_category_name IS NOT NULL THEN
        NEW.category := v_category_name;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_categorize_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_order_needs"("location_uuid" "uuid") RETURNS TABLE("id" "uuid", "item_name" "text", "category_name" "text", "on_hand" numeric, "par_level" numeric, "order_quantity" numeric, "unit" "text", "unit_cost" numeric, "extended_cost" numeric, "vendor" "text", "sku" "text", "status" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT 
        i.id,
        i.item_name,
        c.name AS category_name,
        COALESCE(s.on_hand, 0)::numeric AS on_hand,
        COALESCE(s.par_level, i.par_level)::numeric AS par_level,
        GREATEST(0, COALESCE(s.par_level, i.par_level) - COALESCE(s.on_hand, 0))::numeric AS order_quantity,
        i.unit,
        COALESCE(i.unit_cost, 0)::numeric AS unit_cost,
        (GREATEST(0, COALESCE(s.par_level, i.par_level) - COALESCE(s.on_hand, 0)) * COALESCE(i.unit_cost, 0))::numeric AS extended_cost,
        COALESCE(i.vendor, '') AS vendor,
        COALESCE(i.sku, '') AS sku,
        CASE
            WHEN s.on_hand IS NULL THEN 'No Data'
            WHEN s.on_hand = 0 THEN 'Critical'
            WHEN s.on_hand < (COALESCE(s.par_level, i.par_level) * 0.25) THEN 'Urgent'
            WHEN s.on_hand < (COALESCE(s.par_level, i.par_level) * 0.5) THEN 'High'
            WHEN s.on_hand < (COALESCE(s.par_level, i.par_level) * 0.75) THEN 'Medium'
            ELSE 'Low'
        END AS status
    FROM 
        order_guide_items i
    LEFT JOIN 
        order_guide_categories c ON i.category_id = c.id
    LEFT JOIN 
        order_guide_status s ON i.id = s.item_id AND s.location_id = location_uuid
    WHERE 
        (i.location_id = location_uuid OR EXISTS (
            SELECT 1 FROM order_guide_location_items oli
            WHERE oli.item_id = i.id AND oli.location_id = location_uuid
        ))
        AND COALESCE(s.on_hand, 0) < COALESCE(s.par_level, i.par_level, 999999)
    ORDER BY 
        c.name, 
        i.item_name;
$$;


ALTER FUNCTION "public"."calculate_order_needs"("location_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_order_quantities"("location_uuid" "uuid", "date_param" "date") RETURNS TABLE("category" "text", "item_name" "text", "unit" "text", "on_hand" numeric, "par_level" numeric, "order_quantity" numeric, "priority" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ogi.category,
        ogi.item_name,
        ogi.unit,
        ogs.on_hand,
        ogs.par_level,
        GREATEST(0, ogs.par_level - ogs.on_hand) as order_quantity,
        CASE 
            WHEN (ogs.on_hand < (ogs.par_level * 0.25)) THEN 'Urgent'
            WHEN (ogs.on_hand < ogs.par_level) THEN 'Normal'
            ELSE 'None'
        END as priority
    FROM 
        public.order_guide_status ogs
    JOIN 
        public.order_guide_items ogi ON ogs.item_id = ogi.id
    WHERE 
        ogs.location_id = location_uuid
        AND (ogs.par_level - ogs.on_hand) > 0
    ORDER BY 
        CASE 
            WHEN (ogs.on_hand < (ogs.par_level * 0.25)) THEN 1
            WHEN (ogs.on_hand < ogs.par_level) THEN 2
            ELSE 3
        END,
        ogi.category,
        ogi.item_name;
END;
$$;


ALTER FUNCTION "public"."calculate_order_quantities"("location_uuid" "uuid", "date_param" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."categorize_items"() RETURNS TABLE("item_id" "uuid", "item_name" "text", "old_category_id" integer, "new_category_id" integer, "category_name" "text", "match_keyword" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    matched_items_count integer;
BEGIN
    -- Create temporary table to hold matched items
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_category_matches (
        item_id uuid,
        item_name text,
        old_category_id integer,
        new_category_id integer,
        category_name text,
        match_keyword text,
        rank integer
    ) ON COMMIT DROP;
    
    -- Clear the temporary table
    DELETE FROM temp_category_matches;
    
    -- Insert matches into the temporary table with fully qualified column names
    INSERT INTO temp_category_matches (
        item_id, 
        item_name, 
        old_category_id, 
        new_category_id,
        category_name,
        match_keyword,
        rank
    )
    SELECT 
        i.id AS item_id,
        i.item_name,
        i.category_id AS old_category_id,
        k.category_id AS new_category_id,
        c.name AS category_name,
        k.keyword AS match_keyword,
        ROW_NUMBER() OVER (
            PARTITION BY i.id 
            ORDER BY 
                -- Exact match gets priority
                CASE WHEN LOWER(i.item_name) = LOWER(k.keyword) THEN 0 ELSE 1 END,
                -- Matches at beginning of name get priority
                CASE WHEN LOWER(i.item_name) LIKE LOWER(k.keyword) || '%' THEN 0 ELSE 1 END,
                -- Then by length of keyword (longer matches are better)
                LENGTH(k.keyword) DESC
        ) AS rank
    FROM 
        order_guide_items i
    JOIN 
        order_guide_category_keywords k ON LOWER(i.item_name) LIKE '%' || LOWER(k.keyword) || '%'
    JOIN 
        order_guide_categories c ON k.category_id = c.id
    WHERE 
        i.category_id IS NULL OR i.category_id = 0;

    -- Update the categorization for all matched items
    UPDATE order_guide_items i
    SET 
        category_id = m.new_category_id,
        updated_at = NOW()
    FROM (
        SELECT 
            temp_category_matches.item_id, 
            temp_category_matches.new_category_id
        FROM 
            temp_category_matches
        WHERE 
            temp_category_matches.rank = 1
    ) m
    WHERE i.id = m.item_id;
    
    GET DIAGNOSTICS matched_items_count = ROW_COUNT;
    
    -- Record this categorization run in the logs
    INSERT INTO og_categorization_logs (
        run_type, 
        total_count, 
        categorized_count, 
        uncategorized_count, 
        uncategorized_percentage, 
        duration_ms, 
        notes
    )
    SELECT 
        'auto_categorize',
        COUNT(*),
        matched_items_count,
        COUNT(*) - matched_items_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(((COUNT(*) - matched_items_count)::numeric / COUNT(*)::numeric) * 100, 2)
            ELSE 0
        END,
        0,
        'Automatic categorization based on keywords'
    FROM order_guide_items
    WHERE category_id IS NULL OR category_id = 0;

    -- Return the best match for each uncategorized item
    RETURN QUERY
    SELECT 
        m.item_id,
        m.item_name,
        m.old_category_id,
        m.new_category_id,
        m.category_name,
        m.match_keyword
    FROM 
        temp_category_matches m
    WHERE 
        m.rank = 1;
END;
$$;


ALTER FUNCTION "public"."categorize_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."categorize_items_by_name"("location_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("status" "text", "updated_count" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated INT := 0;
  total_updated INT := 0;
  category_record RECORD;
  keyword_list TEXT[];
BEGIN
  -- Get all categories
  FOR category_record IN 
    SELECT id, category_name FROM order_guide_categories
  LOOP
    -- Define keywords for each category (customize these based on your actual items)
    CASE 
      WHEN category_record.category_name ILIKE '%produce%' THEN
        keyword_list := ARRAY['vegetable', 'vegetables', 'fruit', 'fruits', 'fresh', 'lettuce', 'tomato', 'onion', 'potato'];
      WHEN category_record.category_name ILIKE '%meat%' THEN
        keyword_list := ARRAY['beef', 'chicken', 'pork', 'steak', 'burger', 'meat', 'poultry', 'fish', 'seafood'];
      WHEN category_record.category_name ILIKE '%dairy%' THEN
        keyword_list := ARRAY['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy'];
      WHEN category_record.category_name ILIKE '%bakery%' THEN
        keyword_list := ARRAY['bread', 'bun', 'roll', 'bagel', 'pastry', 'bake'];
      WHEN category_record.category_name ILIKE '%beverage%' THEN
        keyword_list := ARRAY['drink', 'soda', 'beverage', 'juice', 'water', 'coffee', 'tea'];
      WHEN category_record.category_name ILIKE '%dry%' THEN
        keyword_list := ARRAY['pasta', 'rice', 'cereal', 'grain', 'bean', 'dry'];
      WHEN category_record.category_name ILIKE '%cleaning%' THEN
        keyword_list := ARRAY['clean', 'soap', 'detergent', 'sanitizer', 'bleach'];
      WHEN category_record.category_name ILIKE '%paper%' THEN
        keyword_list := ARRAY['paper', 'napkin', 'towel', 'tissue'];
      ELSE
        keyword_list := ARRAY[lower(category_record.category_name)];
    END CASE;
    
    -- Update items that match keywords for this category
    WITH updated_items AS (
      UPDATE order_guide_items
      SET 
        category_id = category_record.id,
        category = category_record.category_name
      WHERE 
        category_id IS NULL
        AND (location_uuid IS NULL OR location_id = location_uuid)
        AND (
          -- Check if item name or name contains any of the keywords
          EXISTS (
            SELECT 1
            FROM unnest(keyword_list) keyword
            WHERE 
              lower(item_name) LIKE '%' || keyword || '%'
              OR lower(name) LIKE '%' || keyword || '%'
          )
        )
      RETURNING id
    )
    SELECT COUNT(*) INTO updated FROM updated_items;
    
    total_updated := total_updated + updated;
  END LOOP;
  
  RETURN QUERY SELECT 
    'Items categorized based on name patterns' as status,
    total_updated as updated_count;
END;
$$;


ALTER FUNCTION "public"."categorize_items_by_name"("location_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."categorize_order_guide_item"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    matching_category_id INTEGER;
BEGIN
    -- Find a matching category based on the item name
    SELECT category_id INTO matching_category_id
    FROM order_guide_category_keywords k
    JOIN order_guide_categories c ON k.category_id = c.id
    WHERE NEW.item_name ILIKE '%' || k.keyword || '%'
    LIMIT 1;
    
    -- Update the category_id if a match was found
    IF matching_category_id IS NOT NULL THEN
        NEW.category_id := matching_category_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."categorize_order_guide_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_categorization_quality"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  notification_record RECORD;
  bad_days INT;
  threshold NUMERIC(5,2);
  message TEXT := 'No notifications sent';
BEGIN
  -- Loop through each active notification setting
  FOR notification_record IN 
    SELECT * FROM categorization_notifications WHERE is_active = TRUE
  LOOP
    threshold := notification_record.threshold_percentage;
    
    -- Count consecutive days above threshold
    SELECT COUNT(*) INTO bad_days
    FROM (
      SELECT 
        DATE_TRUNC('day', run_time) AS day,
        AVG(uncategorized_percentage) AS avg_percentage
      FROM categorization_logs
      GROUP BY DATE_TRUNC('day', run_time)
      HAVING AVG(uncategorized_percentage) > threshold
      ORDER BY day DESC
      LIMIT notification_record.consecutive_days
    ) subq;
    
    -- If we have enough consecutive bad days, send notification
    IF bad_days >= notification_record.consecutive_days THEN
      -- Don't notify again if we've already notified in the last 24 hours
      IF notification_record.last_notified IS NULL OR 
         notification_record.last_notified < (now() - interval '24 hours') THEN
        
        -- In a real implementation, this would send an email or webhook
        -- For this example, we'll just log it
        RAISE NOTICE 'NOTIFICATION: Categorization quality has been below % for % consecutive days', 
                     threshold, bad_days;
        
        -- Update the last notified timestamp
        UPDATE categorization_notifications
        SET last_notified = now(), updated_at = now()
        WHERE id = notification_record.id;
        
        message := 'Notification sent for ' || notification_record.email;
      ELSE
        message := 'Notification suppressed (already sent within 24h)';
      END IF;
    END IF;
  END LOOP;

  RETURN message;
END;
$$;


ALTER FUNCTION "public"."check_categorization_quality"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clone_order_guide_items"("source_location_id" "uuid", "target_location_id" "uuid", "only_active" boolean DEFAULT true) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  items_copied INTEGER;
BEGIN
  -- Insert items from source location that don't exist in target location
  WITH source_items AS (
    SELECT 
      category_id, item_name, unit, par_level, status, unit_cost, 
      forecast, vendor, description
    FROM order_guide_items
    WHERE location_id = source_location_id
      AND (NOT only_active OR status = 'active')
  ),
  -- Check what items already exist at destination location
  existing_items AS (
    SELECT item_name, category_id
    FROM order_guide_items
    WHERE location_id = target_location_id
  )
  
  INSERT INTO order_guide_items (
    id, location_id, category_id, item_name, unit, 
    par_level, status, unit_cost, forecast, vendor, description
  )
  SELECT 
    gen_random_uuid(), 
    target_location_id,
    s.category_id, s.item_name, s.unit,
    s.par_level, s.status, s.unit_cost, s.forecast, s.vendor, s.description
  FROM source_items s
  WHERE NOT EXISTS (
    SELECT 1 
    FROM existing_items e 
    WHERE e.item_name = s.item_name AND e.category_id = s.category_id
  );
  
  GET DIAGNOSTICS items_copied = ROW_COUNT;
  RETURN items_copied;
END;
$$;


ALTER FUNCTION "public"."clone_order_guide_items"("source_location_id" "uuid", "target_location_id" "uuid", "only_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."copy_order_items"() RETURNS TABLE("item_name" "text", "status" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    item_record RECORD;
    items_copied INTEGER := 0;
    items_skipped INTEGER := 0;
BEGIN
    FOR item_record IN 
        SELECT *
        FROM order_guide_items ogi -- Added alias
        WHERE 
            ogi.location_id = '00fe305a-6b02-4eaa-90fe-cbc2d4d69e17'
            AND ogi.status = 'active'  -- Fixed: qualified status with table alias
    LOOP
        BEGIN
            -- Try to insert the item into the target location
            INSERT INTO order_guide_items (
                item_name,
                category_id,
                location_id,
                unit,
                par_level,
                status,
                unit_cost,
                forecast,
                vendor,
                description
            ) VALUES (
                item_record.item_name,
                item_record.category_id,
                '11111111-2222-3333-4444-555555555555',
                item_record.unit,
                item_record.par_level,
                item_record.status,
                item_record.unit_cost,
                item_record.forecast,
                item_record.vendor,
                item_record.description
            );
            
            items_copied := items_copied + 1;
            item_name := item_record.item_name;
            status := 'COPIED';
            RETURN NEXT;
            
        EXCEPTION WHEN unique_violation THEN
            -- Skip this item if it would violate the constraint
            items_skipped := items_skipped + 1;
            item_name := item_record.item_name;
            status := 'SKIPPED (already exists)';
            RETURN NEXT;
        END;
    END LOOP;
    
    -- Final summary row
    item_name := 'SUMMARY';
    status := items_copied || ' items copied, ' || items_skipped || ' items skipped';
    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."copy_order_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_daily_briefing_with_carryforward"("p_date" "date", "p_location_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  previous_row record;
begin
  -- Get the most recent previous briefing for this location
  select *
  into previous_row
  from daily_briefings
  where daily_briefings.location_id = p_location_id
    and daily_briefings.date < p_date
  order by daily_briefings.date desc
  limit 1;

  -- Insert new row with carry-forward
  insert into daily_briefings (
    date, location_id, forecast_notes, repair_notes, events, food_items,
    beverage_items, food_image_url, beverage_image_url,
    shoutout, mindset
  )
  values (
    p_date,
    p_location_id,
    previous_row.forecast_notes,
    previous_row.repair_notes,
    previous_row.events,
    previous_row.food_items,
    previous_row.beverage_items,
    previous_row.food_image_url,
    previous_row.beverage_image_url,
    previous_row.shoutout,
    previous_row.mindset
  );
end;
$$;


ALTER FUNCTION "public"."create_daily_briefing_with_carryforward"("p_date" "date", "p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_weekly_order_guide"("p_week_number" integer, "p_year" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_guide_id uuid;
BEGIN
    -- Create the weekly order guide
    INSERT INTO public.weekly_order_guides (week_number, year)
    VALUES (p_week_number, p_year)
    RETURNING id INTO v_guide_id;
    
    -- Add all active items to the weekly order guide
    INSERT INTO public.weekly_order_guide_items 
        (weekly_order_guide_id, order_guide_item_id)
    SELECT 
        v_guide_id,
        id
    FROM 
        public.order_guide_items
    WHERE 
        active = true;
        
    RETURN v_guide_id;
END;
$$;


ALTER FUNCTION "public"."create_weekly_order_guide"("p_week_number" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_location_ids"() RETURNS TABLE("location_id" "uuid")
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select ul.location_id
  from public.user_locations ul
  where ul.user_id = (select auth.uid());
$$;


ALTER FUNCTION "public"."current_user_location_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_categorization_check"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- First run the scheduled categorization
  PERFORM run_scheduled_categorization();
  
  -- Then check if quality is below threshold for consecutive days
  PERFORM check_categorization_quality();
END;
$$;


ALTER FUNCTION "public"."daily_categorization_check"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_category_keywords"("p_category_id" bigint) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM order_guide_category_keywords
    WHERE category_id = p_category_id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."delete_category_keywords"("p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."duplicate_daily_briefings_for_tomorrow"("p_run_date" "date" DEFAULT ("timezone"('utc'::"text", "now"()))::"date") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_rows int := 0;
begin
  insert into public.daily_briefings (
    location_id,
    date,
    events,
    food_items,
    beverage_items,
    repair_notes,
    -- everything else intentionally left null/blank for the new day
    created_at,
    updated_at
  )
  select
    b.location_id,
    (p_run_date + interval '1 day')::date as next_date,
    b.events,
    b.food_items,
    b.beverage_items,
    b.repair_notes,
    now(),
    now()
  from public.daily_briefings b
  where b.date = p_run_date
  on conflict (location_id, date) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;


ALTER FUNCTION "public"."duplicate_daily_briefings_for_tomorrow"("p_run_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_unique_item_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If the new item has a NULL name, we don't need to do anything special
    IF NEW.item_name IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if this item name already exists (excluding the current item if it's an update)
    PERFORM 1 FROM order_guide_items 
    WHERE item_name = NEW.item_name 
    AND id != COALESCE(NEW.id, -1);
    
    IF FOUND THEN
        RAISE EXCEPTION 'Item with name "%" already exists', NEW.item_name;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_unique_item_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_categories_by_keyword"("p_keyword" "text") RETURNS TABLE("category_id" bigint, "category_name" "text", "match_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS category_id,
        c.category_name,
        COUNT(k.id) AS match_count
    FROM 
        order_guide_categories c
    JOIN 
        order_guide_category_keywords k ON c.id = k.category_id
    WHERE 
        k.keyword ILIKE '%' || p_keyword || '%'
    GROUP BY 
        c.id, c.category_name
    ORDER BY
        match_count DESC,
        c.category_name;
END;
$$;


ALTER FUNCTION "public"."find_categories_by_keyword"("p_keyword" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_categories_by_keyword_v1"("p_keyword" "text") RETURNS TABLE("category_id" bigint, "category_name" "text", "match_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS category_id,
        c.category_name,
        COUNT(k.id) AS match_count
    FROM 
        order_guide_categories c
    JOIN 
        order_guide_category_keywords k ON c.id = k.category_id
    WHERE 
        k.keyword ILIKE '%' || p_keyword || '%'
    GROUP BY 
        c.id, c.category_name
    ORDER BY
        match_count DESC,
        c.category_name;
END;
$$;


ALTER FUNCTION "public"."find_categories_by_keyword_v1"("p_keyword" "text") OWNER TO "postgres";


CREATE PROCEDURE "public"."fix_duplicate_items"()
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    duplicate_record RECORD;
    item_to_keep UUID;
    items_to_remove UUID[];
BEGIN
    -- For each set of duplicate items
    FOR duplicate_record IN 
        SELECT 
            item_name,
            array_agg(id ORDER BY id) AS all_ids
        FROM 
            order_guide_items
        WHERE
            item_name IS NOT NULL
        GROUP BY 
            item_name
        HAVING 
            COUNT(*) > 1
        ORDER BY 
            item_name
    LOOP
        -- Choose the first ID to keep
        item_to_keep := (duplicate_record.all_ids)[1];
        
        -- Get the list of IDs to remove (all except the one to keep)
        items_to_remove := duplicate_record.all_ids[2:array_length(duplicate_record.all_ids, 1)];
        
        RAISE NOTICE 'Processing duplicate item: %, keeping ID: %, removing IDs: %', 
                     duplicate_record.item_name, item_to_keep, items_to_remove;
        
        -- For each item to remove, handle its status records
        FOR i IN 1..array_length(items_to_remove, 1) LOOP
            -- Delete status records for the item_id we're removing
            -- We'll rely on the application to recreate them as needed for the kept item
            DELETE FROM order_guide_status
            WHERE item_id = items_to_remove[i];
            
            -- Delete the duplicate item
            DELETE FROM order_guide_items
            WHERE id = items_to_remove[i];
            
            RAISE NOTICE 'Deleted item ID: %', items_to_remove[i];
        END LOOP;
        
        RAISE NOTICE 'Successfully processed: %', duplicate_record.item_name;
    END LOOP;
    
    COMMIT;
    RAISE NOTICE 'All duplicates have been processed successfully';
END;
$$;


ALTER PROCEDURE "public"."fix_duplicate_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_empty_order_guide_names"("location_filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update items to use item_name when name is empty or null
  WITH updated_rows AS (
    UPDATE order_guide_items
    SET name = item_name
    WHERE 
      (name IS NULL OR name = '')
      AND item_name IS NOT NULL
      AND item_name != ''
      AND CASE 
        WHEN location_filter->>'location_id' IS NOT NULL THEN
          location_id = (location_filter->>'location_id')::uuid
        ELSE 
          true
      END
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated_rows;
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."fix_empty_order_guide_names"("location_filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_briefing_if_missing"("p_location_id" "uuid", "p_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_exists boolean;
  v_prev public.daily_briefings%rowtype;
  v_forecast numeric;
  v_quote text;
begin
  -- Check existing
  select true into v_exists
  from public.daily_briefings b
  where b.location_id = p_location_id and b.date = p_date
  limit 1;

  if v_exists then
    return;
  end if;

  -- Previous briefing for carry-forward
  select * into v_prev
  from public.daily_briefings b
  where b.location_id = p_location_id and b.date < p_date
  order by b.date desc
  limit 1;

  -- Forecast for the date
  select fd.forecast_total::numeric into v_forecast
  from public.forecast_data fd
  where fd.location_id = p_location_id and fd.date = p_date
  order by fd.created_at desc
  limit 1;

  -- Quote via Edge Function (optional). Replace URL if different.
  begin
    select (res->>'text')::text into v_quote
    from extensions.http_get('https://<YOUR-PROJECT-REF>.functions.supabase.co/get-daily-quote',
                             '{"Accept": "application/json"}'::json) as t(status int, headers json, res json);
  exception when others then
    v_quote := null;
  end;

  insert into public.daily_briefings(
    location_id, date,
    lunch, dinner,
    forecast_notes, forecasted_sales, actual_sales,
    variance_notes, shoutout, reminders, mindset,
    food_items, food_image_url, beverage_items, beverage_image_url,
    events, repair_notes, manager, created_by
  )
  values (
    p_location_id, p_date,
    coalesce(v_prev.lunch, null),
    coalesce(v_prev.dinner, null),
    v_prev.forecast_notes,
    v_forecast,
    null,
    v_prev.variance_notes,
    v_quote, -- store quote in shoutout; adjust if you have a dedicated column
    v_prev.reminders,
    v_prev.mindset,
    v_prev.food_items, v_prev.food_image_url,
    v_prev.beverage_items, v_prev.beverage_image_url,
    v_prev.events, v_prev.repair_notes,
    v_prev.manager,
    null
  );
end;
$$;


ALTER FUNCTION "public"."generate_daily_briefing_if_missing"("p_location_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_briefings_all_locations"("p_run_ts" timestamp with time zone DEFAULT "now"()) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  r record;
  v_local_time time;
  v_target_date date;
begin
  for r in
    select l.id as location_id, l.timezone
    from public.locations l
    where l.timezone is not null and l.timezone <> ''
  loop
    -- Determine the location's local time for the provided run timestamp
    v_local_time := (p_run_ts at time zone r.timezone)::time;

    -- Only run near 03:00 local time. Because cron runs every 15 minutes, allow a window 03:00:00..03:14:59
    if v_local_time >= time '03:00:00' and v_local_time < time '03:15:00' then
      -- Use the date in that local timezone as the target briefing date
      v_target_date := (p_run_ts at time zone r.timezone)::date;

      perform public.generate_daily_briefing_if_missing(r.location_id, v_target_date);
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."generate_daily_briefings_all_locations"("p_run_ts" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."order_guide_categories" (
    "id" integer NOT NULL,
    "category_name" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "name" "text"
);


ALTER TABLE "public"."order_guide_categories" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_weekly_order_guide"() RETURNS SETOF "public"."order_guide_categories"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    -- This function can be modified to generate a weekly order guide
    -- For now, it simply returns all categories
    RETURN QUERY
    SELECT * FROM public.order_guide_categories
    ORDER BY display_order ASC, category_name ASC;
END;
$$;


ALTER FUNCTION "public"."generate_weekly_order_guide"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_weekly_order_guide"("p_location_id" "uuid") RETURNS TABLE("id" "uuid", "item_name" "text", "category_name" "text", "on_hand" numeric, "par_level" numeric, "order_quantity" numeric, "unit" "text", "unit_cost" numeric, "extended_cost" numeric, "vendor" "text", "sku" "text", "status" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    -- This function is a wrapper around calculate_order_needs
    -- to provide semantic meaning for the weekly order process
    SELECT * FROM calculate_order_needs(p_location_id);
$$;


ALTER FUNCTION "public"."generate_weekly_order_guide"("p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_weekly_order_guide"("location_uuid" "uuid", "week_start" "date") RETURNS TABLE("category_name" "text", "item_name" "text", "quantity" numeric, "unit" "text", "unit_cost" numeric, "extended_cost" numeric, "vendor" "text", "sku" "text", "notes" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    location_name text;
BEGIN
    -- Get location name
    SELECT name INTO location_name 
    FROM locations 
    WHERE id = location_uuid;
    
    -- First, record that we're generating a new order guide
    INSERT INTO og_categorization_logs (
        run_type, 
        total_count, 
        categorized_count, 
        uncategorized_count, 
        uncategorized_percentage, 
        duration_ms, 
        notes
    )
    SELECT 
        'weekly_order_guide',
        COUNT(*),
        COUNT(CASE WHEN i.category_id IS NOT NULL AND i.category_id > 0 THEN 1 END),
        COUNT(CASE WHEN i.category_id IS NULL OR i.category_id = 0 THEN 1 END),
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN i.category_id IS NULL OR i.category_id = 0 THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
            ELSE 0
        END,
        0,
        'Weekly order guide for location: ' || COALESCE(location_name, 'Unknown') || 
        ' for week starting: ' || week_start::text
    FROM order_guide_items i
    WHERE i.location_id = location_uuid OR EXISTS (
        SELECT 1 FROM order_guide_location_items oli
        WHERE oli.item_id = i.id AND oli.location_id = location_uuid
    );

    -- Return the order guide data
    RETURN QUERY
    SELECT 
        c.name AS category_name,
        i.item_name,
        GREATEST(0, COALESCE(s.par_level, i.par_level) - COALESCE(s.on_hand, 0)) AS quantity,
        i.unit,
        i.unit_cost,
        GREATEST(0, COALESCE(s.par_level, i.par_level) - COALESCE(s.on_hand, 0)) * COALESCE(i.unit_cost, 0) AS extended_cost,
        i.vendor,
        i.sku,
        CASE
            WHEN s.on_hand IS NULL THEN 'No inventory data'
            WHEN s.on_hand = 0 THEN 'OUT OF STOCK'
            WHEN s.on_hand < (COALESCE(s.par_level, i.par_level) * 0.25) THEN 'Critical low'
            WHEN s.on_hand < (COALESCE(s.par_level, i.par_level) * 0.5) THEN 'Low inventory'
            ELSE NULL
        END AS notes
    FROM 
        order_guide_items i
    JOIN 
        order_guide_categories c ON i.category_id = c.id
    LEFT JOIN 
        order_guide_status s ON i.id = s.item_id AND s.location_id = location_uuid
    WHERE 
        (i.location_id = location_uuid OR EXISTS (
            SELECT 1 FROM order_guide_location_items oli
            WHERE oli.item_id = i.id AND oli.location_id = location_uuid
        ))
        AND COALESCE(s.on_hand, 0) < COALESCE(s.par_level, i.par_level, 999999)
    ORDER BY 
        c.display_order, c.name, i.item_name;
END;
$$;


ALTER FUNCTION "public"."generate_weekly_order_guide"("location_uuid" "uuid", "week_start" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_actual_or_forecast_sales"("p_location_id" "uuid", "p_day" "date") RETURNS numeric
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
select coalesce(
  (select fd.actual_total::numeric
     from public.forecast_data fd
     where fd.location_id = p_location_id and fd.date = p_day
     limit 1),
  (select fd.forecast_total::numeric
     from public.forecast_data fd
     where fd.location_id = p_location_id and fd.date = p_day
     limit 1)
);
$$;


ALTER FUNCTION "public"."get_actual_or_forecast_sales"("p_location_id" "uuid", "p_day" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_and_store_weather"("location_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  tz text;
  city text;
  temp_low int;
  temp_high int;
  conditions text;
begin
  -- Get city/timezone (simplified example)
  select city, timezone into city, tz from store_locations where id = location_id;

  -- MOCK API logic (replace this with real API call via edge function)
  temp_low := floor(random()*20 + 50);   -- Example: 50–70°F
  temp_high := temp_low + 10;
  conditions := 'Sunny';  -- Or pull from an API

  -- Insert or update forecast
  insert into weather_data (location_id, forecast_date, temperature_low, temperature_high, conditions)
  values (location_id, current_date, temp_low, temp_high, conditions)
  on conflict (location_id, forecast_date) do update
    set temperature_low = excluded.temperature_low,
        temperature_high = excluded.temperature_high,
        conditions = excluded.conditions;
end;
$$;


ALTER FUNCTION "public"."get_and_store_weather"("location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_keywords"("p_category_id" bigint) RETURNS TABLE("keyword_id" bigint, "keyword" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id AS keyword_id,
        keyword
    FROM 
        order_guide_category_keywords
    WHERE 
        category_id = p_category_id
    ORDER BY
        keyword;
END;
$$;


ALTER FUNCTION "public"."get_category_keywords"("p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_keywords_new"("p_category_id" bigint) RETURNS TABLE("keyword_id" bigint, "keyword" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id AS keyword_id,
        keyword
    FROM 
        order_guide_category_keywords
    WHERE 
        category_id = p_category_id
    ORDER BY
        keyword;
END;
$$;


ALTER FUNCTION "public"."get_category_keywords_new"("p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_keywords_v2"("p_category_id" bigint) RETURNS TABLE("id" bigint, "category_id" bigint, "keyword" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.category_id,
        k.keyword
    FROM 
        order_guide_category_keywords k
    WHERE 
        k.category_id = p_category_id
    ORDER BY
        k.keyword;
END;
$$;


ALTER FUNCTION "public"."get_category_keywords_v2"("p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_labor_summary"("p_location_id" "uuid", "p_date" "date") RETURNS TABLE("report_date" "date", "forecasted_sales" numeric, "scheduled_labor_cost" numeric, "labor_percent" numeric, "labor_cost_goal" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with goal as (
    select lg.labor_cost_goal
    from public.labor_goals lg
    where lg.location_id = p_location_id
      and lg.effective_from <= p_date
      and (lg.effective_to is null or lg.effective_to >= p_date)
    order by lg.effective_from desc
    limit 1
  ),
  fc as (
    select f.forecast_total::numeric as forecasted_sales
    from public.forecast_data f
    where f.location_id = p_location_id and f.date = p_date
    limit 1
  ),
  shift_cost as (
    select coalesce(sum(s.hours * coalesce(s.rate, 0)), 0) as scheduled_labor_cost
    from public.shifts s
    where s.location_id = p_location_id and s.day = p_date
  )
  select p_date as report_date,
         coalesce(fc.forecasted_sales, 0) as forecasted_sales,
         sc.scheduled_labor_cost,
         case when coalesce(fc.forecasted_sales, 0) > 0 then sc.scheduled_labor_cost / fc.forecasted_sales else null end as labor_percent,
         (select labor_cost_goal from goal)
  from shift_cost sc
  left join fc on true;
$$;


ALTER FUNCTION "public"."get_daily_labor_summary"("p_location_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_duplicate_items"() RETURNS TABLE("item_name" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ogi.item_name,
        COUNT(*) as count
    FROM 
        order_guide_items ogi
    GROUP BY 
        ogi.item_name
    HAVING 
        COUNT(*) > 1
    ORDER BY 
        COUNT(*) DESC, ogi.item_name;
END;
$$;


ALTER FUNCTION "public"."get_duplicate_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."get_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_items_by_categories"() RETURNS TABLE("category_id" "uuid", "category_name" "text", "display_name" "text", "display_order" integer, "items" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ogc.id AS category_id,
        ogc.category_name,
        ogc.name AS display_name,
        ogc.display_order,
        COALESCE(
            jsonb_agg(
                CASE WHEN ogi.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', ogi.id,
                        'item_name', ogi.item_name,
                        'pack_size', ogi.pack_size,
                        'uom', ogi.uom,
                        'category', ogi.category,
                        'active', ogi.active
                    )
                ELSE NULL END
            ) FILTER (WHERE ogi.id IS NOT NULL),
            '[]'::jsonb
        ) AS items
    FROM 
        public.order_guide_categories ogc
    LEFT JOIN 
        public.order_guide_items ogi ON ogc.id = ogi.category_id AND ogi.active = true
    GROUP BY
        ogc.id,
        ogc.category_name,
        ogc.name,
        ogc.display_order
    ORDER BY
        ogc.display_order ASC,
        ogc.category_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_items_by_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_items_by_category"("p_category_id" bigint) RETURNS TABLE("item_id" bigint, "item_name" "text", "item_code" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id AS item_id,
        i.item_name,
        i.item_code
    FROM 
        order_guide_items i
    WHERE 
        i.category_id = p_category_id
    ORDER BY
        i.item_name;
END;
$$;


ALTER FUNCTION "public"."get_items_by_category"("p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_items_by_category"("p_category_id" "uuid") RETURNS TABLE("id" "uuid", "item_name" "text", "pack_size" "text", "uom" "text", "category_id" "uuid", "category" "text", "active" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ogi.id,
        ogi.item_name,
        ogi.pack_size,
        ogi.uom,
        ogi.category_id,
        ogi.category,
        ogi.active,
        ogi.created_at,
        ogi.updated_at
    FROM 
        public.order_guide_items ogi
    WHERE 
        ogi.category_id = p_category_id
        AND ogi.active = true
    ORDER BY
        ogi.item_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_items_by_category"("p_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_month_rollup"("p_location_id" "uuid", "p_as_of" timestamp with time zone) RETURNS TABLE("month" "date", "location_id" "uuid", "total_forecast_sales" numeric, "total_actual_sales" numeric, "actual_food_cost" numeric, "forecasted_food_cost" numeric, "actual_bev_cost" numeric, "forecasted_bev_cost" numeric, "actual_labor_cost" numeric, "forecasted_labor_cost" numeric, "variance_sales_dollar" numeric, "variance_sales_percent" numeric, "variance_food_cost_dollar" numeric, "variance_bev_cost_dollar" numeric, "variance_labor_cost_dollar" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
with bounds as (
  select date_trunc('month', p_as_of)::date - interval '1 month' as month_start,
         date_trunc('month', p_as_of)::date                        as next_month_start
), src as (
  select d.*
  from public.fva_daily_history d
  join bounds b on d.date >= b.month_start and d.date < b.next_month_start
  where (p_location_id is null or d.location_id = p_location_id)
)
select
  (select month_start from bounds)::date as month,
  s.location_id,
  sum(s.forecast_sales) as total_forecast_sales,
  sum(s.actual_sales)   as total_actual_sales,
  sum(s.actual_sales * coalesce(s.food_cost_pct, 0))  as actual_food_cost,
  sum(s.forecast_sales * coalesce(s.food_cost_pct, 0)) as forecasted_food_cost,
  sum(s.actual_sales * coalesce(s.bev_cost_pct, 0))   as actual_bev_cost,
  sum(s.forecast_sales * coalesce(s.bev_cost_pct, 0)) as forecasted_bev_cost,
  sum(s.actual_sales * coalesce(s.labor_cost_pct, 0)) as actual_labor_cost,
  sum(s.forecast_sales * coalesce(s.labor_cost_pct, 0)) as forecasted_labor_cost,
  sum(coalesce(s.actual_sales,0) - coalesce(s.forecast_sales,0)) as variance_sales_dollar,
  case when sum(coalesce(s.forecast_sales,0)) > 0 then
    sum(coalesce(s.actual_sales,0) - coalesce(s.forecast_sales,0)) / sum(coalesce(s.forecast_sales,0))
  else null end as variance_sales_percent,
  sum((coalesce(s.actual_sales,0) * coalesce(s.food_cost_pct,0)) - (coalesce(s.forecast_sales,0) * coalesce(s.food_cost_pct,0))) as variance_food_cost_dollar,
  sum((coalesce(s.actual_sales,0) * coalesce(s.bev_cost_pct,0)) - (coalesce(s.forecast_sales,0) * coalesce(s.bev_cost_pct,0))) as variance_bev_cost_dollar,
  sum((coalesce(s.actual_sales,0) * coalesce(s.labor_cost_pct,0)) - (coalesce(s.forecast_sales,0) * coalesce(s.labor_cost_pct,0))) as variance_labor_cost_dollar
from src s
group by s.location_id
order by s.location_id nulls last;
$$;


ALTER FUNCTION "public"."get_last_month_rollup"("p_location_id" "uuid", "p_as_of" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") RETURNS TABLE("month_start" "date", "days_in_month" integer, "days_elapsed" integer, "mtd_forecast_sales" numeric, "mtd_scheduled_labor_cost" numeric, "mtd_labor_percent" numeric, "eom_projected_sales" numeric, "eom_projected_labor_cost" numeric, "eom_projected_labor_percent" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with params as (
    select date_trunc('month', p_month)::date as ms,
           (date_trunc('month', p_month) + interval '1 month - 1 day')::date as me,
           least((date_trunc('month', p_month) + interval '1 month - 1 day')::date,
                 greatest(date_trunc('month', p_month)::date, current_date)) as today
  ),
  days as (
    select generate_series((select ms from params), (select me from params), interval '1 day')::date as d
  ),
  fc as (
    select d.d as day,
           coalesce(f.forecast_total::numeric, 0) as forecast_sales
    from days d
    left join public.forecast_data f on f.location_id = p_location_id and f.date = d.d
  ),
  sc as (
    select s.day as day, coalesce(sum(s.hours * coalesce(s.rate,0)),0) as scheduled_cost
    from public.shifts s
    where s.location_id = p_location_id and s.day between (select ms from params) and (select me from params)
    group by s.day
  ),
  mtd as (
    select sum(fc.forecast_sales) as mtd_fc,
           sum(coalesce(sc.scheduled_cost,0)) as mtd_cost
    from fc
    left join sc on sc.day = fc.day
    where fc.day <= (select today from params)
  ),
  month_totals as (
    select sum(fc.forecast_sales) as month_fc,
           sum(coalesce(sc.scheduled_cost,0)) as month_cost
    from fc
    left join sc on sc.day = fc.day
  )
  select (select ms from params) as month_start,
         extract(day from (select me from params))::int as days_in_month,
         (((select today from params) - (select ms from params)) + 1) as days_elapsed,
         coalesce((select mtd_fc from mtd),0) as mtd_forecast_sales,
         coalesce((select mtd_cost from mtd),0) as mtd_scheduled_labor_cost,
         case when (select mtd_fc from mtd) > 0 then (select mtd_cost from mtd) / (select mtd_fc from mtd) else null end as mtd_labor_percent,
         coalesce((select month_fc from month_totals),0) as eom_projected_sales,
         coalesce((select month_cost from month_totals),0) as eom_projected_labor_cost,
         case when (select month_fc from month_totals) > 0 then (select month_cost from month_totals) / (select month_fc from month_totals) else null end as eom_projected_labor_percent;
$$;


ALTER FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") IS '-- DEPRECATED: Use get_mtd_fva_v2 instead



CREATE OR REPLACE FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") RETURNS TABLE("total_sales" numeric, "foh_labor_cost" numeric, "boh_labor_cost" numeric, "total_labor_cost" numeric, "foh_labor_pct" numeric, "boh_labor_pct" numeric, "total_labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with bounds as (
    select date_trunc('month', p_month_date)::date as d0, p_month_date::date as d1
  ), labor as (
    select s.location_id, s.day as date,
           sum(case when s.department='FOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as foh_cost,
           sum(case when s.department='BOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as boh_cost,
           sum(coalesce(s.hours,0)*coalesce(s.rate,0)) as total_cost
    from public.shifts s, bounds b
    where s.location_id = p_location_id
      and s.day between b.d0 and b.d1
    group by 1,2
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(l.foh_cost)::numeric as foh_labor_cost,
    sum(l.boh_cost)::numeric as boh_labor_cost,
    sum(l.total_cost)::numeric as total_labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(l.foh_cost) * 100 / sum(f.actual_sales), 1) else null end as foh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.boh_cost) * 100 / sum(f.actual_sales), 1) else null end as boh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.total_cost) * 100 / sum(f.actual_sales), 1) else null end as total_labor_pct
  from public.fva_dashboard_data f
  left join labor l using (location_id, date)
  where f.location_id = p_location_id
    and f.date between (select d0 from bounds) and (select d1 from bounds)
$$;


ALTER FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") IS '-- DEPRECATED: Use get_mtd_fva_split_v2 instead



CREATE OR REPLACE FUNCTION "public"."get_mtd_fva_split_v2"("p_location_id" "uuid", "p_month_date" "date") RETURNS TABLE("total_sales" numeric, "foh_labor_cost" numeric, "boh_labor_cost" numeric, "total_labor_cost" numeric, "foh_labor_pct" numeric, "boh_labor_pct" numeric, "total_labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with bounds as (
    select date_trunc('month', p_month_date)::date as d0, p_month_date::date as d1
  ), locs as (
    select p_location_id as location_id where p_location_id is not null
    union all
    select l.location_id from public.current_user_location_ids() l where p_location_id is null
  ), labor as (
    select s.location_id, s.day as date,
           sum(case when s.department='FOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as foh_cost,
           sum(case when s.department='BOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as boh_cost,
           sum(coalesce(s.hours,0)*coalesce(s.rate,0)) as total_cost
    from public.shifts s
    join locs on s.location_id = locs.location_id
    join bounds b on true
    where s.day between b.d0 and b.d1
    group by s.location_id, s.day
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(l.foh_cost)::numeric as foh_labor_cost,
    sum(l.boh_cost)::numeric as boh_labor_cost,
    sum(l.total_cost)::numeric as total_labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(l.foh_cost) * 100 / sum(f.actual_sales), 1) else null end as foh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.boh_cost) * 100 / sum(f.actual_sales), 1) else null end as boh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.total_cost) * 100 / sum(f.actual_sales), 1) else null end as total_labor_pct
  from public.fva_dashboard_data f
  join locs on f.location_id = locs.location_id
  join bounds b on true
  left join labor l on l.location_id = f.location_id and l.date = f.date
  where f.date between b.d0 and b.d1
$$;


ALTER FUNCTION "public"."get_mtd_fva_split_v2"("p_location_id" "uuid", "p_month_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mtd_fva_v2"("p_location_id" "uuid", "p_month_date" "date") RETURNS TABLE("total_sales" numeric, "food_cost" numeric, "bev_cost" numeric, "labor_cost" numeric, "food_pct" numeric, "bev_pct" numeric, "labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with bounds as (
    select date_trunc('month', p_month_date)::date as d0, p_month_date::date as d1
  ), locs as (
    select p_location_id as location_id where p_location_id is not null
    union all
    select l.location_id from public.current_user_location_ids() l where p_location_id is null
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(f.actual_food_cost)::numeric as food_cost,
    sum(f.actual_beverage_cost)::numeric as bev_cost,
    sum(f.actual_labor_cost)::numeric as labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_food_cost) * 100 / sum(f.actual_sales), 1) else null end as food_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_beverage_cost) * 100 / sum(f.actual_sales), 1) else null end as bev_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_labor_cost) * 100 / sum(f.actual_sales), 1) else null end as labor_pct
  from public.fva_dashboard_data f
  join locs on f.location_id = locs.location_id
  join bounds b on true
  where f.date between b.d0 and b.d1
$$;


ALTER FUNCTION "public"."get_mtd_fva_v2"("p_location_id" "uuid", "p_month_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_guide_categorization_stats"() RETURNS TABLE("total_items" bigint, "categorized_items" bigint, "uncategorized_items" bigint, "categorization_percentage" numeric, "total_categories" bigint, "total_keywords" bigint, "categories_with_keywords" bigint, "categories_without_keywords" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(i.id) AS total_items,
            COUNT(i.category_id) AS categorized_items,
            COUNT(i.id) FILTER (WHERE i.category_id IS NULL) AS uncategorized_items,
            COUNT(DISTINCT c.id) AS total_categories,
            COUNT(DISTINCT k.category_id) AS categories_with_keywords,
            COUNT(DISTINCT k.id) AS total_keywords
        FROM
            order_guide_items i
        CROSS JOIN
            order_guide_categories c
        LEFT JOIN
            order_guide_category_keywords k ON TRUE
    )
    SELECT
        s.total_items,
        s.categorized_items,
        s.uncategorized_items,
        CASE WHEN s.total_items > 0 
            THEN ROUND((s.categorized_items::NUMERIC / s.total_items) * 100, 2)
            ELSE 0
        END AS categorization_percentage,
        s.total_categories,
        s.total_keywords,
        s.categories_with_keywords,
        s.total_categories - s.categories_with_keywords AS categories_without_keywords
    FROM
        stats s;
END;
$$;


ALTER FUNCTION "public"."get_order_guide_categorization_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_guide_category_summary"() RETURNS TABLE("category_id" bigint, "category_name" "text", "item_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Start with items that have categories
    RETURN QUERY
    SELECT 
        c.id AS category_id,
        c.category_name,
        COUNT(i.id)::INTEGER AS item_count
    FROM 
        order_guide_categories c
    LEFT JOIN 
        order_guide_items i ON c.id = i.category_id
    GROUP BY 
        c.id, c.category_name
    
    UNION ALL
    
    -- Add uncategorized items as a special "category"
    SELECT 
        NULL::BIGINT AS category_id,
        'Uncategorized'::TEXT AS category_name,
        COUNT(i.id)::INTEGER AS item_count
    FROM 
        order_guide_items i
    WHERE 
        i.category_id IS NULL
    
    ORDER BY
        category_name = 'Uncategorized' ASC,  -- Put "Uncategorized" at the bottom
        item_count DESC,
        category_name;
END;
$$;


ALTER FUNCTION "public"."get_order_guide_category_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_suggested_category"("p_item_name" "text", "p_vendor" "text", "p_brand" "text", "p_distributor" "text") RETURNS TABLE("category_id" integer, "category_name" "text", "confidence_score" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH item_words AS (
        SELECT regexp_split_to_table(
            lower(
                concat_ws(' ', 
                    p_item_name, 
                    COALESCE(p_vendor, ''), 
                    COALESCE(p_brand, ''),
                    COALESCE(p_distributor, '')
                )
            ), 
            '[^a-zA-Z0-9]+'
        ) AS word
        WHERE length(regexp_split_to_table(
            lower(
                concat_ws(' ', 
                    p_item_name, 
                    COALESCE(p_vendor, ''), 
                    COALESCE(p_brand, ''),
                    COALESCE(p_distributor, '')
                )
            ), 
            '[^a-zA-Z0-9]+'
        )) > 2
    )
    SELECT 
        c.id AS category_id, 
        c.category_name,
        COUNT(*) AS confidence_score
    FROM 
        order_guide_categories c
    JOIN 
        order_guide_category_keywords k ON c.id = k.category_id
    JOIN 
        item_words iw ON lower(k.keyword) = iw.word
    GROUP BY 
        c.id, c.category_name
    ORDER BY 
        confidence_score DESC, c.category_name
    LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."get_suggested_category"("p_item_name" "text", "p_vendor" "text", "p_brand" "text", "p_distributor" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_guide_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_name" "text" NOT NULL,
    "name" "text",
    "category" "text",
    "forecast" numeric,
    "actual" numeric,
    "variance" numeric,
    "unit" "text",
    "status" "text",
    "cost_per_unit" numeric(12,2),
    "vendor" "text",
    "category_id" integer,
    "par_level" numeric,
    "location_id" "uuid",
    "description" "text",
    "sku" "text",
    "unit_cost" numeric(10,2),
    "category_rank" integer,
    "brand" "text" DEFAULT ''::"text",
    "distributor" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "item_name_not_blank" CHECK (("regexp_replace"("item_name", '[\s\u00A0]+'::"text", ''::"text", 'g'::"text") <> ''::"text")),
    CONSTRAINT "order_guide_items_category_rank_nonnegative" CHECK (("category_rank" >= 0))
);


ALTER TABLE "public"."order_guide_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_uncategorized_order_guide_items"() RETURNS SETOF "public"."order_guide_items"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM order_guide_items i
    WHERE i.category_id IS NULL
    ORDER BY i.name;
END;
$$;


ALTER FUNCTION "public"."get_uncategorized_order_guide_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weekly_order_guide"("p_guide_id" "uuid") RETURNS TABLE("category_id" "uuid", "category_name" "text", "display_name" "text", "display_order" integer, "items" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ogc.id AS category_id,
        ogc.category_name,
        ogc.name AS display_name,
        ogc.display_order,
        COALESCE(
            jsonb_agg(
                CASE WHEN ogi.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', ogi.id,
                        'item_name', ogi.item_name,
                        'pack_size', ogi.pack_size,
                        'uom', ogi.uom,
                        'category', ogi.category,
                        'quantity', wogi.quantity,
                        'active', ogi.active
                    )
                ELSE NULL END
                ORDER BY ogi.item_name ASC
            ) FILTER (WHERE ogi.id IS NOT NULL),
            '[]'::jsonb
        ) AS items
    FROM 
        public.order_guide_categories ogc
    LEFT JOIN 
        public.order_guide_items ogi ON ogc.id = ogi.category_id AND ogi.active = true
    LEFT JOIN
        public.weekly_order_guide_items wogi ON ogi.id = wogi.order_guide_item_id AND wogi.weekly_order_guide_id = p_guide_id
    WHERE
        EXISTS (
            SELECT 1 FROM public.weekly_order_guide_items 
            JOIN public.order_guide_items ON order_guide_items.id = weekly_order_guide_items.order_guide_item_id
            WHERE weekly_order_guide_items.weekly_order_guide_id = p_guide_id
            AND order_guide_items.category_id = ogc.id
        )
    GROUP BY
        ogc.id,
        ogc.category_name,
        ogc.name,
        ogc.display_order
    ORDER BY
        ogc.display_order ASC,
        ogc.category_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_weekly_order_guide"("p_guide_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_yesterday_actual_sales"("briefing_date" "date", "p_location_id" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  /*
    Returns yesterday's actual_sales for a given location relative to the supplied briefing_date (UTC-date).
    RLS is respected via security invoker. If no row is found, returns 0.
  */
  with target_date as (
    select (briefing_date - interval '1 day')::date as d
  )
  select coalesce((
    select f.actual_sales::numeric
    from public.fva_daily_history f
    join target_date t on f.date = t.d
    where f.location_id = p_location_id
    limit 1
  ), 0::numeric);
$$;


ALTER FUNCTION "public"."get_yesterday_actual_sales"("briefing_date" "date", "p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") RETURNS TABLE("total_sales" numeric, "food_cost" numeric, "bev_cost" numeric, "labor_cost" numeric, "food_pct" numeric, "bev_pct" numeric, "labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(f.actual_food_cost)::numeric as food_cost,
    sum(f.actual_beverage_cost)::numeric as bev_cost,
    sum(f.actual_labor_cost)::numeric as labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_food_cost) * 100 / sum(f.actual_sales), 1) else null end as food_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_beverage_cost) * 100 / sum(f.actual_sales), 1) else null end as bev_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_labor_cost) * 100 / sum(f.actual_sales), 1) else null end as labor_pct
  from public.fva_dashboard_data f
  where f.location_id = $1
    and f.date between date_trunc('year', $2)::date and $2
$_$;


ALTER FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") IS '-- DEPRECATED: Use get_ytd_fva_v3 instead



CREATE OR REPLACE FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") RETURNS TABLE("total_sales" numeric, "foh_labor_cost" numeric, "boh_labor_cost" numeric, "total_labor_cost" numeric, "foh_labor_pct" numeric, "boh_labor_pct" numeric, "total_labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with labor as (
    select s.location_id, s.day as date,
           sum(case when s.department='FOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as foh_cost,
           sum(case when s.department='BOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as boh_cost,
           sum(coalesce(s.hours,0)*coalesce(s.rate,0)) as total_cost
    from public.shifts s
    where s.location_id = p_location_id
      and s.day between date_trunc('year', p_as_of)::date and p_as_of
    group by 1,2
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(l.foh_cost)::numeric as foh_labor_cost,
    sum(l.boh_cost)::numeric as boh_labor_cost,
    sum(l.total_cost)::numeric as total_labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(l.foh_cost) * 100 / sum(f.actual_sales), 1) else null end as foh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.boh_cost) * 100 / sum(f.actual_sales), 1) else null end as boh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.total_cost) * 100 / sum(f.actual_sales), 1) else null end as total_labor_pct
  from public.fva_dashboard_data f
  left join labor l using (location_id, date)
  where f.location_id = p_location_id
    and f.date between date_trunc('year', p_as_of)::date and p_as_of
$$;


ALTER FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") IS '-- DEPRECATED: Use get_ytd_fva_split_v2 instead



CREATE OR REPLACE FUNCTION "public"."get_ytd_fva_split_v2"("p_location_id" "uuid", "p_as_of" "date") RETURNS TABLE("total_sales" numeric, "foh_labor_cost" numeric, "boh_labor_cost" numeric, "total_labor_cost" numeric, "foh_labor_pct" numeric, "boh_labor_pct" numeric, "total_labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with locs as (
    select p_location_id as location_id where p_location_id is not null
    union all
    select l.location_id from public.current_user_location_ids() l where p_location_id is null
  ), labor as (
    select s.location_id, s.day as date,
           sum(case when s.department='FOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as foh_cost,
           sum(case when s.department='BOH' then coalesce(s.hours,0)*coalesce(s.rate,0) else 0 end) as boh_cost,
           sum(coalesce(s.hours,0)*coalesce(s.rate,0)) as total_cost
    from public.shifts s
    join locs on s.location_id = locs.location_id
    where s.day between date_trunc('year', p_as_of)::date and p_as_of
    group by s.location_id, s.day
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(l.foh_cost)::numeric as foh_labor_cost,
    sum(l.boh_cost)::numeric as boh_labor_cost,
    sum(l.total_cost)::numeric as total_labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(l.foh_cost) * 100 / sum(f.actual_sales), 1) else null end as foh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.boh_cost) * 100 / sum(f.actual_sales), 1) else null end as boh_labor_pct,
    case when sum(f.actual_sales) > 0 then round(sum(l.total_cost) * 100 / sum(f.actual_sales), 1) else null end as total_labor_pct
  from public.fva_dashboard_data f
  join locs on f.location_id = locs.location_id
  left join labor l on l.location_id = f.location_id and l.date = f.date
  where f.date between date_trunc('year', p_as_of)::date and p_as_of
$$;


ALTER FUNCTION "public"."get_ytd_fva_split_v2"("p_location_id" "uuid", "p_as_of" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ytd_fva_v2"("p_location_id" "uuid", "p_as_of" "date") RETURNS TABLE("total_sales" numeric, "food_cost" numeric, "bev_cost" numeric, "labor_cost" numeric, "food_pct" numeric, "bev_pct" numeric, "labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with locs as (
    select case when p_location_id is not null then p_location_id else null end as location_id
    union all
    select l.location_id from public.current_user_location_ids() l where p_location_id is null
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(f.actual_food_cost)::numeric as food_cost,
    sum(f.actual_beverage_cost)::numeric as bev_cost,
    sum(f.actual_labor_cost)::numeric as labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_food_cost) * 100 / sum(f.actual_sales), 1) else null end as food_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_beverage_cost) * 100 / sum(f.actual_sales), 1) else null end as bev_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_labor_cost) * 100 / sum(f.actual_sales), 1) else null end as labor_pct
  from public.fva_dashboard_data f
  join locs on f.location_id = locs.location_id
  where f.date between date_trunc('year', p_as_of)::date and p_as_of
$$;


ALTER FUNCTION "public"."get_ytd_fva_v2"("p_location_id" "uuid", "p_as_of" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ytd_fva_v3"("p_location_id" "uuid", "p_as_of" "date") RETURNS TABLE("total_sales" numeric, "food_cost" numeric, "bev_cost" numeric, "labor_cost" numeric, "food_pct" numeric, "bev_pct" numeric, "labor_pct" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  with locs as (
    select p_location_id as location_id where p_location_id is not null
    union all
    select l.location_id from public.current_user_location_ids() l where p_location_id is null
  )
  select
    sum(f.actual_sales)::numeric as total_sales,
    sum(f.actual_food_cost)::numeric as food_cost,
    sum(f.actual_beverage_cost)::numeric as bev_cost,
    sum(f.actual_labor_cost)::numeric as labor_cost,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_food_cost) * 100 / sum(f.actual_sales), 1) else null end as food_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_beverage_cost) * 100 / sum(f.actual_sales), 1) else null end as bev_pct,
    case when sum(f.actual_sales) > 0 then round(sum(f.actual_labor_cost) * 100 / sum(f.actual_sales), 1) else null end as labor_pct
  from public.fva_dashboard_data f
  join locs on f.location_id = locs.location_id
  where f.date between date_trunc('year', p_as_of)::date and p_as_of
$$;


ALTER FUNCTION "public"."get_ytd_fva_v3"("p_location_id" "uuid", "p_as_of" "date") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_guide_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "location_id" "uuid",
    "item_name" "text",
    "item_id" "uuid",
    "on_hand" numeric,
    "par_level" numeric
);


ALTER TABLE "public"."order_guide_status" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_guide_status" IS 'Stores item status info by location for the order guide (e.g. on track, low, missing).';



CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") RETURNS "public"."order_guide_status"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  inserted_row public.order_guide_status;
begin
  perform set_config('app.current_location', p_location_id::text, true);

  insert into public.order_guide_status (
    location_id, item_id, forecast, actual, unit
  )
  values (
    p_location_id, p_item_id, p_forecast, p_actual, p_unit
  )
  returning * into inserted_row;

  return inserted_row;
end;
$$;


ALTER FUNCTION "public"."insert_order_guide_status"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status"("_location_id" "uuid", "_item_id" "uuid", "_item_name" "text", "_on_hand" numeric, "_par_level" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  _id uuid;
begin
  insert into public.order_guide_status (
    location_id, item_id, item_name, on_hand, par_level
  ) values (
    _location_id, _item_id, _item_name, _on_hand, _par_level
  )
  returning id into _id;
  return _id;
end;
$$;


ALTER FUNCTION "public"."insert_order_guide_status"("_location_id" "uuid", "_item_id" "uuid", "_item_name" "text", "_on_hand" numeric, "_par_level" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rowcount integer;
BEGIN
  INSERT INTO public.order_guide_items (id, actual, forecast, unit, location_id, item_name)
  VALUES (item_id, actual, forecast, unit, location_id, item_name)
  ON CONFLICT (id)
  DO UPDATE SET
    item_name = EXCLUDED.item_name,
    unit = EXCLUDED.unit,
    actual = EXCLUDED.actual,
    forecast = EXCLUDED.forecast,
    archived = false,
    updated_at = now()
  WHERE order_guide_items.location_id = EXCLUDED.location_id;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  IF v_rowcount = 0 THEN
    RAISE EXCEPTION 'Upsert blocked: item % exists for a different location_id. Cross-location updates are not allowed.', item_id
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;


ALTER FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rowcount integer;
BEGIN
  INSERT INTO public.order_guide_items (
    id, actual, forecast, unit, location_id, item_name, category
  )
  VALUES (
    item_id, actual, forecast, unit, location_id, item_name, category
  )
  ON CONFLICT ON CONSTRAINT order_guide_items_item_cat_unit_key
  DO UPDATE SET
    item_name  = EXCLUDED.item_name,
    category   = EXCLUDED.category,
    unit       = EXCLUDED.unit,
    actual     = EXCLUDED.actual,
    forecast   = EXCLUDED.forecast,
    archived   = false,
    updated_at = now()
  WHERE order_guide_items.location_id = EXCLUDED.location_id;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  IF v_rowcount = 0 THEN
    RAISE EXCEPTION 'Upsert blocked: existing item with same (item_name, category, unit) belongs to a different location_id. Cross-location updates are not allowed.'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;


ALTER FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") IS 'schema touch 2025-09-11 14:20:36.073313+00';



CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status"("loc_id" "uuid", "item_id" "uuid", "forecast" numeric, "actual" numeric, "unit" "text", "item_name" "text" DEFAULT NULL::"text", "category" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  _id uuid;
begin
  insert into public.order_guide_status as s (
    id, location_id, item_id, item_name, on_hand, par_level
  ) values (
    gen_random_uuid(), loc_id, item_id, coalesce(item_name, ''), actual, forecast
  )
  on conflict (location_id, item_id) do update
    set on_hand = excluded.on_hand,
        par_level = excluded.par_level,
        item_name = excluded.item_name,
        updated_at = now()
  returning s.id into _id;

  -- also ensure the base item exists with unit/category
  update public.order_guide_items i
     set unit = coalesce(nullif(unit, ''), i.unit),
         category = coalesce(nullif(category, ''), i.category)
   where i.id = item_id;

  return _id;
end;
$$;


ALTER FUNCTION "public"."insert_order_guide_status"("loc_id" "uuid", "item_id" "uuid", "forecast" numeric, "actual" numeric, "unit" "text", "item_name" "text", "category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_order_guide_status_v2"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") RETURNS "public"."order_guide_status"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  inserted_row public.order_guide_status;
begin
  perform set_config('app.current_location', p_location_id::text, true);

  insert into public.order_guide_status (
    location_id, item_id, forecast, actual, unit
  )
  values (
    p_location_id, p_item_id, p_forecast, p_actual, p_unit
  )
  returning * into inserted_row;

  return inserted_row;
end;
$$;


ALTER FUNCTION "public"."insert_order_guide_status_v2"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_keywords_to_og_categories"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  migrated_rows INTEGER := 0;
  old_cat RECORD;
  new_cat_id INTEGER;
  affected INTEGER;
BEGIN
  -- For each old category
  FOR old_cat IN SELECT id, name FROM order_guide_categories LOOP
    -- Check if this category exists in og_categories
    SELECT id INTO new_cat_id FROM og_categories WHERE name = old_cat.name;
    
    -- If not, create it
    IF new_cat_id IS NULL THEN
      INSERT INTO og_categories (name) VALUES (old_cat.name)
      RETURNING id INTO new_cat_id;
    END IF;
    
    -- Update keywords to point to the new category id
    WITH updated AS (
      UPDATE order_guide_category_keywords
      SET category_id = new_cat_id
      WHERE category_id = old_cat.id
      RETURNING *
    )
    SELECT COUNT(*) INTO affected FROM updated;
    
    migrated_rows := migrated_rows + affected;
  END LOOP;
  
  RETURN migrated_rows;
END;
$$;


ALTER FUNCTION "public"."migrate_keywords_to_og_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_order_guide_item"("source_location_id" "uuid", "target_location_id" "uuid") RETURNS TABLE("migration_status" "text", "migrated_item_name" "text", "migration_action" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    source_item RECORD;
    target_exists BOOLEAN;
    unique_suffix TEXT := '_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
BEGIN
    FOR source_item IN
        SELECT * FROM order_guide_items
        WHERE location_id = source_location_id
        AND status = 'active'
    LOOP
        -- Check if the item already exists in the target location
        SELECT EXISTS(
            SELECT 1 FROM order_guide_items
            WHERE location_id = target_location_id
            AND item_name = source_item.item_name
            AND category_id = source_item.category_id
        ) INTO target_exists;
        
        IF target_exists THEN
            -- Item exists, decide what to do
            -- For now, we'll update the existing item
            UPDATE order_guide_items
            SET
                unit = source_item.unit,
                par_level = source_item.par_level,
                unit_cost = source_item.unit_cost,
                forecast = source_item.forecast,
                vendor = source_item.vendor,
                description = source_item.description
            WHERE
                location_id = target_location_id
                AND item_name = source_item.item_name
                AND category_id = source_item.category_id;
                
            migration_status := 'Updated';
            migrated_item_name := source_item.item_name;
            migration_action := 'Updated existing item';
        ELSE
            -- Item doesn't exist, insert new
            INSERT INTO order_guide_items (
                item_name,
                category_id,
                location_id,
                unit,
                par_level,
                status,
                unit_cost,
                forecast,
                vendor,
                description
            ) VALUES (
                source_item.item_name,
                source_item.category_id,
                target_location_id,
                source_item.unit,
                source_item.par_level,
                source_item.status,
                source_item.unit_cost,
                source_item.forecast,
                source_item.vendor,
                source_item.description
            );
            
            migration_status := 'Inserted';
            migrated_item_name := source_item.item_name;
            migration_action := 'Added new item';
        END IF;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."migrate_order_guide_item"("source_location_id" "uuid", "target_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_manual_additions_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.manual_additions
  set is_active = false
  where id = OLD.id;
  return null;
end;
$$;


ALTER FUNCTION "public"."prevent_manual_additions_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preview_keyword_categorization"("p_category_id" bigint, "p_keyword" "text") RETURNS TABLE("item_id" bigint, "item_name" "text", "current_category_id" bigint, "current_category_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id AS item_id,
        i.item_name,
        i.category_id AS current_category_id,
        c.name AS current_category_name
    FROM 
        order_guide_items i
    LEFT JOIN 
        order_guide_categories c ON i.category_id = c.id
    WHERE 
        i.item_name ILIKE '%' || p_keyword || '%'
        AND (i.category_id IS NULL OR i.category_id != p_category_id);
END;
$$;


ALTER FUNCTION "public"."preview_keyword_categorization"("p_category_id" bigint, "p_keyword" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."profiles_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recategorize_all_order_guide_items"() RETURNS TABLE("updated_count" integer, "uncategorized_count" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_uncategorized_count INTEGER := 0;
BEGIN
    -- Count items with no category initially
    SELECT COUNT(*) INTO v_uncategorized_count
    FROM order_guide_items
    WHERE category_id IS NULL;
    
    -- Update items based on keywords
    WITH item_matches AS (
        SELECT 
            i.id AS item_id,
            k.category_id,
            i.category_id AS current_category_id,
            ROW_NUMBER() OVER (
                PARTITION BY i.id 
                ORDER BY LENGTH(k.keyword) DESC
            ) AS match_rank
        FROM 
            order_guide_items i
        JOIN 
            order_guide_category_keywords k ON i.item_name ILIKE '%' || k.keyword || '%'
        WHERE 
            i.category_id IS NULL OR i.category_id != k.category_id
    ),
    to_update AS (
        SELECT 
            item_id, 
            category_id
        FROM 
            item_matches
        WHERE 
            match_rank = 1
    )
    UPDATE order_guide_items i
    SET 
        category_id = u.category_id,
        updated_at = NOW()
    FROM 
        to_update u
    WHERE 
        i.id = u.item_id;
    
    -- Get count of updated rows
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Return results
    RETURN QUERY SELECT v_updated_count, v_uncategorized_count;
END;
$$;


ALTER FUNCTION "public"."recategorize_all_order_guide_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recategorize_order_guide_item"("p_item_id" bigint, "p_category_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    UPDATE order_guide_items
    SET category_id = p_category_id,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- Check if update was successful
    IF FOUND THEN
        v_success := TRUE;
    END IF;
    
    RETURN v_success;
END;
$$;


ALTER FUNCTION "public"."recategorize_order_guide_item"("p_item_id" bigint, "p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recategorize_order_guide_item_v1"("p_item_id" "uuid", "p_category_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    -- Remove updated_at since it doesn't exist in the table
    UPDATE order_guide_items
    SET category_id = p_category_id
    WHERE id = p_item_id;
    
    -- Check if update was successful
    IF FOUND THEN
        v_success := TRUE;
    END IF;
    
    RETURN v_success;
END;
$$;


ALTER FUNCTION "public"."recategorize_order_guide_item_v1"("p_item_id" "uuid", "p_category_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rollup_fva_all_for_day"("p_day" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  l_id uuid;
begin
  for l_id in select id from public.locations loop
    perform public.rollup_fva_daily(p_day, l_id);
  end loop;
end;
$$;


ALTER FUNCTION "public"."rollup_fva_all_for_day"("p_day" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rollup_fva_daily"("p_day" "date", "p_location_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  food_total numeric := 0;
  bev_total numeric := 0;
  labor_cost numeric := 0;
  actual_sales numeric := 0;
begin
  -- Total food and beverage purchases for the day
  select coalesce(sum(pi.line_total), 0)
  into food_total
  from public.purchase_items pi
  join public.purchases p on p.id = pi.purchase_id
  where pi.category = 'Food'
    and p.location_id = p_location_id
    and p.invoice_date = p_day;

  select coalesce(sum(pi.line_total), 0)
  into bev_total
  from public.purchase_items pi
  join public.purchases p on p.id = pi.purchase_id
  where pi.category = 'Beverage'
    and p.location_id = p_location_id
    and p.invoice_date = p_day;

  -- Labor cost for the day
  select coalesce(sum(s.hours * s.rate), 0)
  into labor_cost
  from public.shifts s
  where s.location_id = p_location_id
    and s.day = p_day;

  -- New: Use helper function for actual or forecast fallback
  actual_sales := public.get_actual_or_forecast_sales(p_location_id, p_day);

  -- Upsert into FVA dashboard
  insert into public.fva_dashboard_data (
    date, location_id, food_cost, beverage_cost, labor_cost, actual_sales, updated_at
  )
  values (
    p_day, p_location_id, food_total, bev_total, labor_cost, actual_sales, now()
  )
  on conflict (date, location_id) do update
  set food_cost = excluded.food_cost,
      beverage_cost = excluded.beverage_cost,
      labor_cost = excluded.labor_cost,
      actual_sales = excluded.actual_sales,
      updated_at = now();
end;
$$;


ALTER FUNCTION "public"."rollup_fva_daily"("p_day" "date", "p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rollup_fva_daily_all_locations"("target_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  loc uuid;
begin
  for loc in select id from public.locations loop
    perform public.rollup_fva_daily(target_date, loc);
  end loop;
end;
$$;


ALTER FUNCTION "public"."rollup_fva_daily_all_locations"("target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_categorization"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  before_count INTEGER;
  after_count INTEGER;
  total_count INTEGER;
  categorized_count INTEGER;
  start_time TIMESTAMP;
BEGIN
  -- Record start time for duration tracking
  start_time := clock_timestamp();
  
  -- Count uncategorized items before
  SELECT COUNT(*) INTO before_count 
  FROM og_items 
  WHERE category_id IS NULL;
  
  -- Count total items
  SELECT COUNT(*) INTO total_count FROM og_items;
  
  -- Run the categorization logic
  UPDATE og_items
  SET category_id = (
    SELECT c.id
    FROM og_categories c
    JOIN og_category_keywords k ON c.id = k.category_id
    WHERE og_items.name ILIKE '%' || k.keyword || '%'
    LIMIT 1
  )
  WHERE category_id IS NULL;
  
  -- Count uncategorized items after
  SELECT COUNT(*) INTO after_count 
  FROM og_items 
  WHERE category_id IS NULL;
  
  -- Calculate how many were categorized
  categorized_count := before_count - after_count;
  
  -- Log the results
  INSERT INTO og_categorization_logs (
    run_type,
    total_items,
    newly_categorized,
    uncategorized_remaining,
    percent_uncategorized,
    run_duration_ms
  ) VALUES (
    'manual',
    total_count,
    categorized_count,
    after_count,
    CASE 
      WHEN total_count > 0 THEN ROUND(after_count * 100.0 / total_count, 2)
      ELSE 0
    END,
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER
  );
  
  -- Return the number of newly categorized items
  RETURN categorized_count;
END;
$$;


ALTER FUNCTION "public"."run_categorization"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_fetch_weather"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform net.http_post(
    url := 'https://rejhbsmfcueudfbhadgh.supabase.co/functions/v1/fetch_weather',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your_anon_or_service_key',
      'Content-Type', 'application/json'
    ),
    body := '{}'
  );
end;
$$;


ALTER FUNCTION "public"."run_fetch_weather"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_fetch_weather_for_timezone"("target_timezone" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  loc_id uuid;
begin
  for loc_id in
    select id from store_locations where timezone = target_timezone
  loop
    perform public.get_and_store_weather(loc_id);
  end loop;
end;
$$;


ALTER FUNCTION "public"."run_fetch_weather_for_timezone"("target_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_scheduled_categorization"("trigger_source" "text" DEFAULT 'scheduled'::"text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  before_count INTEGER;
  after_count INTEGER;
  total_count INTEGER;
  categorized_count INTEGER;
  start_time TIMESTAMP;
BEGIN
  -- Record start time for duration tracking
  start_time := clock_timestamp();
  
  -- Count uncategorized items before
  SELECT COUNT(*) INTO before_count 
  FROM og_items 
  WHERE category_id IS NULL;
  
  -- Count total items
  SELECT COUNT(*) INTO total_count FROM og_items;
  
  -- Run the categorization (using the existing function)
  categorized_count := run_categorization();
  
  -- Count uncategorized items after
  SELECT COUNT(*) INTO after_count 
  FROM og_items 
  WHERE category_id IS NULL;
  
  -- Log the results (as a scheduled run)
  INSERT INTO og_categorization_logs (
    run_type,
    total_items,
    newly_categorized,
    uncategorized_remaining,
    percent_uncategorized,
    run_duration_ms
  ) VALUES (
    trigger_source, -- could be 'scheduled', 'edge-function', etc.
    total_count,
    categorized_count,
    after_count,
    CASE 
      WHEN total_count > 0 THEN ROUND(after_count * 100.0 / total_count, 2)
      ELSE 0
    END,
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER
  );
  
  -- Return the number of newly categorized items
  RETURN categorized_count;
END;
$$;


ALTER FUNCTION "public"."run_scheduled_categorization"("trigger_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_categorization_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Send notification through Postgres NOTIFY
    PERFORM pg_notify(
        'order_categorization',
        json_build_object(
            'order_id', NEW.id,
            'old_category', OLD.category,
            'new_category', NEW.category,
            'order_number', NEW.order_number,
            'vendor', NEW.vendor,
            'timestamp', now()
        )::text
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."send_categorization_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_location"("loc_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select set_config('app.current_location', loc_id::text, true);
$$;


ALTER FUNCTION "public"."set_current_location"("loc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_location_from_header"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  hdr text := current_setting('request.headers', true)::json->>'x-location-id';
begin
  if hdr is null or hdr = '' then
    perform set_config('app.current_location', '', true);
    return;
  end if;
  perform set_config('app.current_location', hdr, true);
end;
$$;


ALTER FUNCTION "public"."set_current_location_from_header"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_guide_rank"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NEW.category_rank IS NULL OR NEW.category_rank = 0 THEN
    -- Serialize per (location_id, category)
    PERFORM pg_advisory_xact_lock(
      hashtextextended(NEW.location_id::text || '|' || COALESCE(NEW.category, ''), 0)
    );
    SELECT COALESCE(MAX(category_rank) + 1, 1)
    INTO NEW.category_rank
    FROM public.order_guide_items
    WHERE location_id = NEW.location_id
      AND category = NEW.category;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_order_guide_rank"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_order_guide_categories"("location_filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update categories based on category_id relationship
  WITH updated_rows AS (
    UPDATE order_guide_items ogi
    SET category = ogc.category_name
    FROM order_guide_categories ogc
    WHERE 
      ogi.category_id = ogc.id
      AND (ogi.category IS NULL OR ogi.category != ogc.category_name)
      AND CASE 
        WHEN location_filter->>'location_id' IS NOT NULL THEN
          ogi.location_id = (location_filter->>'location_id')::uuid
        ELSE 
          true
      END
    RETURNING ogi.id
  )
  SELECT COUNT(*) INTO updated_count FROM updated_rows;
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."sync_order_guide_categories"("location_filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_order_guide_categories"("location_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("status" "text", "updated_count" integer, "missing_category_id_count" integer, "invalid_category_id_count" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated INT := 0;
  missing INT := 0;
  invalid INT := 0;
BEGIN
  -- 1. Update items with valid category_id but missing/incorrect category name
  UPDATE order_guide_items ogi
  SET category = ogc.category_name
  FROM order_guide_categories ogc
  WHERE 
    ogi.category_id = ogc.id
    AND (ogi.category IS NULL OR ogi.category <> ogc.category_name)
    AND (location_uuid IS NULL OR ogi.location_id = location_uuid);
    
  GET DIAGNOSTICS updated = ROW_COUNT;
  
  -- 2. Count items with NULL category_id
  SELECT COUNT(*) INTO missing
  FROM order_guide_items
  WHERE 
    category_id IS NULL
    AND (location_uuid IS NULL OR location_id = location_uuid);
  
  -- 3. Count items with invalid category_id (doesn't exist in order_guide_categories)
  SELECT COUNT(*) INTO invalid
  FROM order_guide_items ogi
  LEFT JOIN order_guide_categories ogc ON ogi.category_id = ogc.id
  WHERE 
    ogi.category_id IS NOT NULL
    AND ogc.id IS NULL
    AND (location_uuid IS NULL OR ogi.location_id = location_uuid);
    
  RETURN QUERY SELECT 
    'Items updated with correct category names' as status,
    updated as updated_count,
    missing as missing_category_id_count,
    invalid as invalid_category_id_count;
END;
$$;


ALTER FUNCTION "public"."sync_order_guide_categories"("location_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_shifts_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Add search path line below
  SET search_path = ''; -- This line fixes the security issue
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_shifts_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set search path explicitly to empty to prevent schema injection attacks
  SET search_path = '';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_guide_status_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP::timestamp without time zone;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_order_guide_status_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE VIEW "order_guide_system"."v1_order_guide" WITH ("security_invoker"='on') AS
 SELECT "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "i"."id" AS "item_id",
    "i"."name" AS "item_name"
   FROM ("public"."order_guide_categories" "c"
     JOIN "public"."order_guide_items" "i" ON (("c"."id" = "i"."category_id")))
  ORDER BY "c"."name", "i"."name";


ALTER TABLE "order_guide_system"."v1_order_guide" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_additions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid",
    "guide_date" "date" NOT NULL,
    "category" "text" NOT NULL,
    "item_name" "text" NOT NULL,
    "forecast" numeric,
    "unit" "text",
    "is_manual" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."manual_additions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."archived_manual_additions" WITH ("security_invoker"='on') AS
 SELECT "manual_additions"."id",
    "manual_additions"."location_id",
    "manual_additions"."guide_date",
    "manual_additions"."category",
    "manual_additions"."item_name",
    "manual_additions"."forecast",
    "manual_additions"."unit",
    "manual_additions"."is_manual",
    "manual_additions"."created_at",
    "manual_additions"."is_active"
   FROM "public"."manual_additions"
  WHERE (("manual_additions"."is_active" = false) AND (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"));


ALTER TABLE "public"."archived_manual_additions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" integer NOT NULL,
    "category_name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categories_id_seq" OWNED BY "public"."categories"."id";



CREATE TABLE IF NOT EXISTS "public"."categorization_logs" (
    "id" integer NOT NULL,
    "run_time" timestamp with time zone DEFAULT "now"(),
    "total_items" integer,
    "categorized_items" integer,
    "uncategorized_items" integer,
    "uncategorized_percentage" numeric(5,2),
    "triggered_by" "text",
    "run_duration_ms" integer
);


ALTER TABLE "public"."categorization_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."categorization_dashboard" WITH ("security_invoker"='on') AS
 SELECT "date_trunc"('day'::"text", "categorization_logs"."run_time") AS "day",
    "count"(*) AS "runs",
    ("avg"("categorization_logs"."uncategorized_percentage"))::numeric(5,2) AS "avg_uncategorized_pct",
    ("min"("categorization_logs"."uncategorized_percentage"))::numeric(5,2) AS "best_run",
    ("max"("categorization_logs"."uncategorized_percentage"))::numeric(5,2) AS "worst_run",
    ("avg"("categorization_logs"."run_duration_ms"))::integer AS "avg_duration_ms",
    "sum"("categorization_logs"."categorized_items") AS "total_items_categorized",
        CASE
            WHEN ("avg"("categorization_logs"."uncategorized_percentage") <= (10)::numeric) THEN 'Excellent'::"text"
            WHEN ("avg"("categorization_logs"."uncategorized_percentage") <= (20)::numeric) THEN 'Good'::"text"
            WHEN ("avg"("categorization_logs"."uncategorized_percentage") <= (30)::numeric) THEN 'Fair'::"text"
            ELSE 'Needs Attention'::"text"
        END AS "status"
   FROM "public"."categorization_logs"
  GROUP BY ("date_trunc"('day'::"text", "categorization_logs"."run_time"))
  ORDER BY ("date_trunc"('day'::"text", "categorization_logs"."run_time")) DESC;


ALTER TABLE "public"."categorization_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."categorization_log_summary" WITH ("security_invoker"='on') AS
 SELECT "categorization_logs"."id",
    "categorization_logs"."run_time",
    "categorization_logs"."total_items",
    "categorization_logs"."categorized_items",
    "categorization_logs"."uncategorized_items",
    "categorization_logs"."uncategorized_percentage",
    "categorization_logs"."triggered_by",
    "categorization_logs"."run_duration_ms",
        CASE
            WHEN ("categorization_logs"."uncategorized_percentage" <= (10)::numeric) THEN 'Excellent'::"text"
            WHEN ("categorization_logs"."uncategorized_percentage" <= (20)::numeric) THEN 'Good'::"text"
            WHEN ("categorization_logs"."uncategorized_percentage" <= (30)::numeric) THEN 'Fair'::"text"
            ELSE 'Needs Attention'::"text"
        END AS "status"
   FROM "public"."categorization_logs"
  ORDER BY "categorization_logs"."run_time" DESC;


ALTER TABLE "public"."categorization_log_summary" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorization_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."categorization_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorization_logs_id_seq" OWNED BY "public"."categorization_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."categorization_notifications" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "threshold_percentage" numeric(5,2) DEFAULT 20.0,
    "consecutive_days" integer DEFAULT 3,
    "is_active" boolean DEFAULT true,
    "last_notified" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categorization_notifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorization_notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."categorization_notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorization_notifications_id_seq" OWNED BY "public"."categorization_notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."order_guide_category_keywords" (
    "id" integer NOT NULL,
    "category_id" integer NOT NULL,
    "keyword" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."order_guide_category_keywords" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."category_keyword_effectiveness" WITH ("security_invoker"='on') AS
 SELECT "oc"."category_name",
    "ock"."keyword",
    "count"("ogi"."id") AS "items_matched",
    "round"(((("count"("ogi"."id"))::numeric * 100.0) / (NULLIF("total_items"."cnt", 0))::numeric), 2) AS "percentage_of_category"
   FROM ((("public"."order_guide_categories" "oc"
     JOIN "public"."order_guide_category_keywords" "ock" ON (("ock"."category_id" = "oc"."id")))
     LEFT JOIN "public"."order_guide_items" "ogi" ON ((("ogi"."category_id" = "oc"."id") AND ("ogi"."item_name" ~~* (('%'::"text" || "ock"."keyword") || '%'::"text")))))
     LEFT JOIN ( SELECT "order_guide_items"."category_id",
            "count"(*) AS "cnt"
           FROM "public"."order_guide_items"
          GROUP BY "order_guide_items"."category_id") "total_items" ON (("total_items"."category_id" = "oc"."id")))
  GROUP BY "oc"."category_name", "ock"."keyword", "total_items"."cnt"
  ORDER BY "oc"."category_name", ("count"("ogi"."id")) DESC;


ALTER TABLE "public"."category_keyword_effectiveness" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_goals" (
    "id" bigint NOT NULL,
    "location_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "cost_percent_goal" numeric NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cost_goals_category_check" CHECK (("category" = ANY (ARRAY['Labor'::"text", 'Food'::"text", 'Beverage'::"text"])))
);


ALTER TABLE "public"."cost_goals" OWNER TO "postgres";


ALTER TABLE "public"."cost_goals" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cost_goals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."daily_briefing_logs" (
    "id" bigint NOT NULL,
    "location_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "content" "text",
    "manager_notes" "text",
    "team_shoutouts" "text",
    "shift_callouts" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_briefing_logs" OWNER TO "postgres";


ALTER TABLE "public"."daily_briefing_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."daily_briefing_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."daily_briefings" (
    "id" bigint NOT NULL,
    "location_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "lunch" integer,
    "dinner" integer,
    "forecast_notes" "text",
    "forecasted_sales" numeric,
    "actual_sales" numeric,
    "variance_notes" "text",
    "shoutout" "text",
    "reminders" "text",
    "mindset" "text",
    "food_items" "text",
    "food_image_url" "text",
    "beverage_items" "text",
    "beverage_image_url" "text",
    "events" "text",
    "repair_notes" "text",
    "manager" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "weather_icon" "text",
    "weather_conditions" "text",
    "weather_temp_high" numeric,
    "weather_temp_low" numeric
);


ALTER TABLE "public"."daily_briefings" OWNER TO "postgres";


ALTER TABLE "public"."daily_briefings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."daily_briefings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."employee_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "available_start" time without time zone NOT NULL,
    "available_end" time without time zone NOT NULL,
    "preferred_departments" "text"[] DEFAULT '{}'::"text"[],
    "max_hours_per_week" integer DEFAULT 40,
    "min_hours_per_week" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "valid_hours" CHECK (("max_hours_per_week" >= "min_hours_per_week")),
    CONSTRAINT "valid_time_range" CHECK (("available_end" > "available_start"))
);


ALTER TABLE "public"."employee_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "wage_rate" numeric DEFAULT 0,
    "location_id" "uuid",
    "organization_id" "uuid",
    "user_id" "uuid",
    "department" "text" DEFAULT 'FOH'::"text",
    "hourly_rate" numeric(10,2) DEFAULT 15.00,
    "performance_rating" numeric(3,2) DEFAULT 4.0,
    "hire_date" "date" DEFAULT CURRENT_DATE,
    "status" "text" DEFAULT 'active'::"text",
    "phone" "text",
    "email" "text",
    "emergency_contact" "text",
    "availability" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forecast_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date" "date",
    "forecast_total" integer,
    "forecast_am" integer,
    "forecast_pm" integer,
    "actual_total" integer,
    "actual_am" integer,
    "actual_pm" integer,
    "food_cost" numeric,
    "bev_cost" numeric,
    "labor_cost" numeric,
    "location_id" "uuid"
);


ALTER TABLE "public"."forecast_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fva_daily_history" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "location_id_uuid" "uuid",
    "forecast_sales" numeric,
    "actual_sales" numeric,
    "variance_dollar" numeric,
    "variance_percent" numeric,
    "food_cost_pct" numeric,
    "bev_cost_pct" numeric,
    "labor_cost_pct" numeric,
    "alert" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location_id" bigint,
    "location_uuid" "uuid",
    "forecast_guests" integer,
    "forecast_pax" integer,
    "am_guests" integer,
    "pm_guests" integer
);


ALTER TABLE "public"."fva_daily_history" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fva_daily_history"."forecast_guests" IS 'Forecasted number of guests (diners) for the day';



COMMENT ON COLUMN "public"."fva_daily_history"."forecast_pax" IS 'Forecasted number of covers/pax for the day';



COMMENT ON COLUMN "public"."fva_daily_history"."am_guests" IS 'Forecasted/recorded guests for AM service';



COMMENT ON COLUMN "public"."fva_daily_history"."pm_guests" IS 'Forecasted/recorded guests for PM service';



ALTER TABLE "public"."fva_daily_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fva_daily_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fva_dashboard_data" (
    "id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "forecasted_sales" numeric,
    "actual_sales" numeric,
    "actual_labor_cost" numeric,
    "labor_percent" numeric,
    "labor_goal" numeric,
    "actual_food_cost" numeric,
    "food_percent" numeric,
    "food_goal" numeric,
    "actual_beverage_cost" numeric,
    "beverage_percent" numeric,
    "beverage_goal" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fva_dashboard_data" OWNER TO "postgres";


ALTER TABLE "public"."fva_dashboard_data" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fva_dashboard_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."fva_history_rollup_view" WITH ("security_invoker"='on') AS
 SELECT "d"."location_id_uuid" AS "location_id",
    ("date_trunc"('month'::"text", ("d"."date")::timestamp with time zone))::"date" AS "month",
    "sum"("d"."forecast_sales") AS "total_forecast_sales",
    "sum"("d"."actual_sales") AS "total_actual_sales",
    "sum"(("d"."actual_sales" * COALESCE("d"."food_cost_pct", (0)::numeric))) AS "total_actual_food_cost",
    "sum"(("d"."forecast_sales" * COALESCE("d"."food_cost_pct", (0)::numeric))) AS "total_forecast_food_cost",
    "sum"(("d"."actual_sales" * COALESCE("d"."bev_cost_pct", (0)::numeric))) AS "total_actual_bev_cost",
    "sum"(("d"."forecast_sales" * COALESCE("d"."bev_cost_pct", (0)::numeric))) AS "total_forecast_bev_cost",
    "sum"(("d"."actual_sales" * COALESCE("d"."labor_cost_pct", (0)::numeric))) AS "total_actual_labor_cost",
    "sum"(("d"."forecast_sales" * COALESCE("d"."labor_cost_pct", (0)::numeric))) AS "total_forecast_labor_cost",
    "avg"("d"."food_cost_pct") AS "avg_food_cost_pct",
    "avg"("d"."bev_cost_pct") AS "avg_bev_cost_pct",
    "avg"("d"."labor_cost_pct") AS "avg_labor_cost_pct"
   FROM "public"."fva_daily_history" "d"
  GROUP BY "d"."location_id_uuid", (("date_trunc"('month'::"text", ("d"."date")::timestamp with time zone))::"date");


ALTER TABLE "public"."fva_history_rollup_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labor_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "total_shifts" integer DEFAULT 0,
    "total_hours" numeric(10,2) DEFAULT 0,
    "total_cost" numeric(10,2) DEFAULT 0,
    "department_breakdown" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."labor_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labor_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "labor_cost_goal" numeric NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."labor_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_metadata" (
    "location_id" bigint NOT NULL,
    "city" "text",
    "state" "text",
    "lat" numeric NOT NULL,
    "lon" numeric NOT NULL,
    "timezone" "text" NOT NULL
);


ALTER TABLE "public"."location_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid",
    "timezone" "text" DEFAULT 'America/New_York'::"text" NOT NULL,
    "organization_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


ALTER TABLE "public"."locations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."og_categories" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."og_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."og_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."og_categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."og_categories_id_seq" OWNED BY "public"."og_categories"."id";



CREATE TABLE IF NOT EXISTS "public"."og_categorization_logs" (
    "id" integer NOT NULL,
    "run_type" "text" NOT NULL,
    "total_count" integer NOT NULL,
    "categorized_count" integer NOT NULL,
    "uncategorized_count" integer NOT NULL,
    "uncategorized_percentage" numeric(5,2) NOT NULL,
    "duration_ms" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."og_categorization_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."og_categorization_logs_new_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."og_categorization_logs_new_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."og_categorization_logs_new_id_seq" OWNED BY "public"."og_categorization_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."og_items" (
    "id" integer NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."og_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."og_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."og_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."og_items_id_seq" OWNED BY "public"."og_items"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."order_guide_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_guide_categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_guide_categories_id_seq" OWNED BY "public"."order_guide_categories"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."order_guide_category_keywords_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_guide_category_keywords_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_guide_category_keywords_id_seq" OWNED BY "public"."order_guide_category_keywords"."id";



CREATE TABLE IF NOT EXISTS "public"."order_guide_location_items" (
    "location_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_guide_location_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" integer NOT NULL,
    "order_number" "text" NOT NULL,
    "vendor" "text",
    "description" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."orders_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."orders_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."orders_id_seq" OWNED BY "public"."orders"."id";



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


ALTER TABLE "public"."organizations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "location_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pto_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "request_type" "text" DEFAULT 'vacation'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "manager_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "denial_reason" "text",
    "approved_at" timestamp with time zone,
    "denied_at" timestamp with time zone,
    "approved_by" "uuid",
    "denied_by" "uuid",
    "notes" "text",
    "days_requested" integer,
    CONSTRAINT "pto_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text"])))
);


ALTER TABLE "public"."pto_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" bigint NOT NULL,
    "purchase_id" bigint NOT NULL,
    "vendor_sku" "text",
    "item_name" "text",
    "quantity" numeric,
    "unit" "text",
    "unit_cost" numeric,
    "line_total" numeric,
    "category" "text",
    "matched_order_guide_item_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_items_category_check" CHECK (("category" = ANY (ARRAY['Food'::"text", 'Beverage'::"text", 'Cleaning Supplies'::"text", 'Paper Goods'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."purchase_items" OWNER TO "postgres";


ALTER TABLE "public"."purchase_items" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."purchase_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" bigint NOT NULL,
    "location_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "vendor" "text",
    "subtotal" numeric,
    "tax" numeric,
    "shipping" numeric,
    "total" numeric,
    "source_file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


ALTER TABLE "public"."purchases" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."purchases_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."request_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."request_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_templates" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "industry_type" "text" NOT NULL,
    "spend_per_guest" numeric(10,2) DEFAULT 0 NOT NULL,
    "labor_percentage_target" numeric(5,2) DEFAULT 0 NOT NULL,
    "default_shifts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "default_roles" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "default_departments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."restaurant_templates" OWNER TO "postgres";


ALTER TABLE "public"."restaurant_templates" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."restaurant_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rollup_errors" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "route" "text" NOT NULL,
    "function_name" "text" NOT NULL,
    "target_date" "date",
    "location_id" "uuid",
    "message" "text" NOT NULL,
    "context" "jsonb"
);


ALTER TABLE "public"."rollup_errors" OWNER TO "postgres";


ALTER TABLE "public"."rollup_errors" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."rollup_errors_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."schedule_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "requested_date" timestamp with time zone NOT NULL,
    "preferred_shift_start" time without time zone,
    "preferred_shift_end" time without time zone,
    "preferred_department" "text",
    "preferred_role" "text",
    "end_date" timestamp with time zone,
    "target_employee_id" "uuid",
    "original_shift_id" "uuid",
    "reason" "text",
    "priority" "text" DEFAULT 'normal'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "manager_id" "uuid",
    "manager_notes" "text",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedule_requests_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "schedule_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['shift_preference'::"text", 'time_off'::"text", 'shift_swap'::"text", 'schedule_change'::"text"]))),
    CONSTRAINT "schedule_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_date_range" CHECK ((("end_date" IS NULL) OR ("end_date" >= "requested_date"))),
    CONSTRAINT "valid_shift_time" CHECK ((("request_type" = 'time_off'::"text") OR (("preferred_shift_start" IS NOT NULL) AND ("preferred_shift_end" IS NOT NULL) AND ("preferred_shift_end" > "preferred_shift_start"))))
);


ALTER TABLE "public"."schedule_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_start_date" "date" NOT NULL,
    "schedule_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'draft'::"text",
    "location_id" "uuid"
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "schedule_id" "uuid",
    "shift_date" "date" NOT NULL,
    "shift_type" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "role" "text" NOT NULL,
    "hourly_rate" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shift_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "day" "date" NOT NULL,
    "shift_type" "text" NOT NULL,
    "role" "text" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hours" numeric,
    "rate" numeric,
    "position" "text",
    "location_id" "uuid",
    "department" "text",
    CONSTRAINT "chk_hours_positive" CHECK ((("hours" IS NULL) OR ("hours" >= (0)::numeric))),
    CONSTRAINT "chk_rate_positive" CHECK ((("rate" IS NULL) OR ("rate" >= (0)::numeric))),
    CONSTRAINT "shifts_department_check" CHECK ((("department" IS NULL) OR ("department" = ANY (ARRAY['FOH'::"text", 'BOH'::"text"]))))
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "state" "text",
    "timezone" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "latitude" double precision,
    "longitude" double precision
);


ALTER TABLE "public"."store_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_table" (
    "id" integer NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."test_table" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."test_table_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."test_table_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."test_table_id_seq" OWNED BY "public"."test_table"."id";



CREATE TABLE IF NOT EXISTS "public"."user_locations" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_locations" OWNER TO "postgres";


ALTER TABLE "public"."user_locations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v1_order_guide" WITH ("security_invoker"='on') AS
 SELECT "v1_order_guide"."item_id",
    "v1_order_guide"."location_id",
    "v1_order_guide"."category",
    "v1_order_guide"."category_rank",
    "v1_order_guide"."item_name",
    "v1_order_guide"."unit",
    "v1_order_guide"."on_hand",
    "v1_order_guide"."par_level",
    "v1_order_guide"."order_quantity",
    "v1_order_guide"."inventory_status",
    "v1_order_guide"."item_status",
    "v1_order_guide"."unit_cost",
    "v1_order_guide"."total_cost",
    "v1_order_guide"."vendor_name",
    "v1_order_guide"."brand",
    "v1_order_guide"."notes",
    "v1_order_guide"."last_ordered_at"
   FROM "public"."v1_order_guide";


ALTER TABLE "public"."v1_order_guide" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v2_order_guide" WITH ("security_invoker"='on') AS
 SELECT "v2_order_guide"."item_id",
    "v2_order_guide"."location_id",
    "v2_order_guide"."item_name",
    "v2_order_guide"."item_description",
    "v2_order_guide"."status",
    "v2_order_guide"."category_id",
    "v2_order_guide"."category_name",
    "v2_order_guide"."created_at"
   FROM "public"."v2_order_guide";


ALTER TABLE "public"."v2_order_guide" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_og_categorization_summary" WITH ("security_invoker"='on') AS
 SELECT "og_categorization_logs"."run_type",
    "count"(*) AS "run_count",
    "avg"("og_categorization_logs"."total_count") AS "avg_total_count",
    "avg"("og_categorization_logs"."categorized_count") AS "avg_categorized_count",
    "avg"("og_categorization_logs"."uncategorized_count") AS "avg_uncategorized_count",
    "avg"("og_categorization_logs"."uncategorized_percentage") AS "avg_uncategorized_percentage",
    "avg"("og_categorization_logs"."duration_ms") AS "avg_duration_ms",
    "max"("og_categorization_logs"."created_at") AS "last_run_at"
   FROM "public"."og_categorization_logs"
  GROUP BY "og_categorization_logs"."run_type"
  ORDER BY ("max"("og_categorization_logs"."created_at")) DESC;


ALTER TABLE "public"."v_og_categorization_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_order_guide" WITH ("security_invoker"='on') AS
 SELECT "v_order_guide"."item_id",
    "v_order_guide"."location_id",
    "v_order_guide"."category",
    "v_order_guide"."category_rank",
    "v_order_guide"."item_name",
    "v_order_guide"."unit",
    "v_order_guide"."par_level",
    "v_order_guide"."on_hand",
    "v_order_guide"."order_quantity",
    "v_order_guide"."inventory_status",
    "v_order_guide"."item_status",
    "v_order_guide"."unit_cost",
    "v_order_guide"."forecast",
    "v_order_guide"."total_cost",
    "v_order_guide"."vendor_name",
    "v_order_guide"."brand",
    "v_order_guide"."notes",
    "v_order_guide"."last_ordered_at"
   FROM "public"."v_order_guide";


ALTER TABLE "public"."v_order_guide" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_order_guide_active" WITH ("security_invoker"='on') AS
 SELECT "v_order_guide_active"."id",
    "v_order_guide_active"."name",
    "v_order_guide_active"."display_name",
    "v_order_guide_active"."category",
    "v_order_guide_active"."category_rank",
    "v_order_guide_active"."unit",
    "v_order_guide_active"."status",
    "v_order_guide_active"."forecast",
    "v_order_guide_active"."actual",
    "v_order_guide_active"."variance",
    "v_order_guide_active"."par_level",
    "v_order_guide_active"."cost_per_unit",
    "v_order_guide_active"."unit_cost",
    "v_order_guide_active"."vendor",
    "v_order_guide_active"."description",
    "v_order_guide_active"."sku",
    "v_order_guide_active"."category_id",
    "v_order_guide_active"."created_at",
    "v_order_guide_active"."item_id",
    "v_order_guide_active"."location_id",
    "v_order_guide_active"."location_added_at",
    "v_order_guide_active"."is_active_at_location"
   FROM "public"."v_order_guide_active";


ALTER TABLE "public"."v_order_guide_active" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_order_guide_backup" WITH ("security_invoker"='on') AS
 SELECT "v_order_guide_backup"."item_id",
    "v_order_guide_backup"."location_id",
    "v_order_guide_backup"."category",
    "v_order_guide_backup"."category_rank",
    "v_order_guide_backup"."item_name",
    "v_order_guide_backup"."unit",
    "v_order_guide_backup"."par_level",
    "v_order_guide_backup"."on_hand",
    "v_order_guide_backup"."order_quantity",
    "v_order_guide_backup"."inventory_status",
    "v_order_guide_backup"."item_status",
    "v_order_guide_backup"."unit_cost",
    "v_order_guide_backup"."forecast",
    "v_order_guide_backup"."total_cost",
    "v_order_guide_backup"."vendor_name",
    "v_order_guide_backup"."brand",
    "v_order_guide_backup"."notes",
    "v_order_guide_backup"."last_ordered_at"
   FROM "public"."v_order_guide_backup";


ALTER TABLE "public"."v_order_guide_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_name" "text" NOT NULL,
    "contact_name" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_daily_labor_summary" WITH ("security_invoker"='on') AS
 SELECT "sh"."location_id",
    "sh"."day",
    "sh"."department",
    "count"(DISTINCT "sh"."employee_id") AS "scheduled_employees",
    "sum"("sh"."hours") AS "total_scheduled_hours",
    "sum"(("sh"."hours" * COALESCE("e"."wage_rate", (0)::numeric))) AS "total_scheduled_cost",
    "avg"(COALESCE("e"."wage_rate", (0)::numeric)) AS "avg_wage_rate"
   FROM ("public"."shifts" "sh"
     LEFT JOIN "public"."employees" "e" ON (("e"."id" = "sh"."employee_id")))
  GROUP BY "sh"."location_id", "sh"."day", "sh"."department";


ALTER TABLE "public"."vw_daily_labor_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_weekly_labor_summary" WITH ("security_invoker"='on') AS
 SELECT "s"."location_id",
    "s"."week_start_date",
    "s"."status",
    "count"(DISTINCT "sh"."employee_id") AS "scheduled_employees",
    "sum"("sh"."hours") AS "total_scheduled_hours",
    "sum"(("sh"."hours" * COALESCE("e"."wage_rate", (0)::numeric))) AS "total_scheduled_cost",
    "avg"(COALESCE("e"."wage_rate", (0)::numeric)) AS "avg_wage_rate"
   FROM (("public"."schedules" "s"
     LEFT JOIN "public"."shifts" "sh" ON (("sh"."schedule_id" = "s"."id")))
     LEFT JOIN "public"."employees" "e" ON (("e"."id" = "sh"."employee_id")))
  GROUP BY "s"."location_id", "s"."week_start_date", "s"."status";


ALTER TABLE "public"."vw_weekly_labor_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weather_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid",
    "forecast_date" "date" NOT NULL,
    "temperature_low" integer,
    "temperature_high" integer,
    "conditions" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weather_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_forecast_data" (
    "id" bigint NOT NULL,
    "location_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "guest_count" numeric,
    "capture_rate" numeric,
    "expected_sales" numeric,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weekly_forecast_data" OWNER TO "postgres";


ALTER TABLE "public"."weekly_forecast_data" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."weekly_forecast_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."weekly_forecasts" (
    "id" bigint NOT NULL,
    "location_id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "day" "text",
    "pax" bigint,
    "guests" numeric,
    "sales" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."weekly_forecasts" OWNER TO "postgres";


ALTER TABLE "public"."weekly_forecasts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."weekly_forecasts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."weekly_order_guide_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "weekly_order_guide_id" "uuid" NOT NULL,
    "order_guide_item_id" "uuid" NOT NULL,
    "quantity" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."weekly_order_guide_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_order_guides" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "week_number" integer NOT NULL,
    "year" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL
);


ALTER TABLE "public"."weekly_order_guides" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categorization_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categorization_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categorization_notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categorization_notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."og_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."og_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."og_categorization_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."og_categorization_logs_new_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."og_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."og_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_guide_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_guide_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_guide_category_keywords" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_guide_category_keywords_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."orders" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."orders_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."test_table" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."test_table_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorization_logs"
    ADD CONSTRAINT "categorization_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorization_notifications"
    ADD CONSTRAINT "categorization_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_goals"
    ADD CONSTRAINT "cost_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_briefing_logs"
    ADD CONSTRAINT "daily_briefing_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_briefings"
    ADD CONSTRAINT "daily_briefings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_availability"
    ADD CONSTRAINT "employee_availability_employee_id_day_of_week_location_id_key" UNIQUE ("employee_id", "day_of_week", "location_id");



ALTER TABLE ONLY "public"."employee_availability"
    ADD CONSTRAINT "employee_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forecast_data"
    ADD CONSTRAINT "forecast_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fva_daily_history"
    ADD CONSTRAINT "fva_daily_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fva_dashboard_data"
    ADD CONSTRAINT "fva_dashboard_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fva_dashboard_data"
    ADD CONSTRAINT "fva_dashboard_data_uniq_date_location" UNIQUE ("date", "location_id");



ALTER TABLE ONLY "public"."labor_analytics"
    ADD CONSTRAINT "labor_analytics_location_id_week_start_date_key" UNIQUE ("location_id", "week_start_date");



ALTER TABLE ONLY "public"."labor_analytics"
    ADD CONSTRAINT "labor_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labor_goals"
    ADD CONSTRAINT "labor_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_metadata"
    ADD CONSTRAINT "location_metadata_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."manual_additions"
    ADD CONSTRAINT "manual_additions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."og_categories"
    ADD CONSTRAINT "og_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."og_categorization_logs"
    ADD CONSTRAINT "og_categorization_logs_new_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."og_items"
    ADD CONSTRAINT "og_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_guide_categories"
    ADD CONSTRAINT "order_guide_categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."order_guide_categories"
    ADD CONSTRAINT "order_guide_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_guide_category_keywords"
    ADD CONSTRAINT "order_guide_category_keywords_category_id_keyword_key" UNIQUE ("category_id", "keyword");



ALTER TABLE ONLY "public"."order_guide_category_keywords"
    ADD CONSTRAINT "order_guide_category_keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_guide_items"
    ADD CONSTRAINT "order_guide_items_location_item_category_uniq" UNIQUE ("location_id", "item_name", "category_id");



ALTER TABLE ONLY "public"."order_guide_items"
    ADD CONSTRAINT "order_guide_items_name_category_location_unique" UNIQUE ("item_name", "category_id", "location_id");



ALTER TABLE ONLY "public"."order_guide_items"
    ADD CONSTRAINT "order_guide_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_guide_location_items"
    ADD CONSTRAINT "order_guide_location_items_pkey" PRIMARY KEY ("location_id", "item_id");



ALTER TABLE ONLY "public"."order_guide_status"
    ADD CONSTRAINT "order_guide_status_item_loc_uniq" UNIQUE ("item_id", "location_id");



ALTER TABLE ONLY "public"."order_guide_status"
    ADD CONSTRAINT "order_guide_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pto_requests"
    ADD CONSTRAINT "pto_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_comments"
    ADD CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_templates"
    ADD CONSTRAINT "restaurant_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."restaurant_templates"
    ADD CONSTRAINT "restaurant_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rollup_errors"
    ADD CONSTRAINT "rollup_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_requests"
    ADD CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_week_start_date_key" UNIQUE ("week_start_date");



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_locations"
    ADD CONSTRAINT "store_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_table"
    ADD CONSTRAINT "test_table_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_guide_items"
    ADD CONSTRAINT "unique_item_category" UNIQUE ("item_name", "category_id");



ALTER TABLE ONLY "public"."order_guide_location_items"
    ADD CONSTRAINT "unique_item_location" UNIQUE ("item_id", "location_id");



ALTER TABLE ONLY "public"."daily_briefings"
    ADD CONSTRAINT "uq_daily_briefings_location_date" UNIQUE ("location_id", "date");



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_user_location_unique" UNIQUE ("user_id", "location_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_vendor_name_key" UNIQUE ("vendor_name");



ALTER TABLE ONLY "public"."weather_data"
    ADD CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weather_data"
    ADD CONSTRAINT "weather_one_per_day_per_location" UNIQUE ("location_id", "forecast_date");



ALTER TABLE ONLY "public"."weekly_forecast_data"
    ADD CONSTRAINT "weekly_forecast_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_forecasts"
    ADD CONSTRAINT "weekly_forecasts_location_id_date_key" UNIQUE ("location_id", "date");



ALTER TABLE ONLY "public"."weekly_forecasts"
    ADD CONSTRAINT "weekly_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_order_guide_items"
    ADD CONSTRAINT "weekly_order_guide_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_order_guide_items"
    ADD CONSTRAINT "weekly_order_guide_items_weekly_order_guide_id_order_guide__key" UNIQUE ("weekly_order_guide_id", "order_guide_item_id");



ALTER TABLE ONLY "public"."weekly_order_guides"
    ADD CONSTRAINT "weekly_order_guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_order_guides"
    ADD CONSTRAINT "weekly_order_guides_week_number_year_key" UNIQUE ("week_number", "year");



CREATE UNIQUE INDEX "daily_briefings_location_date_uniq" ON "public"."daily_briefings" USING "btree" ("location_id", "date");



CREATE INDEX "dbl_location_date_idx" ON "public"."daily_briefing_logs" USING "btree" ("location_id", "date");



CREATE UNIQUE INDEX "fva_dashboard_data_date_loc_uidx" ON "public"."fva_dashboard_data" USING "btree" ("date", "location_id");



CREATE INDEX "idx_availability_employee_id" ON "public"."employee_availability" USING "btree" ("employee_id");



CREATE INDEX "idx_availability_org_location" ON "public"."employee_availability" USING "btree" ("organization_id", "location_id");



CREATE INDEX "idx_category_keywords_category_id" ON "public"."order_guide_category_keywords" USING "btree" ("category_id");



CREATE INDEX "idx_category_keywords_keyword" ON "public"."order_guide_category_keywords" USING "btree" ("keyword");



CREATE INDEX "idx_comments_request" ON "public"."request_comments" USING "btree" ("request_id");



CREATE INDEX "idx_cost_goals_loc_cat_eff" ON "public"."cost_goals" USING "btree" ("location_id", "category", "effective_from" DESC);



CREATE UNIQUE INDEX "idx_cost_goals_location_category_effective" ON "public"."cost_goals" USING "btree" ("location_id", "category", "effective_from");



CREATE INDEX "idx_daily_briefing_logs_created_by" ON "public"."daily_briefing_logs" USING "btree" ("created_by");



CREATE INDEX "idx_daily_briefings_created_by" ON "public"."daily_briefings" USING "btree" ("created_by");



CREATE INDEX "idx_daily_briefings_date" ON "public"."daily_briefings" USING "btree" ("date");



CREATE INDEX "idx_daily_briefings_location" ON "public"."daily_briefings" USING "btree" ("location_id");



CREATE INDEX "idx_employees_location_id" ON "public"."employees" USING "btree" ("location_id");



CREATE INDEX "idx_employees_organization_id" ON "public"."employees" USING "btree" ("organization_id");



CREATE INDEX "idx_employees_user_id" ON "public"."employees" USING "btree" ("user_id");



CREATE INDEX "idx_fdh_location_id" ON "public"."fva_daily_history" USING "btree" ("location_id");



CREATE INDEX "idx_fdh_location_uuid" ON "public"."fva_daily_history" USING "btree" ("location_uuid");



CREATE INDEX "idx_forecast_data_loc_date" ON "public"."forecast_data" USING "btree" ("location_id", "date");



CREATE INDEX "idx_fva_by_date" ON "public"."fva_dashboard_data" USING "btree" ("date");



CREATE INDEX "idx_fva_by_location" ON "public"."fva_dashboard_data" USING "btree" ("location_id");



CREATE INDEX "idx_fva_daily_history_date" ON "public"."fva_daily_history" USING "btree" ("date");



CREATE INDEX "idx_fva_daily_history_location_date" ON "public"."fva_daily_history" USING "btree" ("location_id_uuid", "date");



CREATE INDEX "idx_fva_daily_history_location_id" ON "public"."fva_daily_history" USING "btree" ("location_id");



CREATE INDEX "idx_fva_daily_history_location_uuid" ON "public"."fva_daily_history" USING "btree" ("location_uuid");



CREATE INDEX "idx_fva_dashboard_data_loc_date" ON "public"."fva_dashboard_data" USING "btree" ("location_id", "date");



CREATE INDEX "idx_labor_goals_location_effective" ON "public"."labor_goals" USING "btree" ("location_id", "effective_from", COALESCE("effective_to", 'infinity'::"date"));



CREATE INDEX "idx_labor_goals_location_id" ON "public"."labor_goals" USING "btree" ("location_id");



CREATE INDEX "idx_locations_organization_id" ON "public"."locations" USING "btree" ("organization_id");



CREATE INDEX "idx_locations_owner" ON "public"."locations" USING "btree" ("owner_id");



CREATE INDEX "idx_locations_owner_id" ON "public"."locations" USING "btree" ("owner_id");



CREATE INDEX "idx_locations_uuid" ON "public"."locations" USING "btree" ("uuid");



CREATE INDEX "idx_manual_additions_active_created" ON "public"."manual_additions" USING "btree" ("is_active", "created_at" DESC);



CREATE INDEX "idx_manual_additions_active_location" ON "public"."manual_additions" USING "btree" ("location_id") WHERE ("is_active" = true);



CREATE INDEX "idx_manual_additions_inactive_created" ON "public"."manual_additions" USING "btree" ("is_active", "created_at" DESC);



CREATE INDEX "idx_manual_additions_is_active" ON "public"."manual_additions" USING "btree" ("is_active");



CREATE INDEX "idx_manual_additions_location" ON "public"."manual_additions" USING "btree" ("location_id");



CREATE INDEX "idx_og_categorization_logs_run_type" ON "public"."og_categorization_logs" USING "btree" ("run_type");



CREATE INDEX "idx_og_items_category" ON "public"."order_guide_items" USING "btree" ("category");



CREATE INDEX "idx_og_status_item_loc" ON "public"."order_guide_status" USING "btree" ("item_id", "location_id");



CREATE INDEX "idx_ogi_location_category_rank" ON "public"."order_guide_items" USING "btree" ("location_id", "category", "category_rank");



CREATE INDEX "idx_order_guide_category_keywords_keyword" ON "public"."order_guide_category_keywords" USING "btree" ("keyword");



CREATE INDEX "idx_order_guide_items_category_id" ON "public"."order_guide_items" USING "btree" ("category_id");



CREATE INDEX "idx_profiles_location_id" ON "public"."profiles" USING "btree" ("location_id");



CREATE INDEX "idx_purchase_items_category" ON "public"."purchase_items" USING "btree" ("category");



CREATE INDEX "idx_purchase_items_matched_ogi_id" ON "public"."purchase_items" USING "btree" ("matched_order_guide_item_id");



CREATE INDEX "idx_purchase_items_purchase_id" ON "public"."purchase_items" USING "btree" ("purchase_id");



CREATE INDEX "idx_purchases_location_date" ON "public"."purchases" USING "btree" ("location_id", "invoice_date");



CREATE INDEX "idx_requests_employee_id" ON "public"."schedule_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_requests_org_location" ON "public"."schedule_requests" USING "btree" ("organization_id", "location_id");



CREATE INDEX "idx_requests_status" ON "public"."schedule_requests" USING "btree" ("status");



CREATE INDEX "idx_restaurant_templates_active" ON "public"."restaurant_templates" USING "btree" ("is_active");



CREATE INDEX "idx_restaurant_templates_industry" ON "public"."restaurant_templates" USING "btree" ("industry_type");



CREATE INDEX "idx_schedules_location" ON "public"."schedules" USING "btree" ("location_id");



CREATE UNIQUE INDEX "idx_schedules_location_week" ON "public"."schedules" USING "btree" ("location_id", "week_start_date");



CREATE INDEX "idx_schedules_week" ON "public"."schedules" USING "btree" ("week_start_date");



CREATE INDEX "idx_shifts_day" ON "public"."shifts" USING "btree" ("day");



CREATE INDEX "idx_shifts_employee" ON "public"."shifts" USING "btree" ("employee_id");



CREATE INDEX "idx_shifts_employee_id" ON "public"."shifts" USING "btree" ("employee_id");



CREATE INDEX "idx_shifts_loc_day" ON "public"."shifts" USING "btree" ("location_id", "day");



CREATE INDEX "idx_shifts_location_day" ON "public"."shifts" USING "btree" ("location_id", "day");



CREATE INDEX "idx_shifts_schedule" ON "public"."shifts" USING "btree" ("schedule_id");



CREATE INDEX "idx_shifts_schedule_day_type_role" ON "public"."shifts" USING "btree" ("schedule_id", "day", "shift_type", "role");



CREATE INDEX "idx_shifts_schedule_id" ON "public"."shifts" USING "btree" ("schedule_id");



CREATE INDEX "idx_ul_user_location" ON "public"."user_locations" USING "btree" ("user_id", "location_id");



CREATE INDEX "idx_user_locations_location_id" ON "public"."user_locations" USING "btree" ("location_id");



CREATE INDEX "idx_user_locations_user_id" ON "public"."user_locations" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_weekly_forecast_data_created_by" ON "public"."weekly_forecast_data" USING "btree" ("created_by");



CREATE INDEX "idx_weekly_forecasts_date" ON "public"."weekly_forecasts" USING "btree" ("date");



CREATE INDEX "idx_weekly_forecasts_location_id" ON "public"."weekly_forecasts" USING "btree" ("location_id");



CREATE INDEX "idx_weekly_ogi_item_id" ON "public"."weekly_order_guide_items" USING "btree" ("order_guide_item_id");



CREATE UNIQUE INDEX "order_guide_items_item_cat_uniq" ON "public"."order_guide_items" USING "btree" ("item_name", "category_id");



CREATE INDEX "order_guide_status_location_id_idx" ON "public"."order_guide_status" USING "btree" ("location_id");



CREATE INDEX "purchases_loc_invoice_idx" ON "public"."purchases" USING "btree" ("location_id", "invoice_date");



CREATE INDEX "rollup_errors_loc_date_idx" ON "public"."rollup_errors" USING "btree" ("location_id", "target_date");



CREATE INDEX "rollup_errors_occurred_at_desc_idx" ON "public"."rollup_errors" USING "btree" ("occurred_at" DESC);



CREATE INDEX "shifts_day_location_idx" ON "public"."shifts" USING "btree" ("day", "location_id");



CREATE INDEX "shifts_department_idx" ON "public"."shifts" USING "btree" ("department");



CREATE INDEX "shifts_loc_day_idx" ON "public"."shifts" USING "btree" ("location_id", "day");



CREATE UNIQUE INDEX "unique_item_name" ON "public"."order_guide_items" USING "btree" ("item_name") WHERE ("item_name" IS NOT NULL);



CREATE UNIQUE INDEX "uq_forecast_data_loc_date" ON "public"."forecast_data" USING "btree" ("location_id", "date");



CREATE UNIQUE INDEX "uq_order_guide_status_loc_item" ON "public"."order_guide_status" USING "btree" ("location_id", "item_id");



CREATE UNIQUE INDEX "uq_schedules_location_week" ON "public"."schedules" USING "btree" ("location_id", "week_start_date");



CREATE UNIQUE INDEX "user_roles_user_role_unique" ON "public"."user_roles" USING "btree" ("user_id", "role");



CREATE UNIQUE INDEX "ux_daily_briefings_location_date" ON "public"."daily_briefings" USING "btree" ("location_id", "date");



CREATE INDEX "wfd_location_week_idx" ON "public"."weekly_forecast_data" USING "btree" ("location_id", "week_start_date");



CREATE OR REPLACE TRIGGER "categorize_new_item" BEFORE INSERT ON "public"."order_guide_items" FOR EACH ROW EXECUTE FUNCTION "public"."categorize_order_guide_item"();



CREATE OR REPLACE TRIGGER "categorize_updated_item" BEFORE UPDATE OF "item_name" ON "public"."order_guide_items" FOR EACH ROW WHEN (("old"."item_name" IS DISTINCT FROM "new"."item_name")) EXECUTE FUNCTION "public"."categorize_order_guide_item"();



CREATE OR REPLACE TRIGGER "manual_additions_soft_delete" BEFORE DELETE ON "public"."manual_additions" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_manual_additions_delete"();



CREATE OR REPLACE TRIGGER "order_auto_categorize_trigger" BEFORE INSERT OR UPDATE OF "description", "vendor" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."auto_categorize_order"();



CREATE OR REPLACE TRIGGER "order_categorization_trigger" AFTER UPDATE OF "category" ON "public"."orders" FOR EACH ROW WHEN (("old"."category" IS DISTINCT FROM "new"."category")) EXECUTE FUNCTION "public"."send_categorization_notification"();



CREATE OR REPLACE TRIGGER "set_schedules_timestamp" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_shifts_timestamp" BEFORE UPDATE ON "public"."shifts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_shifts_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_order_guide_category_keywords" BEFORE UPDATE ON "public"."order_guide_category_keywords" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."order_guide_status" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_guide_status_updated_at"();



CREATE OR REPLACE TRIGGER "trg_daily_briefings_set_updated_at" BEFORE UPDATE ON "public"."daily_briefings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_og_items_autostatus" AFTER INSERT ON "public"."order_guide_items" FOR EACH ROW EXECUTE FUNCTION "public"."_og_status_autocreate_for_location"();



CREATE OR REPLACE TRIGGER "trg_profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_restaurant_templates_updated_at" BEFORE UPDATE ON "public"."restaurant_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_order_guide_rank" BEFORE INSERT OR UPDATE ON "public"."order_guide_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_guide_rank"();



ALTER TABLE ONLY "public"."daily_briefing_logs"
    ADD CONSTRAINT "daily_briefing_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."daily_briefings"
    ADD CONSTRAINT "daily_briefings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employee_availability"
    ADD CONSTRAINT "employee_availability_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cost_goals"
    ADD CONSTRAINT "fk_cost_goals_location" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "fk_employees_location" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labor_goals"
    ADD CONSTRAINT "fk_labor_goals_location" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "fk_schedules_location" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "fk_shifts_location" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fva_daily_history"
    ADD CONSTRAINT "fva_daily_history_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."labor_analytics"
    ADD CONSTRAINT "labor_analytics_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_metadata"
    ADD CONSTRAINT "location_metadata_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_guide_category_keywords"
    ADD CONSTRAINT "order_guide_category_keywords_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."order_guide_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_guide_items"
    ADD CONSTRAINT "order_guide_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."order_guide_categories"("id");



ALTER TABLE ONLY "public"."order_guide_location_items"
    ADD CONSTRAINT "order_guide_location_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."order_guide_items"("id");



ALTER TABLE ONLY "public"."order_guide_status"
    ADD CONSTRAINT "order_guide_status_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."order_guide_items"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."pto_requests"
    ADD CONSTRAINT "pto_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pto_requests"
    ADD CONSTRAINT "pto_requests_denied_by_fkey" FOREIGN KEY ("denied_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pto_requests"
    ADD CONSTRAINT "pto_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pto_requests"
    ADD CONSTRAINT "pto_requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_matched_order_guide_item_id_fkey" FOREIGN KEY ("matched_order_guide_item_id") REFERENCES "public"."order_guide_items"("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_comments"
    ADD CONSTRAINT "request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."request_comments"
    ADD CONSTRAINT "request_comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."schedule_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_requests"
    ADD CONSTRAINT "schedule_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_requests"
    ADD CONSTRAINT "schedule_requests_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."schedule_requests"
    ADD CONSTRAINT "schedule_requests_target_employee_id_fkey" FOREIGN KEY ("target_employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."store_locations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weather_data"
    ADD CONSTRAINT "weather_data_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."store_locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_forecast_data"
    ADD CONSTRAINT "weekly_forecast_data_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."weekly_forecasts"
    ADD CONSTRAINT "weekly_forecasts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_order_guide_items"
    ADD CONSTRAINT "weekly_order_guide_items_order_guide_item_id_fkey" FOREIGN KEY ("order_guide_item_id") REFERENCES "public"."order_guide_items"("id");



ALTER TABLE ONLY "public"."weekly_order_guide_items"
    ADD CONSTRAINT "weekly_order_guide_items_weekly_order_guide_id_fkey" FOREIGN KEY ("weekly_order_guide_id") REFERENCES "public"."weekly_order_guides"("id") ON DELETE CASCADE;



CREATE POLICY "Admin select only" ON "public"."manual_additions" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"));



CREATE POLICY "Allow authenticated delete from order_guide_items" ON "public"."order_guide_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated delete from order_guide_status" ON "public"."order_guide_status" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated insert to order_guide_items" ON "public"."order_guide_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated insert to order_guide_status" ON "public"."order_guide_status" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated read access to order_guide_items" ON "public"."order_guide_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to order_guide_status" ON "public"."order_guide_status" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update to order_guide_items" ON "public"."order_guide_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated update to order_guide_status" ON "public"."order_guide_status" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to create keywords" ON "public"."order_guide_category_keywords" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to delete categories" ON "public"."order_guide_categories" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete items" ON "public"."order_guide_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete keywords" ON "public"."order_guide_category_keywords" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete location items" ON "public"."order_guide_location_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert categories" ON "public"."order_guide_categories" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert items" ON "public"."order_guide_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert location items" ON "public"."order_guide_location_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update categories" ON "public"."order_guide_categories" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update items" ON "public"."order_guide_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update keywords" ON "public"."order_guide_category_keywords" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update location items" ON "public"."order_guide_location_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view categories" ON "public"."order_guide_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view items" ON "public"."order_guide_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view keywords" ON "public"."order_guide_category_keywords" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view location items" ON "public"."order_guide_location_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."manual_additions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow read access for authenticated" ON "public"."manual_additions" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("current_setting"('app.current_location'::"text", true) IS NOT NULL) AND ("location_id" = ("current_setting"('app.current_location'::"text", true))::"uuid")));



CREATE POLICY "Allow update for authenticated users" ON "public"."manual_additions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Archived by current_location" ON "public"."manual_additions" FOR SELECT TO "authenticated" USING ((("is_active" = false) AND ("location_id" = ("current_setting"('app.current_location'::"text"))::"uuid")));



CREATE POLICY "Authenticated can read categories" ON "public"."og_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Briefings delete by membership" ON "public"."daily_briefings" FOR DELETE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Briefings insert by membership" ON "public"."daily_briefings" FOR INSERT TO "authenticated" WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Briefings read by membership" ON "public"."daily_briefings" FOR SELECT TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Briefings update by membership" ON "public"."daily_briefings" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Delete by creator" ON "public"."daily_briefing_logs" FOR DELETE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Delete by creator" ON "public"."weekly_forecast_data" FOR DELETE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Delete own role" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete access for admins only" ON "public"."order_guide_categories" FOR DELETE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."order_guide_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update access for admins only" ON "public"."order_guide_categories" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Enable write access for admins only" ON "public"."order_guide_categories" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "FDH access via location_id" ON "public"."fva_daily_history" TO "authenticated" USING (("location_id" IN ( SELECT "l"."id"
   FROM "public"."locations" "l"
  WHERE ("l"."owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "l"."id"
   FROM "public"."locations" "l"
  WHERE ("l"."owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "FDH access via location_uuid" ON "public"."fva_daily_history" TO "authenticated" USING (("location_uuid" IN ( SELECT "l"."uuid"
   FROM "public"."locations" "l"
  WHERE ("l"."owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_uuid" IN ( SELECT "l"."uuid"
   FROM "public"."locations" "l"
  WHERE ("l"."owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "FDH delete assigned" ON "public"."fva_daily_history" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ul"."location_id" = "fva_daily_history"."location_uuid")))));



CREATE POLICY "FDH insert assigned" ON "public"."fva_daily_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ul"."location_id" = "fva_daily_history"."location_uuid")))));



CREATE POLICY "FDH select assigned" ON "public"."fva_daily_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ul"."location_id" = "fva_daily_history"."location_uuid")))));



CREATE POLICY "FDH update assigned" ON "public"."fva_daily_history" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ul"."location_id" = "fva_daily_history"."location_uuid"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ul"."location_id" = "fva_daily_history"."location_uuid")))));



CREATE POLICY "FVA delete by membership" ON "public"."fva_daily_history" FOR DELETE TO "authenticated" USING (("location_uuid" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "FVA insert by membership" ON "public"."fva_daily_history" FOR INSERT TO "authenticated" WITH CHECK (("location_uuid" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "FVA read by membership" ON "public"."fva_daily_history" FOR SELECT TO "authenticated" USING (("location_uuid" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "FVA update by membership" ON "public"."fva_daily_history" FOR UPDATE TO "authenticated" USING (("location_uuid" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_uuid" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Insert if matches current_location" ON "public"."order_guide_status" FOR INSERT TO "authenticated" WITH CHECK (("location_id" = ("current_setting"('app.current_location'::"text"))::"uuid"));



CREATE POLICY "Insert own role" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Locations delete assigned" ON "public"."locations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."location_id" = "locations"."uuid") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Locations delete own" ON "public"."locations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Locations insert assigned" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."location_id" = "locations"."uuid") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Locations insert own" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Locations update assigned" ON "public"."locations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."location_id" = "locations"."uuid") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."location_id" = "locations"."uuid") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Locations update own" ON "public"."locations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Locations view assigned" ON "public"."locations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_locations" "ul"
  WHERE (("ul"."location_id" = "locations"."uuid") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Locations view own" ON "public"."locations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Managers and admins can delete items" ON "public"."order_guide_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can delete status" ON "public"."order_guide_status" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can insert items" ON "public"."order_guide_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can insert status" ON "public"."order_guide_status" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can update items" ON "public"."order_guide_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can update status" ON "public"."order_guide_status" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can view all items" ON "public"."order_guide_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Managers and admins can view all status" ON "public"."order_guide_status" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



CREATE POLICY "Org member view" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."organization_id" = "organizations"."id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Read by authenticated" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."categorization_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."categorization_notifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."cost_goals" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."forecast_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."fva_dashboard_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."og_categorization_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."og_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."orders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."purchase_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."purchases" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."rollup_errors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."test_table" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."vendors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."weekly_order_guide_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read by authenticated" ON "public"."weekly_order_guides" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Service role full access categories" ON "public"."og_categories" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Staff can update on-hand quantities" ON "public"."order_guide_status" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'staff'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'staff'::"text")))));



CREATE POLICY "Staff can view all items" ON "public"."order_guide_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'staff'::"text")))));



CREATE POLICY "Staff can view all status" ON "public"."order_guide_status" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'staff'::"text")))));



CREATE POLICY "Templates read" ON "public"."restaurant_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "UL view own" ON "public"."user_locations" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Update own role" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage PTO requests for their location" ON "public"."pto_requests" USING (("location_id" IN ( SELECT "locations"."uuid"
   FROM "public"."locations"
  WHERE ("locations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage labor analytics for their location" ON "public"."labor_analytics" USING (("location_id" IN ( SELECT "locations"."uuid"
   FROM "public"."locations"
  WHERE ("locations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage shift assignments for their location" ON "public"."shift_assignments" USING (("location_id" IN ( SELECT "locations"."uuid"
   FROM "public"."locations"
  WHERE ("locations"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users delete own profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "WF delete assigned" ON "public"."weekly_forecasts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."id" = "weekly_forecasts"."location_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "WF insert assigned" ON "public"."weekly_forecasts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."id" = "weekly_forecasts"."location_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "WF update assigned" ON "public"."weekly_forecasts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."id" = "weekly_forecasts"."location_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."id" = "weekly_forecasts"."location_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "WF view assigned" ON "public"."weekly_forecasts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."locations" "l"
     JOIN "public"."user_locations" "ul" ON (("ul"."location_id" = "l"."uuid")))
  WHERE (("l"."id" = "weekly_forecasts"."location_id") AND ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "availability_delete_own" ON "public"."employee_availability" FOR DELETE TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "availability_insert_own" ON "public"."employee_availability" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "availability_select_own" ON "public"."employee_availability" FOR SELECT TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "availability_update_own" ON "public"."employee_availability" FOR UPDATE TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorization_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorization_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_select_own" ON "public"."request_comments" FOR SELECT TO "authenticated" USING (("request_id" IN ( SELECT "schedule_requests"."id"
   FROM "public"."schedule_requests"
  WHERE ("schedule_requests"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."cost_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_briefing_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_briefings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dev read items" ON "public"."order_guide_items" FOR SELECT USING (true);



CREATE POLICY "dev read manual" ON "public"."manual_additions" FOR SELECT USING (true);



CREATE POLICY "dev update items" ON "public"."order_guide_items" FOR UPDATE USING (true);



CREATE POLICY "dev write items" ON "public"."order_guide_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "dev write manual" ON "public"."manual_additions" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."employee_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_delete_own" ON "public"."employees" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "employees_delete_policy" ON "public"."employees" FOR DELETE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "employees_insert_own" ON "public"."employees" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "employees_insert_policy" ON "public"."employees" FOR INSERT TO "authenticated" WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "employees_select_own" ON "public"."employees" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "employees_select_policy" ON "public"."employees" FOR SELECT TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "employees_update_own" ON "public"."employees" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "employees_update_policy" ON "public"."employees" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."forecast_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fva_daily_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fva_dashboard_data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert status" ON "public"."order_guide_status" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."labor_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labor_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "labor_goals_delete_policy" ON "public"."labor_goals" FOR DELETE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "labor_goals_insert_policy" ON "public"."labor_goals" FOR INSERT TO "authenticated" WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "labor_goals_select_policy" ON "public"."labor_goals" FOR SELECT TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "labor_goals_update_policy" ON "public"."labor_goals" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_additions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."og_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."og_categorization_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."og_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_guide_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_guide_category_keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_guide_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_guide_location_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_guide_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pto_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read items" ON "public"."order_guide_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read og items (public)" ON "public"."order_guide_items" FOR SELECT TO "anon" USING (true);



CREATE POLICY "read og status (public)" ON "public"."order_guide_status" FOR SELECT TO "anon" USING (true);



CREATE POLICY "read status" ON "public"."order_guide_status" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."request_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requests_delete_own" ON "public"."schedule_requests" FOR DELETE TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "requests_insert_own" ON "public"."schedule_requests" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "requests_select_own" ON "public"."schedule_requests" FOR SELECT TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "requests_update_own" ON "public"."schedule_requests" FOR UPDATE TO "authenticated" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."restaurant_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rollup_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedules_delete_policy" ON "public"."schedules" FOR DELETE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "schedules_insert_policy" ON "public"."schedules" FOR INSERT TO "authenticated" WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "schedules_select_policy" ON "public"."schedules" FOR SELECT TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "schedules_update_policy" ON "public"."schedules" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."shift_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shifts_delete_policy" ON "public"."shifts" FOR DELETE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "shifts_insert_policy" ON "public"."shifts" FOR INSERT TO "authenticated" WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "shifts_select_policy" ON "public"."shifts" FOR SELECT TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "shifts_update_policy" ON "public"."shifts" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("location_id" IN ( SELECT "ul"."location_id"
   FROM "public"."user_locations" "ul"
  WHERE ("ul"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."test_table" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update status" ON "public"."order_guide_status" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_forecast_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_order_guide_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_order_guides" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";







































































































































































































































GRANT ALL ON FUNCTION "public"."_og_status_autocreate_for_location"() TO "anon";
GRANT ALL ON FUNCTION "public"."_og_status_autocreate_for_location"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_og_status_autocreate_for_location"() TO "service_role";



GRANT ALL ON FUNCTION "public"."activate_all_order_guide_items"("location_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_all_order_guide_items"("location_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_all_order_guide_items"("location_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" integer, "p_keywords" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" integer, "p_keywords" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" integer, "p_keywords" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" bigint, "p_keywords" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" bigint, "p_keywords" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_category_keywords"("p_category_id" bigint, "p_keywords" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_keyword"("p_category_name" "text", "p_new_keyword" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_keyword"("p_category_name" "text", "p_new_keyword" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_keyword"("p_category_name" "text", "p_new_keyword" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_og_keyword"("category_name" "text", "keyword" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_og_keyword"("category_name" "text", "keyword" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_og_keyword"("category_name" "text", "keyword" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" "text", "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" "text", "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location"("p_category_id" "text", "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location_int"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location_int"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_order_guide_item_for_location_int"("p_category_id" integer, "p_item_name" "text", "p_unit" "text", "p_location" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_missing_categories"("location_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_missing_categories"("location_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_missing_categories"("location_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_categorize_item"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_categorize_item"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_categorize_item"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_categorize_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_categorize_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_categorize_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_order_needs"("location_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_order_needs"("location_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_order_needs"("location_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("location_uuid" "uuid", "date_param" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("location_uuid" "uuid", "date_param" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("location_uuid" "uuid", "date_param" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."categorize_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."categorize_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."categorize_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."categorize_items_by_name"("location_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."categorize_items_by_name"("location_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."categorize_items_by_name"("location_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."categorize_order_guide_item"() TO "anon";
GRANT ALL ON FUNCTION "public"."categorize_order_guide_item"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."categorize_order_guide_item"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_categorization_quality"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_categorization_quality"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_categorization_quality"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clone_order_guide_items"("source_location_id" "uuid", "target_location_id" "uuid", "only_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."clone_order_guide_items"("source_location_id" "uuid", "target_location_id" "uuid", "only_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clone_order_guide_items"("source_location_id" "uuid", "target_location_id" "uuid", "only_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."copy_order_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."copy_order_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."copy_order_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_daily_briefing_with_carryforward"("p_date" "date", "p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_daily_briefing_with_carryforward"("p_date" "date", "p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_daily_briefing_with_carryforward"("p_date" "date", "p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_weekly_order_guide"("p_week_number" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_weekly_order_guide"("p_week_number" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_weekly_order_guide"("p_week_number" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_location_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_location_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_location_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_categorization_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_categorization_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_categorization_check"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_category_keywords"("p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_category_keywords"("p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_category_keywords"("p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."duplicate_daily_briefings_for_tomorrow"("p_run_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_daily_briefings_for_tomorrow"("p_run_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_daily_briefings_for_tomorrow"("p_run_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_unique_item_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_unique_item_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_unique_item_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_categories_by_keyword"("p_keyword" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_categories_by_keyword"("p_keyword" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_categories_by_keyword"("p_keyword" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_categories_by_keyword_v1"("p_keyword" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_categories_by_keyword_v1"("p_keyword" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_categories_by_keyword_v1"("p_keyword" "text") TO "service_role";



GRANT ALL ON PROCEDURE "public"."fix_duplicate_items"() TO "anon";
GRANT ALL ON PROCEDURE "public"."fix_duplicate_items"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."fix_duplicate_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_empty_order_guide_names"("location_filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fix_empty_order_guide_names"("location_filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_empty_order_guide_names"("location_filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_briefing_if_missing"("p_location_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_briefing_if_missing"("p_location_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_briefing_if_missing"("p_location_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_briefings_all_locations"("p_run_ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_briefings_all_locations"("p_run_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_briefings_all_locations"("p_run_ts" timestamp with time zone) TO "service_role";



GRANT ALL ON TABLE "public"."order_guide_categories" TO "anon";
GRANT ALL ON TABLE "public"."order_guide_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."order_guide_categories" TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("location_uuid" "uuid", "week_start" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("location_uuid" "uuid", "week_start" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_weekly_order_guide"("location_uuid" "uuid", "week_start" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_actual_or_forecast_sales"("p_location_id" "uuid", "p_day" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_actual_or_forecast_sales"("p_location_id" "uuid", "p_day" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_actual_or_forecast_sales"("p_location_id" "uuid", "p_day" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_and_store_weather"("location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_and_store_weather"("location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_and_store_weather"("location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_keywords"("p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_keywords"("p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_keywords"("p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_keywords_new"("p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_keywords_new"("p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_keywords_new"("p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_keywords_v2"("p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_keywords_v2"("p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_keywords_v2"("p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_labor_summary"("p_location_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_labor_summary"("p_location_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_labor_summary"("p_location_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_duplicate_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_duplicate_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_duplicate_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_items_by_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_items_by_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_items_by_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_items_by_category"("p_category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_month_rollup"("p_location_id" "uuid", "p_as_of" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_month_rollup"("p_location_id" "uuid", "p_as_of" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_month_rollup"("p_location_id" "uuid", "p_as_of" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mtd_fva"("p_location_id" "uuid", "p_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_split"("p_location_id" "uuid", "p_month_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mtd_fva_split_v2"("p_location_id" "uuid", "p_month_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_split_v2"("p_location_id" "uuid", "p_month_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_split_v2"("p_location_id" "uuid", "p_month_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mtd_fva_v2"("p_location_id" "uuid", "p_month_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_v2"("p_location_id" "uuid", "p_month_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mtd_fva_v2"("p_location_id" "uuid", "p_month_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_guide_categorization_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_guide_categorization_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_guide_categorization_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_guide_category_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_guide_category_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_guide_category_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_suggested_category"("p_item_name" "text", "p_vendor" "text", "p_brand" "text", "p_distributor" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_suggested_category"("p_item_name" "text", "p_vendor" "text", "p_brand" "text", "p_distributor" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_suggested_category"("p_item_name" "text", "p_vendor" "text", "p_brand" "text", "p_distributor" "text") TO "service_role";



GRANT ALL ON TABLE "public"."order_guide_items" TO "anon";
GRANT ALL ON TABLE "public"."order_guide_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_guide_items" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_uncategorized_order_guide_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_uncategorized_order_guide_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_uncategorized_order_guide_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weekly_order_guide"("p_guide_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_weekly_order_guide"("p_guide_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_order_guide"("p_guide_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_yesterday_actual_sales"("briefing_date" "date", "p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_yesterday_actual_sales"("briefing_date" "date", "p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_yesterday_actual_sales"("briefing_date" "date", "p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ytd_fva"("location_id" "uuid", "as_of_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_split"("p_location_id" "uuid", "p_as_of" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ytd_fva_split_v2"("p_location_id" "uuid", "p_as_of" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_split_v2"("p_location_id" "uuid", "p_as_of" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_split_v2"("p_location_id" "uuid", "p_as_of" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ytd_fva_v2"("p_location_id" "uuid", "p_as_of" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_v2"("p_location_id" "uuid", "p_as_of" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_v2"("p_location_id" "uuid", "p_as_of" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ytd_fva_v3"("p_location_id" "uuid", "p_as_of" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_v3"("p_location_id" "uuid", "p_as_of" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ytd_fva_v3"("p_location_id" "uuid", "p_as_of" "date") TO "service_role";



GRANT ALL ON TABLE "public"."order_guide_status" TO "anon";
GRANT ALL ON TABLE "public"."order_guide_status" TO "authenticated";
GRANT ALL ON TABLE "public"."order_guide_status" TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("_location_id" "uuid", "_item_id" "uuid", "_item_name" "text", "_on_hand" numeric, "_par_level" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("_location_id" "uuid", "_item_id" "uuid", "_item_name" "text", "_on_hand" numeric, "_par_level" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("_location_id" "uuid", "_item_id" "uuid", "_item_name" "text", "_on_hand" numeric, "_par_level" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("actual" integer, "forecast" integer, "item_id" "uuid", "unit" "text", "location_id" "uuid", "item_name" "text", "category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("loc_id" "uuid", "item_id" "uuid", "forecast" numeric, "actual" numeric, "unit" "text", "item_name" "text", "category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("loc_id" "uuid", "item_id" "uuid", "forecast" numeric, "actual" numeric, "unit" "text", "item_name" "text", "category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status"("loc_id" "uuid", "item_id" "uuid", "forecast" numeric, "actual" numeric, "unit" "text", "item_name" "text", "category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_order_guide_status_v2"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status_v2"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_order_guide_status_v2"("p_location_id" "uuid", "p_item_id" "uuid", "p_forecast" numeric, "p_actual" numeric, "p_unit" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_keywords_to_og_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_keywords_to_og_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_keywords_to_og_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_order_guide_item"("source_location_id" "uuid", "target_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_order_guide_item"("source_location_id" "uuid", "target_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_order_guide_item"("source_location_id" "uuid", "target_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_manual_additions_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_manual_additions_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_manual_additions_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."preview_keyword_categorization"("p_category_id" bigint, "p_keyword" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."preview_keyword_categorization"("p_category_id" bigint, "p_keyword" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preview_keyword_categorization"("p_category_id" bigint, "p_keyword" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recategorize_all_order_guide_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."recategorize_all_order_guide_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recategorize_all_order_guide_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item"("p_item_id" bigint, "p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item"("p_item_id" bigint, "p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item"("p_item_id" bigint, "p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item_v1"("p_item_id" "uuid", "p_category_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item_v1"("p_item_id" "uuid", "p_category_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recategorize_order_guide_item_v1"("p_item_id" "uuid", "p_category_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."rollup_fva_all_for_day"("p_day" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."rollup_fva_all_for_day"("p_day" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollup_fva_all_for_day"("p_day" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."rollup_fva_daily"("p_day" "date", "p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rollup_fva_daily"("p_day" "date", "p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollup_fva_daily"("p_day" "date", "p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rollup_fva_daily_all_locations"("target_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."rollup_fva_daily_all_locations"("target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollup_fva_daily_all_locations"("target_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_categorization"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_categorization"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_categorization"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_fetch_weather"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_fetch_weather"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_fetch_weather"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_fetch_weather_for_timezone"("target_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_fetch_weather_for_timezone"("target_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_fetch_weather_for_timezone"("target_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_scheduled_categorization"("trigger_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_scheduled_categorization"("trigger_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_scheduled_categorization"("trigger_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_categorization_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_categorization_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_categorization_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_location"("loc_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_location"("loc_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_location"("loc_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_current_location_from_header"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_current_location_from_header"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_current_location_from_header"() TO "authenticator";
GRANT ALL ON FUNCTION "public"."set_current_location_from_header"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_location_from_header"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."set_order_guide_rank"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_guide_rank"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_guide_rank"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_order_guide_categories"("location_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_shifts_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_shifts_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_shifts_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_guide_status_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_guide_status_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_guide_status_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."manual_additions" TO "anon";
GRANT ALL ON TABLE "public"."manual_additions" TO "authenticated";
GRANT ALL ON TABLE "public"."manual_additions" TO "service_role";



GRANT ALL ON TABLE "public"."archived_manual_additions" TO "anon";
GRANT ALL ON TABLE "public"."archived_manual_additions" TO "authenticated";
GRANT ALL ON TABLE "public"."archived_manual_additions" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorization_logs" TO "anon";
GRANT ALL ON TABLE "public"."categorization_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."categorization_logs" TO "service_role";



GRANT ALL ON TABLE "public"."categorization_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."categorization_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."categorization_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."categorization_log_summary" TO "anon";
GRANT ALL ON TABLE "public"."categorization_log_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."categorization_log_summary" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorization_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorization_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorization_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorization_notifications" TO "anon";
GRANT ALL ON TABLE "public"."categorization_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."categorization_notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorization_notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorization_notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorization_notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_guide_category_keywords" TO "anon";
GRANT ALL ON TABLE "public"."order_guide_category_keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."order_guide_category_keywords" TO "service_role";



GRANT ALL ON TABLE "public"."category_keyword_effectiveness" TO "anon";
GRANT ALL ON TABLE "public"."category_keyword_effectiveness" TO "authenticated";
GRANT ALL ON TABLE "public"."category_keyword_effectiveness" TO "service_role";



GRANT ALL ON TABLE "public"."cost_goals" TO "anon";
GRANT ALL ON TABLE "public"."cost_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_goals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cost_goals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cost_goals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cost_goals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."daily_briefing_logs" TO "anon";
GRANT ALL ON TABLE "public"."daily_briefing_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_briefing_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_briefing_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_briefing_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_briefing_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."daily_briefings" TO "anon";
GRANT ALL ON TABLE "public"."daily_briefings" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_briefings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_briefings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_briefings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_briefings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employee_availability" TO "anon";
GRANT ALL ON TABLE "public"."employee_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_availability" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."forecast_data" TO "anon";
GRANT ALL ON TABLE "public"."forecast_data" TO "authenticated";
GRANT ALL ON TABLE "public"."forecast_data" TO "service_role";



GRANT ALL ON TABLE "public"."fva_daily_history" TO "anon";
GRANT ALL ON TABLE "public"."fva_daily_history" TO "authenticated";
GRANT ALL ON TABLE "public"."fva_daily_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fva_daily_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fva_daily_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fva_daily_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fva_dashboard_data" TO "anon";
GRANT ALL ON TABLE "public"."fva_dashboard_data" TO "authenticated";
GRANT ALL ON TABLE "public"."fva_dashboard_data" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fva_dashboard_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fva_dashboard_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fva_dashboard_data_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fva_history_rollup_view" TO "anon";
GRANT ALL ON TABLE "public"."fva_history_rollup_view" TO "authenticated";
GRANT ALL ON TABLE "public"."fva_history_rollup_view" TO "service_role";



GRANT ALL ON TABLE "public"."labor_analytics" TO "anon";
GRANT ALL ON TABLE "public"."labor_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."labor_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."labor_goals" TO "anon";
GRANT ALL ON TABLE "public"."labor_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."labor_goals" TO "service_role";



GRANT ALL ON TABLE "public"."location_metadata" TO "anon";
GRANT ALL ON TABLE "public"."location_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."location_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."og_categories" TO "anon";
GRANT ALL ON TABLE "public"."og_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."og_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."og_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."og_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."og_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."og_categorization_logs" TO "anon";
GRANT ALL ON TABLE "public"."og_categorization_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."og_categorization_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."og_categorization_logs_new_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."og_categorization_logs_new_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."og_categorization_logs_new_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."og_items" TO "anon";
GRANT ALL ON TABLE "public"."og_items" TO "authenticated";
GRANT ALL ON TABLE "public"."og_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."og_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."og_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."og_items_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_guide_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_guide_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_guide_categories_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_guide_category_keywords_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_guide_category_keywords_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_guide_category_keywords_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_guide_location_items" TO "anon";
GRANT ALL ON TABLE "public"."order_guide_location_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_guide_location_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."pto_requests" TO "anon";
GRANT ALL ON TABLE "public"."pto_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."pto_requests" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."request_comments" TO "anon";
GRANT ALL ON TABLE "public"."request_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."request_comments" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_templates" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."restaurant_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."restaurant_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."restaurant_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rollup_errors" TO "anon";
GRANT ALL ON TABLE "public"."rollup_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."rollup_errors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rollup_errors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rollup_errors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rollup_errors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_requests" TO "anon";
GRANT ALL ON TABLE "public"."schedule_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_requests" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."shift_assignments" TO "anon";
GRANT ALL ON TABLE "public"."shift_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."store_locations" TO "anon";
GRANT ALL ON TABLE "public"."store_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."store_locations" TO "service_role";



GRANT ALL ON TABLE "public"."test_table" TO "anon";
GRANT ALL ON TABLE "public"."test_table" TO "authenticated";
GRANT ALL ON TABLE "public"."test_table" TO "service_role";



GRANT ALL ON SEQUENCE "public"."test_table_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_table_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_table_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_locations" TO "anon";
GRANT ALL ON TABLE "public"."user_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."v1_order_guide" TO "anon";
GRANT ALL ON TABLE "public"."v1_order_guide" TO "authenticated";
GRANT ALL ON TABLE "public"."v1_order_guide" TO "service_role";



GRANT ALL ON TABLE "public"."v2_order_guide" TO "anon";
GRANT ALL ON TABLE "public"."v2_order_guide" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_order_guide" TO "service_role";



GRANT ALL ON TABLE "public"."v_og_categorization_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_og_categorization_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_og_categorization_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_order_guide" TO "anon";
GRANT ALL ON TABLE "public"."v_order_guide" TO "authenticated";
GRANT ALL ON TABLE "public"."v_order_guide" TO "service_role";



GRANT ALL ON TABLE "public"."v_order_guide_active" TO "anon";
GRANT ALL ON TABLE "public"."v_order_guide_active" TO "authenticated";
GRANT ALL ON TABLE "public"."v_order_guide_active" TO "service_role";



GRANT ALL ON TABLE "public"."v_order_guide_backup" TO "anon";
GRANT ALL ON TABLE "public"."v_order_guide_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."v_order_guide_backup" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."vw_daily_labor_summary" TO "anon";
GRANT ALL ON TABLE "public"."vw_daily_labor_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_daily_labor_summary" TO "service_role";



GRANT ALL ON TABLE "public"."vw_weekly_labor_summary" TO "anon";
GRANT ALL ON TABLE "public"."vw_weekly_labor_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_weekly_labor_summary" TO "service_role";



GRANT ALL ON TABLE "public"."weather_data" TO "anon";
GRANT ALL ON TABLE "public"."weather_data" TO "authenticated";
GRANT ALL ON TABLE "public"."weather_data" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_forecast_data" TO "anon";
GRANT ALL ON TABLE "public"."weekly_forecast_data" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_forecast_data" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weekly_forecast_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weekly_forecast_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weekly_forecast_data_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."weekly_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_forecasts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weekly_forecasts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weekly_forecasts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weekly_forecasts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_order_guide_items" TO "anon";
GRANT ALL ON TABLE "public"."weekly_order_guide_items" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_order_guide_items" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_order_guides" TO "anon";
GRANT ALL ON TABLE "public"."weekly_order_guides" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_order_guides" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
