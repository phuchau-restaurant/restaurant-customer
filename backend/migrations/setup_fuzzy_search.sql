-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for faster trigram similarity search on dish names
CREATE INDEX IF NOT EXISTS idx_dishes_name_trgm ON dishes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dishes_description_trgm ON dishes USING gin (description gin_trgm_ops);

-- PostgreSQL function for fuzzy search dishes
-- Returns dishes matching the search term with similarity score
-- Updated to filter only active categories

-- Drop existing function first to allow changing return type
DROP FUNCTION IF EXISTS fuzzy_search_dishes(UUID, TEXT, FLOAT);

CREATE OR REPLACE FUNCTION fuzzy_search_dishes(
    p_tenant_id UUID,
    p_search_term TEXT,
    p_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id INTEGER,
    tenant_id UUID,
    category_id INTEGER,
    name VARCHAR(255),
    description TEXT,
    price NUMERIC,
    image_url TEXT,
    is_available BOOLEAN,
    is_recommended BOOLEAN,
    order_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    similarity_score REAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.tenant_id,
        d.category_id,
        d.name,
        d.description,
        d.price,
        d.image_url,
        d.is_available,
        d.is_recommended,
        d.order_count,
        d.created_at,
        d.updated_at,
        GREATEST(
            similarity(d.name, p_search_term),
            similarity(COALESCE(d.description, ''), p_search_term)
        )::REAL AS similarity_score
    FROM dishes d
    INNER JOIN categories c ON d.category_id = c.id
    WHERE 
        d.tenant_id = p_tenant_id
        AND c.is_active = true
        AND (
            similarity(d.name, p_search_term) > p_threshold
            OR similarity(COALESCE(d.description, ''), p_search_term) > p_threshold
            OR d.name ILIKE '%' || p_search_term || '%'
            OR d.description ILIKE '%' || p_search_term || '%'
        )
    ORDER BY similarity_score DESC, d.order_count DESC NULLS LAST
    LIMIT 50;
END;
$$;
