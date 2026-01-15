-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for faster trigram similarity search on dish names
CREATE INDEX IF NOT EXISTS idx_dishes_name_trgm ON dishes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dishes_description_trgm ON dishes USING gin (description gin_trgm_ops);

-- PostgreSQL function for fuzzy search dishes
-- Returns dishes matching the search term with similarity score
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
    price DECIMAL(10,2),
    img_url TEXT,
    is_available BOOLEAN,
    order_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.tenant_id,
        d.category_id,
        d.name,
        d.description,
        d.price,
        d.img_url,
        d.is_available,
        d.order_count,
        d.created_at,
        d.updated_at,
        GREATEST(
            similarity(d.name, p_search_term),
            similarity(COALESCE(d.description, ''), p_search_term)
        ) as similarity_score
    FROM dishes d
    WHERE 
        d.tenant_id = p_tenant_id
        AND (
            similarity(d.name, p_search_term) > p_threshold
            OR similarity(COALESCE(d.description, ''), p_search_term) > p_threshold
            OR d.name ILIKE '%' || p_search_term || '%'
            OR d.description ILIKE '%' || p_search_term || '%'
        )
    ORDER BY similarity_score DESC, d.order_count DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
