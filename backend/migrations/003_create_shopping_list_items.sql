CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS shopping_list_items_name_unique
ON shopping_list_items (LOWER(TRIM(name)));